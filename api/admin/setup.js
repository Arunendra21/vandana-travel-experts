/* One-time bootstrap: create tables, seed packages, create the first admin.
   Protected by SETUP_TOKEN (env). Safe to call more than once (idempotent).
   POST /api/admin/setup   header: x-setup-token: <SETUP_TOKEN>            */
var db = require("../_db");
var auth = require("../_auth");
var seed = require("../_seed");

module.exports = async function (req, res) {
  if (req.method !== "POST") return auth.json(res, 405, { ok: false, error: "method_not_allowed" });
  if (!db.dbConfigured()) return auth.json(res, 500, { ok: false, error: "no_database", message: "Database is not configured. Create Vercel Postgres and redeploy." });
  if (!auth.secret()) return auth.json(res, 500, { ok: false, error: "no_secret", message: "AUTH_SECRET env var is not set." });
  var token = req.headers["x-setup-token"] || "";
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) return auth.json(res, 401, { ok: false, error: "unauthorized" });

  try {
    await db.ensureSchema();

    // create first admin (if none)
    var created = false;
    var count = await db.sql`SELECT COUNT(*)::int AS n FROM admins`;
    if (count.rows[0].n === 0) {
      var email = (process.env.ADMIN_INITIAL_EMAIL || "").trim().toLowerCase();
      var pw = process.env.ADMIN_INITIAL_PASSWORD || "";
      if (!email || pw.length < 8) return auth.json(res, 400, { ok: false, error: "bad_initial_admin", message: "Set ADMIN_INITIAL_EMAIL and an ADMIN_INITIAL_PASSWORD (8+ chars)." });
      await db.sql`INSERT INTO admins (email, pass, must_change) VALUES (${email}, ${auth.hashPassword(pw)}, TRUE)`;
      created = true;
    }

    // seed packages (if none)
    var seeded = 0;
    var pc = await db.sql`SELECT COUNT(*)::int AS n FROM packages`;
    if (pc.rows[0].n === 0) {
      for (var i = 0; i < seed.length; i++) {
        var p = seed[i];
        await db.sql`INSERT INTO packages (slug, title, category, country, region, nights, days, price, currency, summary, overview, image, highlights, itinerary, inclusions, exclusions, status, featured, sort)
          VALUES (${p.slug}, ${p.title}, ${p.category}, ${p.country}, ${p.region}, ${p.nights}, ${p.days}, ${p.price}, ${p.currency}, ${p.summary}, ${p.overview}, ${p.image},
          ${JSON.stringify(p.highlights)}, ${JSON.stringify(p.itinerary)}, ${JSON.stringify(p.inclusions)}, ${JSON.stringify(p.exclusions)}, ${p.status}, ${p.featured}, ${p.sort})
          ON CONFLICT (slug) DO NOTHING`;
        seeded++;
      }
    }
    await db.audit("system", "setup", "adminCreated=" + created + " seeded=" + seeded);
    return auth.json(res, 200, { ok: true, adminCreated: created, packagesSeeded: seeded, message: "Setup complete." + (created ? " Log in with your initial credentials, then change the password." : "") });
  } catch (e) {
    return auth.json(res, 500, { ok: false, error: "server_error", message: String(e && e.message || e).slice(0, 300) });
  }
};
