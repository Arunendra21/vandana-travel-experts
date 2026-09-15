/* PUBLIC  GET /api/documents -> PUBLISHED travel documents (PDF library) for the
   customer website. Drafts / unpublished / deleted are never returned. If the DB
   isn't configured, returns configured:false so the site falls back to its
   bundled static list (never breaks). */
var db = require("./_db");

function send(res, status, body, cacheSec) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", cacheSec
    ? "public, max-age=0, s-maxage=" + cacheSec + ", stale-while-revalidate=60"
    : "no-store");
  res.statusCode = status; res.end(JSON.stringify(body));
}

module.exports = async function (req, res) {
  if (!db.dbConfigured()) return send(res, 200, { ok: true, configured: false, documents: [] }, 60);
  try {
    var r = await db.sql`SELECT title, description, category, file_url, file_name, file_size, sort
      FROM documents WHERE deleted = FALSE AND status = 'published' ORDER BY sort ASC, id ASC`;
    return send(res, 200, { ok: true, configured: true, documents: r.rows }, 30);
  } catch (e) {
    return send(res, 200, { ok: false, configured: false, documents: [], error: "server_error" }, 15);
  }
};
