/* =========================================================
   /api/flight  — secure serverless proxy (Vercel) for live flight status.
   The API key stays server-side (env var AVIATIONSTACK_KEY); it is NEVER
   sent to the browser. Provider = AviationStack (free tier). The frontend
   talks only to THIS endpoint, so the provider can be swapped here later
   without touching the UI.  GET /api/flight?flight=AI302
   ========================================================= */

var CACHE = new Map();           // best-effort warm-instance cache
var TTL = 60 * 1000;             // 60s — live status changes; don't hammer the API
var RATE = new Map();            // best-effort per-IP throttle

function send(res, status, body, cacheSec) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", cacheSec ? "public, max-age=" + cacheSec + ", s-maxage=" + cacheSec : "no-store");
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

function fetchTimeout(url, ms) {
  var ctrl = new AbortController();
  var t = setTimeout(function () { ctrl.abort(); }, ms);
  return fetch(url, { signal: ctrl.signal }).finally(function () { clearTimeout(t); });
}

function clean(v) { return (v === undefined || v === "") ? null : v; }

function normalize(f) {
  var dep = f.departure || {}, arr = f.arrival || {}, al = f.airline || {}, fl = f.flight || {};
  return {
    airline: clean(al.name),
    number: clean(fl.iata || fl.number),
    status: clean(f.flight_status),        // scheduled | active | landed | cancelled | incident | diverted
    date: clean(f.flight_date),
    departure: {
      airport: clean(dep.airport), iata: clean(dep.iata), terminal: clean(dep.terminal), gate: clean(dep.gate),
      scheduled: clean(dep.scheduled), estimated: clean(dep.estimated), actual: clean(dep.actual), delay: clean(dep.delay)
    },
    arrival: {
      airport: clean(arr.airport), iata: clean(arr.iata), terminal: clean(arr.terminal), gate: clean(arr.gate),
      scheduled: clean(arr.scheduled), estimated: clean(arr.estimated), actual: clean(arr.actual), delay: clean(arr.delay), baggage: clean(arr.baggage)
    }
  };
}

/* Sample used ONLY when no API key is configured yet, so the UI is testable.
   Clearly flagged demo:true so the frontend labels it as sample data. */
function demoFlight(code) {
  var today = new Date().toISOString().slice(0, 10);
  return {
    airline: "Air India", number: code, status: "active", date: today,
    departure: { airport: "Indira Gandhi International", iata: "DEL", terminal: "3", gate: "22", scheduled: today + "T10:45:00+05:30", estimated: today + "T11:05:00+05:30", actual: today + "T11:05:00+05:30", delay: 20 },
    arrival: { airport: "Chhatrapati Shivaji Maharaj International", iata: "BOM", terminal: "2", gate: "41", scheduled: today + "T12:55:00+05:30", estimated: today + "T13:10:00+05:30", actual: null, delay: 15, baggage: "B5" }
  };
}

module.exports = async function (req, res) {
  try {
    // basic per-IP throttle (best-effort; serverless instances are ephemeral)
    var ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
    var now = Date.now();
    var win = RATE.get(ip) || { n: 0, t: now };
    if (now - win.t > 60000) { win = { n: 0, t: now }; }
    win.n++; RATE.set(ip, win);
    if (win.n > 30) return send(res, 429, { ok: false, error: "rate_limited", message: "Too many requests. Please wait a moment and try again." });

    var url = new URL(req.url, "http://x");
    var raw = url.searchParams.get("flight") || "";
    var flight = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[A-Z0-9]{3,8}$/.test(flight)) {
      return send(res, 400, { ok: false, error: "invalid_flight", message: "Please enter a valid flight number, e.g. AI302." });
    }

    var cached = CACHE.get(flight);
    if (cached && now - cached.t < TTL) return send(res, 200, cached.v, 60);

    var key = process.env.AVIATIONSTACK_KEY;
    if (!key) {
      return send(res, 200, { ok: true, demo: true, source: "Sample data (add AVIATIONSTACK_KEY for live status)", updated: new Date().toISOString(), flight: demoFlight(flight) }, 20);
    }

    var api = "http://api.aviationstack.com/v1/flights?access_key=" + key + "&flight_iata=" + encodeURIComponent(flight);
    var r;
    try { r = await fetchTimeout(api, 9000); }
    catch (e) { return send(res, 504, { ok: false, error: "timeout", message: "Live flight data is taking too long. Please try again." }); }
    if (!r.ok) return send(res, 502, { ok: false, error: "provider_error", message: "Live flight data is temporarily unavailable. Please try again shortly." });

    var d = await r.json().catch(function () { return {}; });
    if (d && d.error) return send(res, 502, { ok: false, error: "provider_error", message: "Live flight data is temporarily unavailable. Please try again shortly." });

    var list = (d && Array.isArray(d.data)) ? d.data : [];
    if (!list.length) return send(res, 200, { ok: true, source: "AviationStack", updated: new Date().toISOString(), flight: null, message: "No live information was found for this flight today. Please check the flight number." }, 60);

    list.sort(function (a, b) { return String(b.flight_date || "").localeCompare(String(a.flight_date || "")); });
    var payload = { ok: true, source: "AviationStack", updated: new Date().toISOString(), flight: normalize(list[0]) };
    CACHE.set(flight, { t: now, v: payload });
    return send(res, 200, payload, 60);
  } catch (e) {
    return send(res, 500, { ok: false, error: "server_error", message: "Something went wrong. Please try again." });
  }
};
