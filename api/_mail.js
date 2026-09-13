/* Shared server-side email delivery (helper, not an HTTP route).
   Sends enquiry notifications to the team via FormSubmit's server API —
   free, unlimited, no private credentials in the browser. Returns true on
   success, false on failure (never throws) so callers can record the status. */
var TEAM_EMAIL = process.env.TEAM_EMAIL || "vandanatravelexperts@gmail.com";

async function emailTeam(f) {
  try {
    var params = new URLSearchParams();
    params.set("_subject", "New enquiry — " + (f.package || "Website"));
    params.set("_template", "table");
    params.set("Name", f.name || "");
    params.set("Email", f.email || "");
    params.set("Phone", f.phone || "");
    params.set("Package", f.package || "");
    params.set("Travellers", f.travellers || "");
    params.set("Travel date", f.travel_date || "");
    params.set("Message", f.message || "");
    params.set("Source", f.source || "website");
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, 7000);
    var r = await fetch("https://formsubmit.co/ajax/" + TEAM_EMAIL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: params.toString(),
      signal: ctrl.signal
    }).finally(function () { clearTimeout(t); });
    if (!r.ok) return false;
    var j = await r.json().catch(function () { return null; });
    // FormSubmit returns { success: "true" } on success.
    return !!(j && (j.success === true || j.success === "true"));
  } catch (e) { return false; }
}

module.exports = { emailTeam: emailTeam, TEAM_EMAIL: TEAM_EMAIL };
