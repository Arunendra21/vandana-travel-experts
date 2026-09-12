/* POST /api/admin/password { current, next } -> change password (re-hash, bump
   token_version so all other sessions are invalidated, clear must_change). */
var db = require("../_db");
var auth = require("../_auth");

module.exports = async function (req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });

  var body = await auth.readBody(req);
  var current = String(body.current || ""), next = String(body.next || "");
  if (next.length < 8) return auth.json(res, 400, { ok: false, error: "weak", message: "New password must be at least 8 characters." });
  if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return auth.json(res, 400, { ok: false, error: "weak", message: "Use at least one letter and one number." });

  try {
    var r = await db.sql`SELECT * FROM admins WHERE id = ${admin.id} LIMIT 1`;
    var row = r.rows[0];
    if (!row || !auth.verifyPassword(current, row.pass)) return auth.json(res, 401, { ok: false, error: "bad_current", message: "Your current password is incorrect." });
    await db.sql`UPDATE admins SET pass = ${auth.hashPassword(next)}, must_change = FALSE, token_version = token_version + 1 WHERE id = ${admin.id}`;
    // refresh THIS session with the new token_version
    var updated = await db.sql`SELECT id, email, token_version FROM admins WHERE id = ${admin.id} LIMIT 1`;
    auth.setSession(res, updated.rows[0]);
    await db.audit(admin.email, "password_change", null);
    return auth.json(res, 200, { ok: true, message: "Password updated." });
  } catch (e) {
    return auth.json(res, 500, { ok: false, error: "server_error" });
  }
};
