/* POST /api/admin/logout -> invalidates the session (bumps token_version) + clears cookie. */
var db = require("../_db");
var auth = require("../_auth");

module.exports = async function (req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (admin) {
    try { await db.sql`UPDATE admins SET token_version = token_version + 1 WHERE id = ${admin.id}`; await db.audit(admin.email, "logout", null); } catch (e) {}
  }
  auth.clearSession(res);
  return auth.json(res, 200, { ok: true });
};
