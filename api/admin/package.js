/* /api/admin/package?id=123
   GET    -> full package
   PUT    -> update
   DELETE -> soft-delete (archive); ?hard=1 to permanently delete   (auth required) */
var db = require("../_db");
var auth = require("../_auth");
var pkg = require("../_pkg");

function pid(req) { var u = new URL(req.url, "http://x"); return parseInt(u.searchParams.get("id"), 10) || 0; }

module.exports = async function (req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  var id = pid(req);
  if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });

  if (req.method === "GET") {
    try {
      var r = await db.sql`SELECT * FROM packages WHERE id = ${id} AND deleted = FALSE LIMIT 1`;
      if (!r.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
      return auth.json(res, 200, { ok: true, package: r.rows[0] });
    } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
  }

  if (req.method === "PUT") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var body = await auth.readBody(req);
    var v = pkg.validate(body);
    if (!v.ok) return auth.json(res, 400, { ok: false, error: "invalid", errors: v.errors });
    var d = v.data;
    try {
      var cur = await db.sql`SELECT slug FROM packages WHERE id = ${id} LIMIT 1`;
      if (!cur.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
      // keep slug unique (excluding self)
      var base = d.slug, n = 1;
      while (true) {
        var ex = await db.sql`SELECT 1 FROM packages WHERE slug = ${d.slug} AND id <> ${id} LIMIT 1`;
        if (!ex.rows.length) break;
        d.slug = base + "-" + (++n);
      }
      await db.sql`UPDATE packages SET slug=${d.slug}, title=${d.title}, category=${d.category}, country=${d.country}, region=${d.region},
        nights=${d.nights}, days=${d.days}, price=${d.price}, currency=${d.currency}, summary=${d.summary}, overview=${d.overview}, image=${d.image},
        highlights=${JSON.stringify(d.highlights)}, itinerary=${JSON.stringify(d.itinerary)}, inclusions=${JSON.stringify(d.inclusions)}, exclusions=${JSON.stringify(d.exclusions)},
        status=${d.status}, featured=${d.featured}, sort=${d.sort}, updated_at=now() WHERE id=${id}`;
      await db.audit(admin.email, "package_update", d.title + " (#" + id + ")");
      return auth.json(res, 200, { ok: true, slug: d.slug });
    } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
  }

  if (req.method === "DELETE") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var hard = new URL(req.url, "http://x").searchParams.get("hard");
    try {
      var g = await db.sql`SELECT title FROM packages WHERE id = ${id} LIMIT 1`;
      if (!g.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
      if (hard) await db.sql`DELETE FROM packages WHERE id = ${id}`;
      else await db.sql`UPDATE packages SET deleted = TRUE, status = 'unpublished', updated_at = now() WHERE id = ${id}`;
      await db.audit(admin.email, hard ? "package_delete_hard" : "package_delete", (g.rows[0].title || "") + " (#" + id + ")");
      return auth.json(res, 200, { ok: true });
    } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
  }

  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
};
