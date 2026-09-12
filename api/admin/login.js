/* POST /api/admin/login  { email, password } -> sets secure session cookie.
   Rate-limited via per-account failure count + temporary lockout. */
var db = require("../_db");
var auth = require("../_auth");

module.exports = async function (req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  if (!db.dbConfigured() || !auth.secret()) return auth.json(res, 500, { ok: false, error: "not_configured", message: "Admin backend is not configured yet." });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });

  var body = await auth.readBody(req);
  var email = String(body.email || "").trim().toLowerCase();
  var password = String(body.password || "");
  if (!email || !password) return auth.json(res, 400, { ok: false, error: "missing", message: "Enter your email and password." });

  try {
    var r = await db.sql`SELECT * FROM admins WHERE email = ${email} LIMIT 1`;
    var admin = r.rows[0];
    var GENERIC = { ok: false, error: "invalid", message: "Invalid email or password." };

    if (admin && admin.locked_until && new Date(admin.locked_until).getTime() > Date.now()) {
      return auth.json(res, 429, { ok: false, error: "locked", message: "Too many attempts. Please try again in a few minutes." });
    }
    if (!admin || !auth.verifyPassword(password, admin.pass)) {
      if (admin) {
        var failed = (admin.failed || 0) + 1;
        var lock = failed >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
        await db.sql`UPDATE admins SET failed = ${failed}, locked_until = ${lock} WHERE id = ${admin.id}`;
      }
      return auth.json(res, 401, GENERIC);
    }
    await db.sql`UPDATE admins SET failed = 0, locked_until = NULL WHERE id = ${admin.id}`;
    auth.setSession(res, admin);
    await db.audit(admin.email, "login", null);
    return auth.json(res, 200, { ok: true, email: admin.email, mustChange: admin.must_change });
  } catch (e) {
    return auth.json(res, 500, { ok: false, error: "server_error" });
  }
};
