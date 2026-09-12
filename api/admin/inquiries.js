/* /api/admin/inquiries        GET  -> list (auth required, private customer data)
   /api/admin/inquiries?id=1   GET  -> one
   /api/admin/inquiries?id=1   PUT  { status } -> update status (message preserved) */
var db = require("../_db");
var auth = require("../_auth");

var STATUSES = ["new", "contacted", "in_progress", "confirmed", "closed"];

module.exports = async function (req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  var id = parseInt(new URL(req.url, "http://x").searchParams.get("id"), 10) || 0;

  if (req.method === "GET") {
    try {
      if (id) {
        var one = await db.sql`SELECT * FROM inquiries WHERE id = ${id} LIMIT 1`;
        if (!one.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
        return auth.json(res, 200, { ok: true, inquiry: one.rows[0] });
      }
      var r = await db.sql`SELECT id, name, email, phone, package, travel_date, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 500`;
      return auth.json(res, 200, { ok: true, inquiries: r.rows });
    } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
  }

  if (req.method === "PUT") {
    if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
    if (!id) return auth.json(res, 400, { ok: false, error: "bad_id" });
    var body = await auth.readBody(req);
    var st = String(body.status || "");
    if (STATUSES.indexOf(st) < 0) return auth.json(res, 400, { ok: false, error: "bad_status" });
    try {
      var g = await db.sql`SELECT id FROM inquiries WHERE id = ${id} LIMIT 1`;
      if (!g.rows.length) return auth.json(res, 404, { ok: false, error: "not_found" });
      await db.sql`UPDATE inquiries SET status = ${st} WHERE id = ${id}`;
      await db.audit(admin.email, "inquiry_status", "#" + id + " -> " + st);
      return auth.json(res, 200, { ok: true });
    } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
  }

  return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
};
