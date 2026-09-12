/* GET /api/admin/audit -> recent admin activity (auth required). */
var db = require("../_db");
var auth = require("../_auth");
module.exports = async function (req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  try {
    var r = await db.sql`SELECT admin_email, action, detail, created_at FROM audit_log ORDER BY id DESC LIMIT 100`;
    return auth.json(res, 200, { ok: true, log: r.rows });
  } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
};
