/* =========================================================
   /api/flight — secure serverless proxy for live flight status.
   Providers (chosen by which key is set, in this order):
     1. AeroDataBox  (AERODATABOX_KEY, via RapidAPI) — recommended
     2. AviationStack (AVIATIONSTACK_KEY)
     3. demo sample (no key) so the UI is testable
   Keys stay server-side and are NEVER sent to the browser. The frontend talks
   only to this endpoint, so providers can be swapped here without UI changes.
     GET /api/flight?flight=AI302
   ========================================================= */
var CACHE = new Map(), TTL = 60 * 1000, RATE = new Map();

function send(res, status, body, cacheSec) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", cacheSec ? "public, max-age=" + cacheSec + ", s-maxage=" + cacheSec : "no-store");
  res.statusCode = status; res.end(JSON.stringify(body));
}
function fetchTimeout(url, opts, ms) {
  var c = new AbortController(); var t = setTimeout(function () { c.abort(); }, ms);
  opts = opts || {}; opts.signal = c.signal;
  return fetch(url, opts).finally(function () { clearTimeout(t); });
}
function clean(v) { return (v === undefined || v === "") ? null : v; }
function delayMin(a, b) { if (!a || !b) return null; var x = new Date(a), y = new Date(b); if (isNaN(x) || isNaN(y)) return null; var m = Math.round((y - x) / 60000); return m > 0 ? m : 0; }

/* ---- AviationStack ---- */
function normAS(f) {
  var dep = f.departure || {}, arr = f.arrival || {}, al = f.airline || {}, fl = f.flight || {};
  return {
    airline: clean(al.name), number: clean(fl.iata || fl.number), status: clean(f.flight_status), date: clean(f.flight_date),
    departure: { airport: clean(dep.airport), iata: clean(dep.iata), terminal: clean(dep.terminal), gate: clean(dep.gate), scheduled: clean(dep.scheduled), estimated: clean(dep.estimated), actual: clean(dep.actual), delay: clean(dep.delay) },
    arrival: { airport: clean(arr.airport), iata: clean(arr.iata), terminal: clean(arr.terminal), gate: clean(arr.gate), scheduled: clean(arr.scheduled), estimated: clean(arr.estimated), actual: clean(arr.actual), delay: clean(arr.delay), baggage: clean(arr.baggage) }
  };
}
async function viaAviationStack(flight) {
  var url = "http://api.aviationstack.com/v1/flights?access_key=" + process.env.AVIATIONSTACK_KEY + "&flight_iata=" + encodeURIComponent(flight);
  var r = await fetchTimeout(url, {}, 9000);
  if (!r.ok) throw new Error("provider");
  var d = await r.json().catch(function () { return {}; });
  if (d && d.error) throw new Error("provider");
  var list = (d && Array.isArray(d.data)) ? d.data : [];
  if (!list.length) return null;
  list.sort(function (a, b) { return String(b.flight_date || "").localeCompare(String(a.flight_date || "")); });
  return { source: "AviationStack", flight: normAS(list[0]) };
}

/* ---- AeroDataBox (RapidAPI) ---- */
function mapADB(s) { s = String(s || ""); if (/Arrived/i.test(s)) return "landed"; if (/EnRoute|Departed|Approaching/i.test(s)) return "active"; if (/Cancel/i.test(s)) return "cancelled"; if (/Diverted/i.test(s)) return "diverted"; return "scheduled"; }
function tget(o) { return (o && (o.local || o.utc)) || null; }
function normADB(f) {
  var dep = f.departure || {}, arr = f.arrival || {}, al = f.airline || {}, da = dep.airport || {}, aa = arr.airport || {};
  var dSch = tget(dep.scheduledTime), dRev = tget(dep.revisedTime) || tget(dep.actualTime);
  var aSch = tget(arr.scheduledTime), aRev = tget(arr.revisedTime) || tget(arr.predictedTime);
  var moving = /EnRoute|Departed|Approaching|Arrived/i.test(f.status || "");
  return {
    airline: clean(al.name), number: clean(f.number), status: mapADB(f.status), date: (dSch || "").slice(0, 10) || null,
    departure: { airport: clean(da.name), iata: clean(da.iata), terminal: clean(dep.terminal), gate: clean(dep.gate), scheduled: dSch, estimated: dRev, actual: moving ? dRev : null, delay: delayMin(dSch, dRev) },
    arrival: { airport: clean(aa.name), iata: clean(aa.iata), terminal: clean(arr.terminal), gate: clean(arr.gate), scheduled: aSch, estimated: aRev, actual: /Arrived/i.test(f.status || "") ? aRev : null, delay: delayMin(aSch, aRev), baggage: clean(arr.baggageBelt) }
  };
}
async function viaAeroDataBox(flight) {
  var url = "https://aerodatabox.p.rapidapi.com/flights/number/" + encodeURIComponent(flight) + "?withAircraftImage=false&withLocation=false";
  var r = await fetchTimeout(url, { headers: { "X-RapidAPI-Key": process.env.AERODATABOX_KEY, "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" } }, 9000);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("provider");
  var d = await r.json().catch(function () { return null; });
  var list = Array.isArray(d) ? d : (d && Array.isArray(d.flights) ? d.flights : []);
  if (!list.length) return null;
  list.sort(function (a, b) { return String(tget((b.departure || {}).scheduledTime) || "").localeCompare(String(tget((a.departure || {}).scheduledTime) || "")); });
  return { source: "AeroDataBox", flight: normADB(list[0]) };
}

function demoFlight(code) {
  var today = new Date().toISOString().slice(0, 10);
  return { airline: "Air India", number: code, status: "active", date: today,
    departure: { airport: "Indira Gandhi International", iata: "DEL", terminal: "3", gate: "22", scheduled: today + "T10:45:00+05:30", estimated: today + "T11:05:00+05:30", actual: today + "T11:05:00+05:30", delay: 20 },
    arrival: { airport: "Chhatrapati Shivaji Maharaj International", iata: "BOM", terminal: "2", gate: "41", scheduled: today + "T12:55:00+05:30", estimated: today + "T13:10:00+05:30", actual: null, delay: 15, baggage: "B5" } };
}

module.exports = async function (req, res) {
  try {
    var ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
    var now = Date.now(); var w = RATE.get(ip) || { n: 0, t: now };
    if (now - w.t > 60000) w = { n: 0, t: now }; w.n++; RATE.set(ip, w);
    if (w.n > 30) return send(res, 429, { ok: false, error: "rate_limited", message: "Too many requests. Please wait a moment and try again." });

    var flight = String(new URL(req.url, "http://x").searchParams.get("flight") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[A-Z0-9]{3,8}$/.test(flight)) return send(res, 400, { ok: false, error: "invalid_flight", message: "Please enter a valid flight number, e.g. AI302." });

    var cached = CACHE.get(flight);
    if (cached && now - cached.t < TTL) return send(res, 200, cached.v, 60);

    var provider = process.env.AERODATABOX_KEY ? "adb" : (process.env.AVIATIONSTACK_KEY ? "as" : "demo");
    if (provider === "demo") return send(res, 200, { ok: true, demo: true, source: "Sample data (add a flight API key for live status)", updated: new Date().toISOString(), flight: demoFlight(flight) }, 20);

    var out;
    try { out = provider === "adb" ? await viaAeroDataBox(flight) : await viaAviationStack(flight); }
    catch (e) { return send(res, 502, { ok: false, error: "provider_error", message: "Live flight data is temporarily unavailable. Please try again shortly." }); }

    if (!out) return send(res, 200, { ok: true, source: provider === "adb" ? "AeroDataBox" : "AviationStack", updated: new Date().toISOString(), flight: null, message: "No live information was found for this flight today. Please check the flight number." }, 60);

    var payload = { ok: true, source: out.source, updated: new Date().toISOString(), flight: out.flight };
    CACHE.set(flight, { t: now, v: payload });
    return send(res, 200, payload, 60);
  } catch (e) {
    return send(res, 500, { ok: false, error: "server_error", message: "Something went wrong. Please try again." });
  }
};
