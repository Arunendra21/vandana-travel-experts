/* GET /api/admin/dashboard -> real overview stats (auth required). */
var db = require("../_db");
var auth = require("../_auth");

module.exports = async function (req, res) {
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  try {
    var p = await db.sql`SELECT
        COUNT(*) FILTER (WHERE deleted = FALSE)::int AS total,
        COUNT(*) FILTER (WHERE deleted = FALSE AND category = 'National')::int AS national,
        COUNT(*) FILTER (WHERE deleted = FALSE AND category = 'International')::int AS international,
        COUNT(*) FILTER (WHERE deleted = FALSE AND status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE deleted = FALSE AND status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE deleted = FALSE AND featured = TRUE)::int AS featured,
        MAX(updated_at) AS last_updated
      FROM packages`;
    var q = await db.sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'new')::int AS new,
        COUNT(*) FILTER (WHERE status IN ('contacted','in_progress'))::int AS pending,
        COUNT(*) FILTER (WHERE status IN ('confirmed','closed'))::int AS processed
      FROM inquiries`;
    return auth.json(res, 200, {
      ok: true,
      packages: p.rows[0],
      inquiries: q.rows[0],
      apis: {
        flight: { provider: "AeroDataBox / AviationStack", configured: !!(process.env.AERODATABOX_KEY || process.env.AVIATIONSTACK_KEY) },
        visa: { provider: "Vandana curated (official sources)", configured: true },
        email: { provider: "FormSubmit", configured: true }
      }
    });
  } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error" }); }
};
