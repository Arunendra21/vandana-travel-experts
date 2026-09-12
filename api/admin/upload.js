/* POST /api/admin/upload  { filename, data:"data:image/...;base64,..." }
   -> validates + stores the image in Vercel Blob, returns a public URL.
   Auth required. Only jpeg/png/webp, <= 4 MB, safe generated filename. */
var crypto = require("crypto");
var auth = require("../_auth");
var db = require("../_db");
var blob = require("@vercel/blob");

var EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
// magic-byte sniff so a renamed file can't masquerade as an image
function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length > 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

module.exports = async function (req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  var admin = await auth.requireAdmin(req);
  if (!admin) return auth.json(res, 401, { ok: false, error: "unauthorized" });
  if (!auth.sameOrigin(req)) return auth.json(res, 403, { ok: false, error: "forbidden" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return auth.json(res, 500, { ok: false, error: "no_blob", message: "Image storage (Vercel Blob) is not configured." });

  var body = await auth.readBody(req);
  var data = String(body.data || "");
  var m = data.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!m) return auth.json(res, 400, { ok: false, error: "bad_data", message: "Please choose a valid image file." });
  var declaredType = m[1].toLowerCase();
  if (!EXT[declaredType]) return auth.json(res, 415, { ok: false, error: "bad_type", message: "Only JPG, PNG or WEBP images are allowed." });

  var buf;
  try { buf = Buffer.from(m[2], "base64"); } catch (e) { return auth.json(res, 400, { ok: false, error: "bad_data" }); }
  if (!buf.length) return auth.json(res, 400, { ok: false, error: "empty" });
  if (buf.length > 4 * 1024 * 1024) return auth.json(res, 413, { ok: false, error: "too_large", message: "Image must be 4 MB or smaller." });
  var sniffed = sniff(buf);
  if (!sniffed || sniffed !== declaredType) return auth.json(res, 415, { ok: false, error: "not_image", message: "That file is not a valid image." });

  try {
    var name = "packages/" + Date.now() + "-" + crypto.randomBytes(6).toString("hex") + "." + EXT[declaredType];
    var out = await blob.put(name, buf, { access: "public", contentType: declaredType, addRandomSuffix: false });
    await db.audit(admin.email, "image_upload", out.url);
    return auth.json(res, 200, { ok: true, url: out.url });
  } catch (e) { return auth.json(res, 500, { ok: false, error: "server_error", message: "Upload failed. Please try again." }); }
};
