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
      case "accept-invite": return await doAcceptInvite(req, res);
      case "logout": return await doLogout(req, res);
      case "me": return await doMe(req, res);
      case "password": return await doPassword(req, res);
      case "profile": return await doProfile(req, res);
      case "dashboard": return await doDashboard(req, res);
      case "packages": return await doPackages(req, res);
      case "package": return await doPackage(req, res, url);
      case "actions": return await doActions(req, res);
      case "inquiries": return await doInquiries(req, res, url);
      case "documents": return await doDocuments(req, res);
      case "document": return await doDocument(req, res, url);
      case "upload": return await doUpload(req, res);
      case "uploadpdf": return await doUploadPdf(req, res);
      case "audit": return await doAudit(req, res, url);
      case "users": return await doUsers(req, res);
      case "user": return await doUser(req, res, url);
      default: return auth.json(res, 404, { ok: false, error: "not_found" });
    }
  } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error", message: String(e && e.message || "").slice(0, 200) }); }
};

/* ---------- authz guards ----------
   need(req,res,perm)  -> active admin with permission (super_admin passes all), else sends 401/403 and returns null.
   needSuper(req,res)  -> active super_admin, else sends 401/403 and returns null.
   perm(admin,res,p)   -> true, or sends 403 and returns false (for method-specific checks). */
async function need(req, res, p) {
  var admin = await auth.requireAdmin(req);
  if (!admin) { auth.json(res, 401, { ok: false, error: "unauthorized" }); return null; }
  if (p && !auth.can(admin, p)) { auth.json(res, 403, { ok: false, error: "forbidden", message: "You don't have permission for this action." }); return null; }
  return admin;
}
async function needSuper(req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) { auth.json(res, 401, { ok: false, error: "unauthorized" }); return null; }
  if (!auth.isSuper(admin)) { auth.json(res, 403, { ok: false, error: "forbidden", message: "This action requires a Super Admin." }); return null; }
  return admin;
}
function perm(admin, res, p) { if (auth.can(admin, p)) return true; auth.json(res, 403, { ok: false, error: "forbidden", message: "You don't have permission for this action." }); return false; }

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
  if (!admin || !admin.pass || !auth.verifyPassword(password, admin.pass)) {
    if (admin) { var failed = (admin.failed || 0) + 1; var lock = failed >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null; await db.sql`UPDATE admins SET failed = ${failed}, locked_until = ${lock} WHERE id = ${admin.id}`; }
    return auth.json(res, 401, { ok: false, error: "invalid", message: "Invalid email or password." });
  }
  if (admin.status && admin.status !== "active") {
    return auth.json(res, 403, { ok: false, error: "not_active", message: admin.status === "invited" ? "This account hasn't been set up yet — please use your invitation link." : "This account has been disabled. Contact a Super Admin." });
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

/* ---------- me (identity + role + effective permissions) ---------- */
async function doMe(req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  return auth.json(res, 200, {
    ok: true, id: admin.id, email: admin.email, name: admin.name || "",
    role: admin.role, isSuper: auth.isSuper(admin),
    permissions: auth.isSuper(admin) ? ["*"] : (admin.permissions || []),
    mustChange: admin.must_change
  });
}

/* ---------- profile (update own name) ---------- */
async function doProfile(req, res) {
  if (req.method !== "PUT" && req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  var name = String((await auth.readBody(req)).name || "").slice(0, 120).trim();
  await db.sql`UPDATE admins SET name = ${name} WHERE id = ${admin.id}`;
  await db.audit(admin.email, "profile_update", null);
  return auth.json(res, 200, { ok: true });
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
  var docs = { total: 0, published: 0 };
  try { var dr = await db.sql`SELECT COUNT(*) FILTER (WHERE deleted=FALSE)::int AS total, COUNT(*) FILTER (WHERE deleted=FALSE AND status='published')::int AS published FROM documents`; docs = dr.rows[0]; } catch (e) {}
  return auth.json(res, 200, {
    ok: true, packages: p.rows[0], inquiries: q.rows[0], documents: docs,
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
    if (!perm(admin, res, "packages.view")) return;
    var r = await db.sql`SELECT id, slug, title, category, country, region, nights, days, price, currency, image, status, featured, sort, updated_at
      FROM packages WHERE deleted = FALSE ORDER BY sort ASC, id ASC`;
    return auth.json(res, 200, { ok: true, packages: r.rows });
  }
  if (req.method === "POST") {
    if (!perm(admin, res, "packages.create")) return;
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
    if (!perm(admin, res, "packages.view")) return;
    var r = await db.sql`SELECT * FROM packages WHERE id = ${id} AND deleted = FALSE LIMIT 1`;
    if (!r.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    return auth.json(res, 200, { ok: true, package: r.rows[0] });
  }
  if (req.method === "PUT") {
    if (!perm(admin, res, "packages.edit")) return;
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
    if (!perm(admin, res, "packages.delete")) return;
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
    if (!perm(admin, res, "packages.publish")) return;
    var id = parseInt(body.id, 10), st = String(body.status || "");
    if (["draft", "published", "unpublished"].indexOf(st) < 0) return auth.json(res, 400, { ok: false, error: "bad_status" });
    await db.sql`UPDATE packages SET status = ${st}, updated_at = now() WHERE id = ${id} AND deleted = FALSE`;
    await db.audit(admin.email, "package_status", "#" + id + " -> " + st);
    return auth.json(res, 200, { ok: true });
  }
  if (op === "featured" || op === "duplicate" || op === "reorder") { if (!perm(admin, res, "packages.edit")) return; }
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
    if (!perm(admin, res, "inquiries.view")) return;
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
    if (!perm(admin, res, "inquiries.edit")) return;
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
    if (!perm(admin, res, "inquiries.delete")) return;
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });
    var d = await db.sql`DELETE FROM inquiries WHERE id = ${id} RETURNING id`;
    if (!d.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    await db.audit(admin.email, "inquiry_delete", "#" + id);
    return auth.json(res, 200, { ok: true });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}

/* ---------- documents (PDF library: list / create) ---------- */
var DOC_STATUS = ["draft", "published", "unpublished"];
function cleanDoc(b) {
  var title = String(b.title == null ? "" : b.title).slice(0, 200).trim();
  var status = String(b.status || "published"); if (DOC_STATUS.indexOf(status) < 0) status = "published";
  return {
    title: title,
    description: String(b.description == null ? "" : b.description).slice(0, 600),
    category: String(b.category || "General").slice(0, 60) || "General",
    file_url: String(b.file_url == null ? "" : b.file_url).slice(0, 600).trim(),
    file_name: String(b.file_name || "").slice(0, 200),
    file_size: Math.max(0, parseInt(b.file_size, 10) || 0),
    status: status,
    sort: Math.max(0, Math.min(9999, parseInt(b.sort, 10) || 0))
  };
}
async function doDocuments(req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (req.method === "GET") {
    if (!perm(admin, res, "documents.view")) return;
    var r = await db.sql`SELECT id, title, description, category, file_url, file_name, file_size, status, sort, updated_at
      FROM documents WHERE deleted = FALSE ORDER BY sort ASC, id ASC`;
    return auth.json(res, 200, { ok: true, documents: r.rows });
  }
  if (req.method === "POST") {
    if (!perm(admin, res, "documents.create")) return;
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var d = cleanDoc(await auth.readBody(req));
    if (!d.title) return auth.json(res, 400, { ok: false, error: "invalid", message: "Title is required." });
    if (!d.file_url) return auth.json(res, 400, { ok: false, error: "invalid", message: "A PDF file or URL is required." });
    var ins = await db.sql`INSERT INTO documents (title, description, category, file_url, file_name, file_size, status, sort)
      VALUES (${d.title}, ${d.description}, ${d.category}, ${d.file_url}, ${d.file_name}, ${d.file_size}, ${d.status}, ${d.sort}) RETURNING id`;
    await db.audit(admin.email, "document_create", d.title);
    return auth.json(res, 200, { ok: true, id: ins.rows[0].id });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}
async function doDocument(req, res, url) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  var id = parseInt(url.searchParams.get("id"), 10) || 0;
  if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });
  if (req.method === "GET") {
    if (!perm(admin, res, "documents.view")) return;
    var r = await db.sql`SELECT * FROM documents WHERE id = ${id} AND deleted = FALSE LIMIT 1`;
    if (!r.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    return auth.json(res, 200, { ok: true, document: r.rows[0] });
  }
  if (req.method === "PUT") {
    if (!perm(admin, res, "documents.edit")) return;
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var d = cleanDoc(await auth.readBody(req));
    if (!d.title) return auth.json(res, 400, { ok: false, error: "invalid", message: "Title is required." });
    if (!d.file_url) return auth.json(res, 400, { ok: false, error: "invalid", message: "A PDF file or URL is required." });
    var ex = await db.sql`SELECT id FROM documents WHERE id = ${id} LIMIT 1`;
    if (!ex.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    await db.sql`UPDATE documents SET title=${d.title}, description=${d.description}, category=${d.category},
      file_url=${d.file_url}, file_name=${d.file_name}, file_size=${d.file_size}, status=${d.status}, sort=${d.sort}, updated_at=now() WHERE id=${id}`;
    await db.audit(admin.email, "document_update", d.title + " (#" + id + ")");
    return auth.json(res, 200, { ok: true });
  }
  if (req.method === "DELETE") {
    if (!perm(admin, res, "documents.delete")) return;
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var g = await db.sql`SELECT title FROM documents WHERE id = ${id} LIMIT 1`;
    if (!g.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
    await db.sql`UPDATE documents SET deleted = TRUE, status = 'unpublished', updated_at = now() WHERE id = ${id}`;
    await db.audit(admin.email, "document_delete", (g.rows[0].title || "") + " (#" + id + ")");
    return auth.json(res, 200, { ok: true });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}

/* ---------- media storage ----------
   By default images/PDFs are stored in the DATABASE (free — no external object
   store needed) and served by /api/media?id=NN. If a Vercel Blob token is
   present, Blob is used instead. Either way the admin gets back a public URL. */
var EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
function sniff(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}
function baseUrl(req) { var host = req.headers.host || ""; return host ? "https://" + host : ""; }
async function storeMedia(req, res, admin, kind, type, buf, ext) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    var name = kind + "s/" + Date.now() + "-" + crypto.randomBytes(6).toString("hex") + "." + ext;
    var out = await blob.put(name, buf, { access: "public", contentType: type, addRandomSuffix: false });
    await db.audit(admin.email, kind + "_upload", out.url);
    return auth.json(res, 200, { ok: true, url: out.url, size: buf.length });
  }
  // Free path: store in the database.
  await db.sql`CREATE TABLE IF NOT EXISTS media (id SERIAL PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'image', content_type TEXT NOT NULL, data TEXT NOT NULL, filename TEXT, size INTEGER DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  var ins = await db.sql`INSERT INTO media (kind, content_type, data, filename, size) VALUES (${kind}, ${type}, ${buf.toString("base64")}, ${kind + "." + ext}, ${buf.length}) RETURNING id`;
  var url = baseUrl(req) + "/api/media?id=" + ins.rows[0].id;
  await db.audit(admin.email, kind + "_upload", "media#" + ins.rows[0].id + " (" + buf.length + "b)");
  return auth.json(res, 200, { ok: true, url: url, size: buf.length });
}

/* ---------- PDF upload ---------- */
async function doUploadPdf(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!perm(admin, res, "media.upload")) return;
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  var body = await auth.readBody(req);
  var mt = String(body.data || "").match(/^data:(application\/pdf);base64,(.+)$/i);
  if (!mt) return auth.json(res, 400, { ok: false, error: "bad_data", message: "Please choose a valid PDF file." });
  var buf; try { buf = Buffer.from(mt[2], "base64"); } catch (e) { return auth.json(res, 400, { ok: false, error: "bad_data" }); }
  if (!buf.length) return auth.json(res, 400, { ok: false, error: "empty" });
  var maxMB = process.env.BLOB_READ_WRITE_TOKEN ? 15 : 4;
  if (buf.length > maxMB * 1024 * 1024) return auth.json(res, 413, { ok: false, error: "too_large", message: "PDF must be " + maxMB + " MB or smaller." });
  if (!(buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) return auth.json(res, 415, { ok: false, error: "not_pdf", message: "That file is not a valid PDF." });
  return await storeMedia(req, res, admin, "pdf", "application/pdf", buf, "pdf");
}

/* ---------- image upload ---------- */
async function doUpload(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!perm(admin, res, "media.upload")) return;
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  var body = await auth.readBody(req);
  var mt = String(body.data || "").match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!mt) return auth.json(res, 400, { ok: false, error: "bad_data", message: "Please choose a valid image file." });
  var type = mt[1].toLowerCase();
  if (!EXT[type]) return auth.json(res, 415, { ok: false, error: "bad_type", message: "Only JPG, PNG or WEBP are allowed." });
  var buf; try { buf = Buffer.from(mt[2], "base64"); } catch (e) { return auth.json(res, 400, { ok: false, error: "bad_data" }); }
  if (!buf.length) return auth.json(res, 400, { ok: false, error: "empty" });
  if (buf.length > 4 * 1024 * 1024) return auth.json(res, 413, { ok: false, error: "too_large", message: "Image must be 4 MB or smaller." });
  if (sniff(buf) !== type) return auth.json(res, 415, { ok: false, error: "not_image", message: "That file is not a valid image." });
  return await storeMedia(req, res, admin, "image", type, buf, EXT[type]);
}

/* ---------- audit log (Super Admin only, with filters) ---------- */
async function doAudit(req, res, url) {
  var admin = await needSuper(req, res); if (!admin) return;
  var q = "%" + String(url.searchParams.get("q") || "").trim().toLowerCase() + "%";
  var who = auth.normalizeEmail(url.searchParams.get("admin") || "");
  var act = String(url.searchParams.get("action") || "").trim();
  var r = await db.sql`SELECT admin_email, action, detail, created_at FROM audit_log
    WHERE (${q} = '%%' OR lower(coalesce(admin_email,'')) LIKE ${q} OR lower(coalesce(action,'')) LIKE ${q} OR lower(coalesce(detail,'')) LIKE ${q})
      AND (${who} = '' OR lower(coalesce(admin_email,'')) = ${who})
      AND (${act} = '' OR action = ${act})
    ORDER BY id DESC LIMIT 300`;
  var whoList = await db.sql`SELECT DISTINCT admin_email FROM audit_log WHERE admin_email IS NOT NULL ORDER BY admin_email`;
  var actList = await db.sql`SELECT DISTINCT action FROM audit_log WHERE action IS NOT NULL ORDER BY action`;
  return auth.json(res, 200, { ok: true, log: r.rows, admins: whoList.rows.map(function (x) { return x.admin_email; }), actions: actList.rows.map(function (x) { return x.action; }) });
}

/* ---------- administrator management (Super Admin only) ---------- */
function cleanPerms(arr) {
  if (!Array.isArray(arr)) return [];
  var out = [];
  arr.forEach(function (p) { if (auth.ASSIGNABLE_PERMS.indexOf(p) >= 0 && out.indexOf(p) < 0) out.push(p); });
  return out;
}
function sha256(s) { return crypto.createHash("sha256").update(String(s)).digest("hex"); }
async function activeSuperCount() { var c = await db.sql`SELECT COUNT(*)::int AS n FROM admins WHERE role='super_admin' AND status='active'`; return c.rows[0].n; }
function newInvite(req, email) {
  var token = crypto.randomBytes(24).toString("hex");
  return { token: token, hash: sha256(token), expires: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), url: baseUrl(req) + "/admin/accept-invite.html?e=" + encodeURIComponent(email) + "&token=" + token };
}

async function doUsers(req, res) {
  var admin = await needSuper(req, res); if (!admin) return;
  if (req.method === "GET") {
    var r = await db.sql`SELECT id, name, email, role, status, permissions, last_login, created_at FROM admins WHERE status <> 'archived' ORDER BY id ASC`;
    return auth.json(res, 200, { ok: true, admins: r.rows, assignablePerms: auth.ASSIGNABLE_PERMS });
  }
  if (req.method === "POST") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var body = await auth.readBody(req);
    var email = auth.normalizeEmail(body.email);
    var name = String(body.name || "").slice(0, 120).trim();
    var role = String(body.role || "admin"); if (role !== "admin" && role !== "super_admin") role = "admin";
    var perms = role === "super_admin" ? [] : cleanPerms(body.permissions);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return auth.json(res, 400, { ok: false, error: "bad_email", message: "Enter a valid email address." });
    var ex = await db.sql`SELECT id, status FROM admins WHERE email = ${email} LIMIT 1`;
    if (ex.rows.length && ex.rows[0].status !== "archived") return auth.json(res, 409, { ok: false, error: "exists", message: "An administrator with this email already exists." });
    var inv = newInvite(req, email), id;
    if (ex.rows.length) {
      await db.sql`UPDATE admins SET name=${name}, role=${role}, permissions=${JSON.stringify(perms)}, status='invited', pass='', must_change=FALSE, invite_hash=${inv.hash}, invite_expires=${inv.expires}, token_version=token_version+1, created_by=${admin.id} WHERE id=${ex.rows[0].id}`;
      id = ex.rows[0].id;
    } else {
      var insR = await db.sql`INSERT INTO admins (email, name, role, permissions, status, pass, invite_hash, invite_expires, must_change, created_by)
        VALUES (${email}, ${name}, ${role}, ${JSON.stringify(perms)}, 'invited', '', ${inv.hash}, ${inv.expires}, FALSE, ${admin.id}) RETURNING id`;
      id = insR.rows[0].id;
    }
    await db.audit(admin.email, "admin_create", email + " (" + role + ")");
    return auth.json(res, 200, { ok: true, id: id, inviteUrl: inv.url });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}

async function doUser(req, res, url) {
  var admin = await needSuper(req, res); if (!admin) return;
  var id = parseInt(url.searchParams.get("id"), 10) || 0;
  if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });
  var tr = await db.sql`SELECT * FROM admins WHERE id = ${id} LIMIT 1`;
  var t = tr.rows[0];
  if (!t) return auth.json(res, 404, { ok: false, error: "not_found" });
  if (req.method === "GET") {
    return auth.json(res, 200, { ok: true, admin: { id: t.id, name: t.name, email: t.email, role: t.role, status: t.status, permissions: t.permissions, last_login: t.last_login, created_at: t.created_at }, assignablePerms: auth.ASSIGNABLE_PERMS });
  }
  if (req.method === "PUT") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var body = await auth.readBody(req), op = String(body.op || "update");
    if (op === "disable") {
      if (t.role === "super_admin" && t.status === "active" && (await activeSuperCount()) <= 1) return auth.json(res, 400, { ok: false, error: "last_super", message: "You can't disable the last active Super Admin." });
      await db.sql`UPDATE admins SET status='disabled', token_version=token_version+1 WHERE id=${id}`;
      await db.audit(admin.email, "admin_disable", t.email);
      return auth.json(res, 200, { ok: true });
    }
    if (op === "enable") {
      await db.sql`UPDATE admins SET status='active' WHERE id=${id} AND status IN ('disabled','archived')`;
      await db.audit(admin.email, "admin_enable", t.email);
      return auth.json(res, 200, { ok: true });
    }
    if (op === "reset") {
      var inv = newInvite(req, t.email);
      await db.sql`UPDATE admins SET status='invited', pass='', must_change=FALSE, invite_hash=${inv.hash}, invite_expires=${inv.expires}, token_version=token_version+1 WHERE id=${id}`;
      await db.audit(admin.email, "admin_reset", t.email);
      return auth.json(res, 200, { ok: true, inviteUrl: inv.url });
    }
    // general update: name / role / permissions
    var name = body.name !== undefined ? String(body.name).slice(0, 120).trim() : t.name;
    var role = body.role !== undefined ? String(body.role) : t.role;
    if (role !== "admin" && role !== "super_admin") role = t.role;
    if (id === admin.id && role !== t.role) return auth.json(res, 400, { ok: false, error: "self_role", message: "You can't change your own role." });
    if (t.role === "super_admin" && role !== "super_admin" && t.status === "active" && (await activeSuperCount()) <= 1) return auth.json(res, 400, { ok: false, error: "last_super", message: "You can't remove the last active Super Admin's role." });
    var perms = role === "super_admin" ? [] : (body.permissions !== undefined ? cleanPerms(body.permissions) : t.permissions);
    await db.sql`UPDATE admins SET name=${name}, role=${role}, permissions=${JSON.stringify(perms)}, token_version=token_version+1 WHERE id=${id}`;
    await db.audit(admin.email, "admin_update", t.email + " -> " + role);
    return auth.json(res, 200, { ok: true });
  }
  if (req.method === "DELETE") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    if (id === admin.id) return auth.json(res, 400, { ok: false, error: "self_delete", message: "You can't delete your own account." });
    if (t.role === "super_admin" && t.status === "active" && (await activeSuperCount()) <= 1) return auth.json(res, 400, { ok: false, error: "last_super", message: "You can't delete the last active Super Admin." });
    await db.sql`UPDATE admins SET status='archived', token_version=token_version+1 WHERE id=${id}`;
    await db.audit(admin.email, "admin_delete", t.email);
    return auth.json(res, 200, { ok: true });
  }
  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
}

/* ---------- accept invitation (set password, token-gated, no session required) ---------- */
async function doAcceptInvite(req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  if (!db.dbConfigured() || !auth.secret()) return auth.json(res, 500, { ok: false, error: "not_configured", message: "Admin backend is not configured yet." });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  var body = await auth.readBody(req);
  var email = auth.normalizeEmail(body.email), token = String(body.token || ""), next = String(body.password || "");
  if (!email || !token) return auth.json(res, 400, { ok: false, error: "bad_link", message: "This invitation link is invalid." });
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return auth.json(res, 400, { ok: false, error: "weak", message: "Use at least 8 characters with a letter and a number." });
  var r = await db.sql`SELECT * FROM admins WHERE email = ${email} LIMIT 1`;
  var a = r.rows[0];
  if (!a || a.status !== "invited" || !a.invite_hash) return auth.json(res, 400, { ok: false, error: "invalid", message: "This invitation is not valid or has already been used." });
  if (a.invite_expires && new Date(a.invite_expires).getTime() < Date.now()) return auth.json(res, 400, { ok: false, error: "expired", message: "This invitation has expired. Ask a Super Admin to resend it." });
  var hash = sha256(token);
  var okTok = a.invite_hash.length === hash.length && crypto.timingSafeEqual(Buffer.from(a.invite_hash), Buffer.from(hash));
  if (!okTok) return auth.json(res, 400, { ok: false, error: "bad_token", message: "This invitation token is invalid." });
  await db.sql`UPDATE admins SET pass=${auth.hashPassword(next)}, status='active', must_change=FALSE, invite_hash=NULL, invite_expires=NULL, token_version=token_version+1 WHERE id=${a.id}`;
  await db.audit(a.email, "admin_activate", null);
  return auth.json(res, 200, { ok: true, message: "Password set. You can now log in." });
}
