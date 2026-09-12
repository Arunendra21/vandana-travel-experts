/* /api/admin/packages
   GET  -> list all (admin) packages          (auth required)
   POST -> create a new package               (auth required) */
var db = require("../_db");
var auth = require("../_auth");
var pkg = require("../_pkg");

module.exports = async function (req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });

  if (req.method === "GET") {
    try {
      var r = await db.sql`SELECT id, slug, title, category, country, region, nights, days, price, currency, image, status, featured, sort, updated_at
        FROM packages WHERE deleted = FALSE ORDER BY sort ASC, id ASC`;
      return auth.json(res, 200, { ok: true, packages: r.rows });
    } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
  }

  if (req.method === "POST") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    var body = await auth.readBody(req);
    var v = pkg.validate(body);
    if (!v.ok) return auth.json(res, 400, { ok: false, error: "invalid", errors: v.errors });
    var d = v.data;
    try {
      // ensure unique slug
      var base = d.slug, n = 1;
      while (true) {
        var ex = await db.sql`SELECT 1 FROM packages WHERE slug = ${d.slug} LIMIT 1`;
        if (!ex.rows.length) break;
        d.slug = base + "-" + (++n);
      }
      var ins = await db.sql`INSERT INTO packages (slug, title, category, country, region, nights, days, price, currency, summary, overview, image, highlights, itinerary, inclusions, exclusions, status, featured, sort)
        VALUES (${d.slug}, ${d.title}, ${d.category}, ${d.country}, ${d.region}, ${d.nights}, ${d.days}, ${d.price}, ${d.currency}, ${d.summary}, ${d.overview}, ${d.image},
        ${JSON.stringify(d.highlights)}, ${JSON.stringify(d.itinerary)}, ${JSON.stringify(d.inclusions)}, ${JSON.stringify(d.exclusions)}, ${d.status}, ${d.featured}, ${d.sort})
        RETURNING id, slug`;
      await db.audit(admin.email, "package_create", d.title + " (" + ins.rows[0].slug + ")");
      return auth.json(res, 200, { ok: true, id: ins.rows[0].id, slug: ins.rows[0].slug });
    } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error", message: String(e && e.message || "").slice(0, 200) }); }
  }

  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
};
