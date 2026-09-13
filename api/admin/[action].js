/* Consolidated admin API — ONE serverless function handling all /api/admin/*
   routes (Vercel Hobby allows max 12 functions, so admin endpoints are merged
   here). Every action enforces server-side authorization. */
var crypto = require("crypto");
var db = require("../_db");
var auth = require("../_auth");
var pkg = require("../_pkg");
var seed = require("../_seed");
var mail = require("../_mail");
var blob = require("@vercel/blob");

var STATUSES = ["new", "contacted", "in_progress", "confirmed", "closed"];

module.exports = async function (req, res) {
  var url = new URL(req.url, "http://x");
  var m = url.pathname.match(/\/api\/admin\/([^\/?]+)/);
  var action = m ? m[1] : (url.searchParams.get("action") || "");
  try {
    switch (action) {
      case "setup": return await doSetup(req, res);
      case "login": return await doLogin(req, res);
      case "logout": return await doLogout(req, res);
      case "me": return await doMe(req, res);
      case "password": return await doPassword(req, res);
      case "dashboard": return await doDashboard(req, res);
      case "packages": return await doPackages(req, res);
      case "package": return await doPackage(req, res, url);
      case "actions": return await doActions(req, res);
      case "inquiries": return await doInquiries(req, res, url);
      case "upload": return await doUpload(req, res);
      case "audit": return await doAudit(req, res);
      default: return auth.json(res, 404, { ok: false, error: "not_found" });
    }
  } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error", message: String(e && e.message || "").slice(0, 200) }); }
};

/* ---------- setup (one-time bootstrap) ---------- */
async function doSetup(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  if (!db.dbConfigured()) return auth.json(res, 500, { ok: false, error: "no_database", message: "Database not configured. Create Vercel Postgres and redeploy." });
  if (!auth.secret()) return auth.json(res, 500, { ok: false, error: "no_secret", message: "AUTH_SECRET is not set." });
  if (!process.env.SETUP_TOKEN || (req.headers["x-setup-token"] || "") !== process.env.SETUP_TOKEN) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  await db.ensureSchema();
  var created = false;
  var count = await db.sql`SELECT COUNT(*)::int AS n FROM admins`;
  if (count.rows[0].n === 0) {
    var email = (process.env.ADMIN_INITIAL_EMAIL || "").trim().toLowerCase();
    var pw = process.env.ADMIN_INITIAL_PASSWORD || "";
    if (!email || pw.length < 8) return auth.json(res, 400, { ok: false, error: "bad_initial_admin", message: "Set ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD (8+ chars)." });
    await db.sql`INSERT INTO admins (email, pass, must_change) VALUES (${email}, ${auth.hashPassword(pw)}, TRUE)`;
    created = true;
  }
  var seeded = 0;
  var pc = await db.sql`SELECT COUNT(*)::int AS n FROM packages`;
  if (pc.rows[0].n === 0) {
    for (var i = 0; i < seed.length; i++) {
      var p = seed[i];
      await db.sql`INSERT INTO packages (slug, title, category, country, region, nights, days, price, currency, summary, overview, image, highlights, itinerary, inclusions, exclusions, status, featured, sort)
        VALUES (${p.slug}, ${p.title}, ${p.category}, ${p.country}, ${p.region}, ${p.nights}, ${p.days}, ${p.price}, ${p.currency}, ${p.summary}, ${p.overview}, ${p.image},
        ${JSON.stringify(p.highlights)}, ${JSON.stringify(p.itinerary)}, ${JSON.stringify(p.inclusions)}, ${JSON.stringify(p.exclusions)}, ${p.status}, ${p.featured}, ${p.sort})
        ON CONFLICT (slug) DO NOTHING`;
      seeded++;
    }
  }
  await db.audit("system", "setup", "adminCreated=" + created + " seeded=" + seeded);
  return auth.json(res, 200, { ok: true, adminCreated: created, packagesSeeded: seeded, message: "Setup complete." });
}

/* ---------- login ---------- */
async function doLogin(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  if (!db.dbConfigured() || !auth.secret()) return auth.json(res, 500, { ok: false, error: "not_configured", message: "Admin backend is not configured yet." });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  var body = await auth.readBody(req);
  var email = String(body.email || "").trim().toLowerCase(), password = String(body.password || "");
  if (!email || !password) return auth.json(res, 400, { ok: false, error: "missing", message: "Enter your email and password." });
  var r = await db.sql`SELECT * FROM admins WHERE email = ${email} LIMIT 1`;
  var admin = r.rows[0];
  if (admin && admin.locked_until && new Date(admin.locked_until).getTime() > Date.now()) return auth.json(res, 429, { ok: false, error: "locked", message: "Too many attempts. Try again in a few minutes." });
  if (!admin || !auth.verifyPassword(password, admin.pass)) {
    if (admin) { var failed = (admin.failed || 0) + 1; var lock = failed >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null; await db.sql`UPDATE admins SET failed = ${failed}, locked_until = ${lock} WHERE id = ${admin.id}`; }
    return auth.json(res, 401, { ok: false, error: "invalid", message: "Invalid email or password." });
  }
  await db.sql`UPDATE admins SET failed = 0, locked_until = NULL, last_login = now() WHERE id = ${admin.id}`;
  auth.setSession(res, admin);
  await db.audit(admin.email, "login", null);
  return auth.json(res, 200, { ok: true, email: admin.email, mustChange: admin.must_change });
}

/* ---------- logout ---------- */
async function doLogout(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (admin) { try { await db.sql`UPDATE admins SET token_version = token_version + 1 WHERE id = ${admin.id}`; await db.audit(admin.email, "logout", null); } catch (e) {} }
  auth.clearSession(res);
  return auth.json(res, 200, { ok: true });
}

/* ---------- me ---------- */
async function doMe(req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  return auth.json(res, 200, { ok: true, email: admin.email, mustChange: admin.must_change });
}

/* ---------- change password ---------- */
async function doPassword(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  var body = await auth.readBody(req);
  var current = String(body.current || ""), next = String(body.next || "");
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return auth.json(res, 400, { ok: false, error: "weak", message: "Use at least 8 characters with a letter and a number." });
  var r = await db.sql`SELECT * FROM admins WHERE id = ${admin.id} LIMIT 1`;
  var row = r.rows[0];
  if (!row || !auth.verifyPassword(current, row.pass)) return auth.json(res, 401, { ok: false, error: "bad_current", message: "Your current password is incorrect." });
  await db.sql`UPDATE admins SET pass = ${auth.hashPassword(next)}, must_change = FALSE, token_version = token_version + 1 WHERE id = ${admin.id}`;
  var updated = await db.sql`SELECT id, email, token_version FROM admins WHERE id = ${admin.id} LIMIT 1`;
  auth.setSession(res, updated.rows[0]);
  await db.audit(admin.email, "password_change", null);
  return auth.json(res, 200, { ok: true, message: "Password updated." });
}

/* ---------- dashboard ---------- */
async function doDashboard(req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  var p = await db.sql`SELECT
      COUNT(*) FILTER (WHERE deleted = FALSE)::int AS total,
      COUNT(*) FILTER (WHERE deleted = FALSE AND category = 'National')::int AS national,
      COUNT(*) FILTER (WHERE deleted = FALSE AND category = 'International')::int AS international,
      COUNT(*) FILTER (WHERE deleted = FALSE AND status = 'published')::int AS published,
      COUNT(*) FILTER (WHERE deleted = FALSE AND status = 'draft')::int AS draft,
      COUNT(*) FILTER (WHERE deleted = FALSE AND featured = TRUE)::int AS featured
    FROM packages`;
  var q = await db.sql`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'new')::int AS new,
      COUNT(*) FILTER (WHERE status IN ('contacted','in_progress'))::int AS pending,
      COUNT(*) FILTER (WHERE status IN ('confirmed','closed'))::int AS processed,
      COUNT(*) FILTER (WHERE email_status = 'failed')::int AS email_failed FROM inquiries`;
  return auth.json(res, 200, {
    ok: true, packages: p.rows[0], inquiries: q.rows[0],
    apis: {
      flight: { provider: "AeroDataBox / AviationStack", configured: !!(process.env.AERODATABOX_KEY || process.env.AVIATIONSTACK_KEY) },
      visa: { provider: "Vandana curated (official sources)", configured: true },
      email: { provider: "FormSubmit", configured: true }
    }
  });
}

/* ---------- packages (list / create) ---------- */
async function doPackages(req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (req.method === "GET") {
    var r = await db.sql`SELECT id, slug, title, category, country, region, nights, days, price, currency, image, status, featured, sort, updated_at
      FROM packages WHERE deleted = FALSE ORDER BY sort ASC, id ASC`;
    return auth.json(res, 200, { ok: true, packages: r.rows });
  }
  if (req.method === "POST") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var v = pkg.validate(await auth.readBody(req));
    if (!v.ok) return auth.json(res, 400, { ok: false, error: "invalid", errors: v.errors });
    var d = v.data, base = d.slug, n = 1;
    while (true) { var ex = await db.sql`SELECT 1 FROM packages WHERE slug = ${d.slug} LIMIT 1`; if (!ex.rows.length) break; d.slug = base + "-" + (++n); }
    var ins = await db.sql`INSERT INTO packages (slug, title, category, country, region, nights, days, price, currency, summary, overview, image, highlights, itinerary, inclusions, exclusions, status, featured, sort)
      VALUES (${d.slug}, ${d.title}, ${d.category}, ${d.country}, ${d.region}, ${d.nights}, ${d.days}, ${d.price}, ${d.currency}, ${d.summary}, ${d.overview}, ${d.image},
      ${JSON.stringify(d.highlights)}, ${JSON.stringify(d.itinerary)}, ${JSON.stringify(d.inclusions)}, ${JSON.stringify(d.exclusions)}, ${d.status}, ${d.featured}, ${d.sort}) RETURNING id, slug`;
    await db.audit(admin.email, "package_create", d.title + " (" + ins.rows[0].slug + ")");
    return auth.json(res, 200, { ok: true, id: ins.rows[0].id, slug: ins.rows[0].slug });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}

/* ---------- package (get / update / delete) ---------- */
async function doPackage(req, res, url) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  var id = parseInt(url.searchParams.get("id"), 10) || 0;
  if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });
  if (req.method === "GET") {
    var r = await db.sql`SELECT * FROM packages WHERE id = ${id} AND deleted = FALSE LIMIT 1`;
    if (!r.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    return auth.json(res, 200, { ok: true, package: r.rows[0] });
  }
  if (req.method === "PUT") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var v = pkg.validate(await auth.readBody(req));
    if (!v.ok) return auth.json(res, 400, { ok: false, error: "invalid", errors: v.errors });
    var d = v.data;
    var cur = await db.sql`SELECT slug FROM packages WHERE id = ${id} LIMIT 1`;
    if (!cur.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    var base = d.slug, n = 1;
    while (true) { var ex = await db.sql`SELECT 1 FROM packages WHERE slug = ${d.slug} AND id <> ${id} LIMIT 1`; if (!ex.rows.length) break; d.slug = base + "-" + (++n); }
    await db.sql`UPDATE packages SET slug=${d.slug}, title=${d.title}, category=${d.category}, country=${d.country}, region=${d.region},
      nights=${d.nights}, days=${d.days}, price=${d.price}, currency=${d.currency}, summary=${d.summary}, overview=${d.overview}, image=${d.image},
      highlights=${JSON.stringify(d.highlights)}, itinerary=${JSON.stringify(d.itinerary)}, inclusions=${JSON.stringify(d.inclusions)}, exclusions=${JSON.stringify(d.exclusions)},
      status=${d.status}, featured=${d.featured}, sort=${d.sort}, updated_at=now() WHERE id=${id}`;
    await db.audit(admin.email, "package_update", d.title + " (#" + id + ")");
    return auth.json(res, 200, { ok: true, slug: d.slug });
  }
  if (req.method === "DELETE") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var hard = url.searchParams.get("hard");
    var g = await db.sql`SELECT title FROM packages WHERE id = ${id} LIMIT 1`;
    if (!g.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    if (hard) await db.sql`DELETE FROM packages WHERE id = ${id}`;
    else await db.sql`UPDATE packages SET deleted = TRUE, status = 'unpublished', updated_at = now() WHERE id = ${id}`;
    await db.audit(admin.email, hard ? "package_delete_hard" : "package_delete", (g.rows[0].title || "") + " (#" + id + ")");
    return auth.json(res, 200, { ok: true });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}

/* ---------- actions (status/featured/duplicate/reorder) ---------- */
async function doActions(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  var body = await auth.readBody(req), op = String(body.op || "");
  if (op === "status") {
    var id = parseInt(body.id, 10), st = String(body.status || "");
    if (["draft", "published", "unpublished"].indexOf(st) < 0) return auth.json(res, 400, { ok: false, error: "bad_status" });
    await db.sql`UPDATE packages SET status = ${st}, updated_at = now() WHERE id = ${id} AND deleted = FALSE`;
    await db.audit(admin.email, "package_status", "#" + id + " -> " + st);
    return auth.json(res, 200, { ok: true });
  }
  if (op === "featured") {
    var fid = parseInt(body.id, 10), f = !!body.featured;
    await db.sql`UPDATE packages SET featured = ${f}, updated_at = now() WHERE id = ${fid} AND deleted = FALSE`;
    await db.audit(admin.email, "package_featured", "#" + fid + " -> " + f);
    return auth.json(res, 200, { ok: true });
  }
  if (op === "duplicate") {
    var did = parseInt(body.id, 10);
    var r = await db.sql`SELECT * FROM packages WHERE id = ${did} AND deleted = FALSE LIMIT 1`;
    if (!r.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    var p = r.rows[0], slug = p.slug + "-copy", n = 1;
    while (true) { var ex = await db.sql`SELECT 1 FROM packages WHERE slug = ${slug} LIMIT 1`; if (!ex.rows.length) break; slug = p.slug + "-copy-" + (++n); }
    var ins = await db.sql`INSERT INTO packages (slug, title, category, country, region, nights, days, price, currency, summary, overview, image, highlights, itinerary, inclusions, exclusions, status, featured, sort)
      VALUES (${slug}, ${p.title + " (Copy)"}, ${p.category}, ${p.country}, ${p.region}, ${p.nights}, ${p.days}, ${p.price}, ${p.currency}, ${p.summary}, ${p.overview}, ${p.image},
      ${JSON.stringify(p.highlights)}, ${JSON.stringify(p.itinerary)}, ${JSON.stringify(p.inclusions)}, ${JSON.stringify(p.exclusions)}, 'draft', FALSE, ${(p.sort || 0) + 1}) RETURNING id`;
    await db.audit(admin.email, "package_duplicate", "#" + did + " -> #" + ins.rows[0].id);
    return auth.json(res, 200, { ok: true, id: ins.rows[0].id });
  }
  if (op === "reorder") {
    var ids = Array.isArray(body.ids) ? body.ids : [];
    for (var i = 0; i < ids.length; i++) { var pid = parseInt(ids[i], 10); if (!pid) continue; await db.sql`UPDATE packages SET sort = ${i}, updated_at = now() WHERE id = ${pid}`; }
    await db.audit(admin.email, "package_reorder", ids.length + " items");
    return auth.json(res, 200, { ok: true });
  }
  return auth.json(res, 400, { ok: false, error: "bad_op" });
}

/* ---------- inquiries (list / one / status / retry email / delete) ---------- */
async function doInquiries(req, res, url) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  var id = parseInt(url.searchParams.get("id"), 10) || 0;
  if (req.method === "GET") {
    if (id) {
      var one = await db.sql`SELECT * FROM inquiries WHERE id = ${id} LIMIT 1`;
      if (!one.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
      return auth.json(res, 200, { ok: true, inquiry: one.rows[0] });
    }
    // Optional server-side search + status filter (indexed, capped).
    var term = "%" + String(url.searchParams.get("q") || "").trim().toLowerCase() + "%";
    var status = String(url.searchParams.get("status") || "").trim();
    var hasStatus = STATUSES.indexOf(status) >= 0;
    var r;
    if (hasStatus) {
      r = await db.sql`SELECT id, name, email, phone, package, travel_date, status, email_status, created_at FROM inquiries
        WHERE status = ${status} AND (${term} = '%%' OR lower(name) LIKE ${term} OR lower(email) LIKE ${term} OR lower(package) LIKE ${term})
        ORDER BY created_at DESC LIMIT 500`;
    } else {
      r = await db.sql`SELECT id, name, email, phone, package, travel_date, status, email_status, created_at FROM inquiries
        WHERE (${term} = '%%' OR lower(name) LIKE ${term} OR lower(email) LIKE ${term} OR lower(package) LIKE ${term})
        ORDER BY created_at DESC LIMIT 500`;
    }
    return auth.json(res, 200, { ok: true, inquiries: r.rows });
  }
  if (req.method === "PUT") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });
    var body = await auth.readBody(req);
    var g = await db.sql`SELECT * FROM inquiries WHERE id = ${id} LIMIT 1`;
    if (!g.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    // Retry a failed/pending email delivery.
    if (body.op === "retry_email") {
      var q = g.rows[0];
      var ok = await mail.emailTeam({ name: q.name, email: q.email, phone: q.phone, package: q.package, travellers: q.travellers, travel_date: q.travel_date, message: q.message, source: q.source });
      await db.sql`UPDATE inquiries SET email_status = ${ok ? "sent" : "failed"} WHERE id = ${id}`;
      await db.audit(admin.email, "inquiry_retry_email", "#" + id + " -> " + (ok ? "sent" : "failed"));
      return auth.json(res, ok ? 200 : 502, { ok: ok, email_status: ok ? "sent" : "failed", message: ok ? "Email sent." : "Email provider did not accept the message. Try again shortly." });
    }
    // Change workflow status.
    var st = String(body.status || "");
    if (STATUSES.indexOf(st) < 0) return auth.json(res, 400, { ok: false, error: "bad_status" });
    await db.sql`UPDATE inquiries SET status = ${st} WHERE id = ${id}`;
    await db.audit(admin.email, "inquiry_status", "#" + id + " -> " + st);
    return auth.json(res, 200, { ok: true });
  }
  if (req.method === "DELETE") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });
    var d = await db.sql`DELETE FROM inquiries WHERE id = ${id} RETURNING id`;
    if (!d.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    await db.audit(admin.email, "inquiry_delete", "#" + id);
    return auth.json(res, 200, { ok: true });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}

/* ---------- image upload (Vercel Blob) ---------- */
var EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
function sniff(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}
async function doUpload(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return auth.json(res, 500, { ok: false, error: "no_blob", message: "Image storage (Vercel Blob) is not configured." });
  var body = await auth.readBody(req);
  var mt = String(body.data || "").match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!mt) return auth.json(res, 400, { ok: false, error: "bad_data", message: "Please choose a valid image file." });
  var type = mt[1].toLowerCase();
  if (!EXT[type]) return auth.json(res, 415, { ok: false, error: "bad_type", message: "Only JPG, PNG or WEBP are allowed." });
  var buf; try { buf = Buffer.from(mt[2], "base64"); } catch (e) { return auth.json(res, 400, { ok: false, error: "bad_data" }); }
  if (!buf.length) return auth.json(res, 400, { ok: false, error: "empty" });
  if (buf.length > 4 * 1024 * 1024) return auth.json(res, 413, { ok: false, error: "too_large", message: "Image must be 4 MB or smaller." });
  if (sniff(buf) !== type) return auth.json(res, 415, { ok: false, error: "not_image", message: "That file is not a valid image." });
  var name = "packages/" + Date.now() + "-" + crypto.randomBytes(6).toString("hex") + "." + EXT[type];
  var out = await blob.put(name, buf, { access: "public", contentType: type, addRandomSuffix: false });
  await db.audit(admin.email, "image_upload", out.url);
  return auth.json(res, 200, { ok: true, url: out.url });
}

/* ---------- audit log ---------- */
async function doAudit(req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  var r = await db.sql`SELECT admin_email, action, detail, created_at FROM audit_log ORDER BY id DESC LIMIT 100`;
  return auth.json(res, 200, { ok: true, log: r.rows });
}
