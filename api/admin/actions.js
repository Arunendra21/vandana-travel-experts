/* POST /api/admin/actions  { op, ... }  — small package state changes.
   op: "duplicate" {id} | "status" {id,status} | "featured" {id,featured} | "reorder" {ids:[]} */
var db = require("../_db");
var auth = require("../_auth");

module.exports = async function (req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });

  var body = await auth.readBody(req);
  var op = String(body.op || "");
  try {
    if (op === "status") {
      var id = parseInt(body.id, 10); var st = String(body.status || "");
      if (["draft", "published", "unpublished"].indexOf(st) < 0) return auth.json(res, 400, { ok: false, error: "bad_status" });
      await db.sql`UPDATE packages SET status = ${st}, updated_at = now() WHERE id = ${id} AND deleted = FALSE`;
      await db.audit(admin.email, "package_status", "#" + id + " -> " + st);
      return auth.json(res, 200, { ok: true });
    }
    if (op === "featured") {
      var fid = parseInt(body.id, 10); var f = !!body.featured;
      await db.sql`UPDATE packages SET featured = ${f}, updated_at = now() WHERE id = ${fid} AND deleted = FALSE`;
      await db.audit(admin.email, "package_featured", "#" + fid + " -> " + f);
      return auth.json(res, 200, { ok: true });
    }
    if (op === "duplicate") {
      var did = parseInt(body.id, 10);
      var r = await db.sql`SELECT * FROM packages WHERE id = ${did} AND deleted = FALSE LIMIT 1`;
      if (!r.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
      var p = r.rows[0];
      var slug = p.slug + "-copy", n = 1;
      while (true) { var ex = await db.sql`SELECT 1 FROM packages WHERE slug = ${slug} LIMIT 1`; if (!ex.rows.length) break; slug = p.slug + "-copy-" + (++n); }
      var ins = await db.sql`INSERT INTO packages (slug, title, category, country, region, nights, days, price, currency, summary, overview, image, highlights, itinerary, inclusions, exclusions, status, featured, sort)
        VALUES (${slug}, ${p.title + " (Copy)"}, ${p.category}, ${p.country}, ${p.region}, ${p.nights}, ${p.days}, ${p.price}, ${p.currency}, ${p.summary}, ${p.overview}, ${p.image},
        ${JSON.stringify(p.highlights)}, ${JSON.stringify(p.itinerary)}, ${JSON.stringify(p.inclusions)}, ${JSON.stringify(p.exclusions)}, 'draft', FALSE, ${(p.sort || 0) + 1})
        RETURNING id`;
      await db.audit(admin.email, "package_duplicate", "#" + did + " -> #" + ins.rows[0].id);
      return auth.json(res, 200, { ok: true, id: ins.rows[0].id });
    }
    if (op === "reorder") {
      var ids = Array.isArray(body.ids) ? body.ids : [];
      for (var i = 0; i < ids.length; i++) {
        var pkgId = parseInt(ids[i], 10); if (!pkgId) continue;
        await db.sql`UPDATE packages SET sort = ${i}, updated_at = now() WHERE id = ${pkgId}`;
      }
      await db.audit(admin.email, "package_reorder", ids.length + " items");
      return auth.json(res, 200, { ok: true });
    }
    return auth.json(res, 400, { ok: false, error: "bad_op" });
  } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
};
