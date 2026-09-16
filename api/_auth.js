/* Authentication + session helpers (no external deps — Node crypto only).
   - Passwords: scrypt (built-in, strong) with per-user random salt.
   - Session: signed (HMAC-SHA256) JSON token in an HTTP-only, Secure,
     SameSite=Strict cookie. Verified on EVERY protected request against the
     DB (token_version) so logout / password change invalidate old sessions. */
var crypto = require("crypto");
var db = require("./_db");

var COOKIE = "vte_admin";
var MAX_AGE = 60 * 60 * 2; // 2 hours

function secret() { return process.env.AUTH_SECRET || ""; }

/* ---- password hashing (scrypt) ---- */
function hashPassword(pw) {
  var salt = crypto.randomBytes(16).toString("hex");
  var hash = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return "scrypt$16384$" + salt + "$" + hash;
}
function verifyPassword(pw, stored) {
  try {
    var parts = String(stored).split("$"); // scrypt$N$salt$hash
    if (parts.length !== 4) return false;
    var N = parseInt(parts[1], 10), salt = parts[2], hash = parts[3];
    var calc = crypto.scryptSync(String(pw), salt, 64, { N: N, r: 8, p: 1 }).toString("hex");
    var a = Buffer.from(hash, "hex"), b = Buffer.from(calc, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}

/* ---- token (signed cookie) ---- */
function b64url(buf) { return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function sign(dataStr) { return b64url(crypto.createHmac("sha256", secret()).update(dataStr).digest()); }
function makeToken(admin) {
  var payload = { id: admin.id, email: admin.email, ver: admin.token_version, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  var body = b64url(JSON.stringify(payload));
  return body + "." + sign(body);
}
function readToken(token) {
  if (!token || !secret()) return null;
  var i = token.lastIndexOf(".");
  if (i < 0) return null;
  var body = token.slice(0, i), sig = token.slice(i + 1);
  var expect = sign(body);
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    var payload = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) { return null; }
}

/* ---- cookies ---- */
function getCookie(req, name) {
  var h = req.headers.cookie || "";
  var m = h.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function setSession(res, admin) {
  var t = makeToken(admin);
  res.setHeader("Set-Cookie", COOKIE + "=" + encodeURIComponent(t) + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=" + MAX_AGE);
}
function clearSession(res) {
  res.setHeader("Set-Cookie", COOKIE + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
}

/* ---- authorization: returns the ACTIVE admin row or null ---- */
async function requireAdmin(req) {
  if (!db.dbConfigured() || !secret()) return null;
  var payload = readToken(getCookie(req, COOKIE));
  if (!payload) return null;
  try {
    var r = await db.sql`SELECT id, email, name, role, status, permissions, token_version, must_change FROM admins WHERE id = ${payload.id} LIMIT 1`;
    var admin = r.rows[0];
    if (!admin) return null;
    if (admin.token_version !== payload.ver) return null; // invalidated (logout / password / disable)
    if (admin.status && admin.status !== "active") return null; // disabled / archived / invited cannot act
    if (!Array.isArray(admin.permissions)) { try { admin.permissions = JSON.parse(admin.permissions || "[]"); } catch (e) { admin.permissions = []; } }
    return admin;
  } catch (e) { return null; }
}

/* ---- roles & permissions (enforced server-side; super_admin has everything) ---- */
// Permissions that can be granted to a normal ADMIN (map to real features only).
var ASSIGNABLE_PERMS = [
  "packages.view", "packages.create", "packages.edit", "packages.delete", "packages.publish",
  "inquiries.view", "inquiries.edit", "inquiries.delete",
  "documents.view", "documents.create", "documents.edit", "documents.delete",
  "media.upload", "integrations.view", "settings.view"
];
function normalizeEmail(e) { return String(e == null ? "" : e).trim().toLowerCase(); }
function isSuper(admin) { return !!(admin && admin.role === "super_admin"); }
function can(admin, perm) {
  if (!admin) return false;
  if (admin.role === "super_admin") return true;
  return Array.isArray(admin.permissions) && admin.permissions.indexOf(perm) >= 0;
}

/* ---- CSRF defence: state-changing requests must be same-origin ---- */
function sameOrigin(req) {
  var host = req.headers.host;
  var origin = req.headers.origin || "";
  if (!origin) { // some browsers omit Origin on same-site GET; require it for writes
    var ref = req.headers.referer || "";
    return ref.indexOf("//" + host) > -1;
  }
  return origin.indexOf("//" + host) > -1;
}

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = status; res.end(JSON.stringify(body));
}

async function readBody(req) {
  return new Promise(function (resolve) {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    var data = "";
    req.on("data", function (c) { data += c; if (data.length > 8e6) req.destroy(); });
    req.on("end", function () { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
    req.on("error", function () { resolve({}); });
  });
}

module.exports = { COOKIE, MAX_AGE, secret, hashPassword, verifyPassword, makeToken, readToken, getCookie, setSession, clearSession, requireAdmin, sameOrigin, json, readBody, isSuper, can, normalizeEmail, ASSIGNABLE_PERMS };
