/* PUBLIC  POST /api/inquiry  -> validate, store in DB (private), email the team,
   return success. The inquiry lives in the database so the admin can manage it,
   AND an email is sent (best-effort). Honeypot + rate-limit guard against spam.
   The inquiry is ALWAYS stored even if the email fails, and email_status
   (sent/failed) is persisted so an admin can retry delivery later. */
var db = require("./_db");
var mail = require("./_mail");

var RATE = new Map();

function send(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = status; res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise(function (resolve) {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    var d = ""; req.on("data", function (c) { d += c; if (d.length > 2e5) req.destroy(); });
    req.on("end", function () { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } });
    req.on("error", function () { resolve({}); });
  });
}
function clip(v, n) { return String(v == null ? "" : v).trim().slice(0, n || 400); }

module.exports = async function (req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method_not_allowed" });

  var ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  var now = Date.now(); var w = RATE.get(ip) || { n: 0, t: now };
  if (now - w.t > 60000) w = { n: 0, t: now };
  w.n++; RATE.set(ip, w);
  if (w.n > 6) return send(res, 429, { ok: false, error: "rate_limited", message: "Too many submissions. Please try again shortly." });

  var body = await readBody(req);
  if (body._honey) return send(res, 200, { ok: true }); // bot trap: pretend success

  var f = {
    name: clip(body.name, 120), email: clip(body.email, 160), phone: clip(body.phone, 40),
    package: clip(body.package, 160), travellers: clip(body.travellers, 20),
    travel_date: clip(body.travel_date, 40), message: clip(body.message, 4000),
    source: clip(body.source || "website", 60)
  };
  if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return send(res, 400, { ok: false, error: "invalid", message: "Please provide your name and a valid email." });

  // 1) Persist the inquiry FIRST — it must never be lost even if email fails.
  var stored = false, inquiryId = null;
  if (db.dbConfigured()) {
    try {
      await db.ensureSchema();
      var ins = await db.sql`INSERT INTO inquiries (name, email, phone, package, travellers, travel_date, message, source, ip, email_status)
        VALUES (${f.name}, ${f.email}, ${f.phone}, ${f.package}, ${f.travellers}, ${f.travel_date}, ${f.message}, ${f.source}, ${ip}, 'pending') RETURNING id`;
      stored = true; inquiryId = ins.rows[0].id;
    } catch (e) { /* still try to email below */ }
  }
  // 2) Best-effort email, then record delivery status so admins can retry failures.
  var emailed = await mail.emailTeam(f);
  if (inquiryId != null) { try { await db.sql`UPDATE inquiries SET email_status = ${emailed ? "sent" : "failed"} WHERE id = ${inquiryId}`; } catch (e) {} }
  return send(res, 200, { ok: true, stored: stored, emailed: emailed });
};
