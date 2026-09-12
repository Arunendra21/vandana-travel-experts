/* GET /api/admin/me -> current admin (for UI guard). 401 if not authenticated. */
var auth = require("../_auth");
module.exports = async function (req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  return auth.json(res, 200, { ok: true, email: admin.email, mustChange: admin.must_change });
};
