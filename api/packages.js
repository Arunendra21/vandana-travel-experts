/* PUBLIC  GET /api/packages -> PUBLISHED packages for the customer website,
   in the same shape the frontend already uses. Drafts / unpublished / deleted
   are never returned. If the DB isn't configured, returns configured:false so
   the site falls back to its bundled static data (never breaks). */
var db = require("./_db");

function send(res, status, body, cacheSec) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Browsers always revalidate (max-age=0); the CDN serves a cached copy for a
  // short window and refreshes in the background (stale-while-revalidate), so
  // admin publish/unpublish changes reach visitors within seconds, while the
  // origin stays protected from traffic spikes.
  res.setHeader("Cache-Control", cacheSec
    ? "public, max-age=0, s-maxage=" + cacheSec + ", stale-while-revalidate=60"
    : "no-store");
  res.statusCode = status; res.end(JSON.stringify(body));
}

function toArray(v) { if (Array.isArray(v)) return v; if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return []; } } return []; }

module.exports = async function (req, res) {
  if (!db.dbConfigured()) return send(res, 200, { ok: true, configured: false, packages: [] }, 60);
  try {
    var r = await db.sql`SELECT slug, title, category, country, region, nights, days, price, currency, summary, overview, image, highlights, itinerary, inclusions, exclusions, featured, sort
      FROM packages WHERE deleted = FALSE AND status = 'published' ORDER BY sort ASC, id ASC`;
    var packages = r.rows.map(function (p) {
      var nights = p.nights || 0, days = p.days || 0;
      return {
        id: p.slug, title: p.title, category: p.category, country: p.country, region: p.region,
        duration: { nights: nights, days: days, label: nights + " Nights · " + days + " Days" },
        price: p.price || null, currency: p.currency || "INR",
        image: p.image, summary: p.summary, overview: p.overview,
        highlights: toArray(p.highlights), itinerary: toArray(p.itinerary), inclusions: toArray(p.inclusions), exclusions: toArray(p.exclusions),
        featured: !!p.featured
      };
    });
    return send(res, 200, { ok: true, configured: true, packages: packages }, 15);
  } catch (e) {
    return send(res, 200, { ok: false, configured: false, packages: [], error: "server_error" }, 15);
  }
};
