/* Shared server-side email delivery (helper, not an HTTP route).
   Sends enquiry notifications from the OWN backend via SMTP using Nodemailer
   (same approach as the DAM_ project) — no third-party form service, no
   activation step. Configure SMTP_* env vars (e.g. a Gmail address + App
   Password). Returns true on success, false on failure (never throws) so the
   caller can record the delivery status. The inquiry is always stored first,
   so nothing is lost if email is unconfigured or fails. */
var nodemailer = require("nodemailer");

var TEAM_EMAIL = process.env.TEAM_EMAIL || "vandanatravelexperts@gmail.com"; // where enquiries are sent
var SMTP = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASSWORD || "",
  from: process.env.SMTP_FROM || process.env.SMTP_USER || TEAM_EMAIL
};

function configured() { return !!(SMTP.host && SMTP.user && SMTP.pass); }

var _tx = null;
function transporter() {
  if (!_tx) {
    _tx = nodemailer.createTransport({
      host: SMTP.host,
      port: SMTP.port,
      secure: SMTP.port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: SMTP.user, pass: SMTP.pass }
    });
  }
  return _tx;
}

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

function buildEmail(f) {
  var rows = [
    ["Name", f.name], ["Email", f.email], ["Phone", f.phone],
    ["Interest", f.package], ["Travellers", f.travellers], ["Travel date", f.travel_date],
    ["Source", f.source]
  ].filter(function (r) { return r[1]; });
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#1f2937">' +
    '<div style="background:#046bd2;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0">' +
      '<h2 style="margin:0;font-size:18px">New website enquiry</h2>' +
      '<p style="margin:4px 0 0;font-size:13px;opacity:.9">Vandana Travel Experts</p></div>' +
    '<table style="width:100%;border-collapse:collapse;border:1px solid #e6ecf4;border-top:none">' +
      rows.map(function (r, i) {
        return '<tr style="background:' + (i % 2 ? "#f7fafd" : "#fff") + '"><td style="padding:10px 14px;font-weight:bold;color:#0f2f57;width:140px;border-bottom:1px solid #eef2f7">' + esc(r[0]) + '</td><td style="padding:10px 14px;border-bottom:1px solid #eef2f7">' + esc(r[1]) + '</td></tr>';
      }).join("") +
      (f.message ? '<tr><td style="padding:10px 14px;font-weight:bold;color:#0f2f57;vertical-align:top">Message</td><td style="padding:10px 14px;white-space:pre-wrap">' + esc(f.message) + '</td></tr>' : '') +
    '</table>' +
    '<p style="font-size:12px;color:#64748b;padding:12px 4px">Reply directly to this email to respond to the customer.</p></div>';
  var text = rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n") + (f.message ? "\n\nMessage:\n" + f.message : "");
  return { html: html, text: text };
}

async function emailTeam(f) {
  if (!configured()) return false;
  try {
    var body = buildEmail(f);
    var info = await transporter().sendMail({
      from: '"Vandana Travel Experts" <' + SMTP.from + '>',
      to: TEAM_EMAIL,
      replyTo: (f.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) ? f.email : undefined,
      subject: "New enquiry — " + (f.package || "Website"),
      text: body.text,
      html: body.html
    });
    return !!(info && (info.accepted && info.accepted.length || info.messageId));
  } catch (e) { return false; }
}

module.exports = { emailTeam: emailTeam, TEAM_EMAIL: TEAM_EMAIL, configured: configured };
