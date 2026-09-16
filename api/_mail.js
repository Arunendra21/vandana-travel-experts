/* Shared server-side email delivery (helper, not an HTTP route).
   Sends enquiry notifications to the team via FormSubmit's server API —
   free, unlimited, no private credentials in the browser. Returns true on
   success, false on failure (never throws) so callers can record the status. */
var TEAM_EMAIL = process.env.TEAM_EMAIL || "vandanatravelexperts@gmail.com";
// FormSubmit alias — used in the endpoint URL instead of the naked email so the
// address is never exposed. Activated & tied to vandanatravelexperts@gmail.com.
var FORMSUBMIT_ID = process.env.FORMSUBMIT_ID || "d17060d003ec2c43d856f1999a8432e5";
// FormSubmit's anti-abuse rejects server-side requests that lack a referrer from
// the site's own domain, so we send one. One-time: the FIRST send triggers a
// FormSubmit "Activate Form" email to TEAM_EMAIL — click it once and delivery
// works from then on. Until activated, emailTeam() honestly returns false and the
// inquiry is still safely stored in the database (admin can resend later).
var SITE_URL = process.env.SITE_URL || "https://vandana-travel-experts.vercel.app";

async function emailTeam(f) {
  try {
    var params = new URLSearchParams();
    params.set("_subject", "New enquiry — " + (f.package || "Website"));
    params.set("_template", "table");
    params.set("_captcha", "false");
    params.set("Name", f.name || "");
    params.set("Email", f.email || "");
    params.set("Phone", f.phone || "");
    params.set("Package", f.package || "");
    params.set("Travellers", f.travellers || "");
    params.set("Travel date", f.travel_date || "");
    params.set("Message", f.message || "");
    params.set("Source", f.source || "website");
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, 8000);
    var r = await fetch("https://formsubmit.co/ajax/" + FORMSUBMIT_ID, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Referer: SITE_URL + "/",
        Origin: SITE_URL
      },
      body: params.toString(),
      signal: ctrl.signal
    }).finally(function () { clearTimeout(t); });
    if (!r.ok) return false;
    var j = await r.json().catch(function () { return null; });
    // FormSubmit returns { success: "true" } once the form is activated.
    return !!(j && (j.success === true || j.success === "true"));
  } catch (e) { return false; }
}

module.exports = { emailTeam: emailTeam, TEAM_EMAIL: TEAM_EMAIL };
