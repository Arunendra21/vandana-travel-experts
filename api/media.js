/* PUBLIC  GET /api/media?id=NN  -> serves an image or PDF stored in the database
   (free storage — no external object store required). Cached immutably because
   each id is unique and its bytes never change. */
var db = require("./_db");

module.exports = async function (req, res) {
  var id = parseInt(new URL(req.url, "http://x").searchParams.get("id"), 10) || 0;
  if (!id) { res.statusCode = 400; res.setHeader("Content-Type", "text/plain"); return res.end("Bad request"); }
  if (!db.dbConfigured()) { res.statusCode = 503; res.setHeader("Content-Type", "text/plain"); return res.end("Storage not configured"); }
  try {
    var r = await db.sql`SELECT content_type, data FROM media WHERE id = ${id} LIMIT 1`;
    if (!r.rows.length) { res.statusCode = 404; res.setHeader("Content-Type", "text/plain"); return res.end("Not found"); }
    var row = r.rows[0];
    var buf = Buffer.from(row.data, "base64");
    res.statusCode = 200;
    res.setHeader("Content-Type", row.content_type || "application/octet-stream");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.end(buf);
  } catch (e) {
    res.statusCode = 500; res.setHeader("Content-Type", "text/plain"); return res.end("Server error");
  }
};
