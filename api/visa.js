/* =========================================================
   /api/visa — visa / entry requirement guidance.
   Curated from OFFICIAL sources (each entry links the official portal and
   carries a "last checked" date). Guidance only — never presented as a live
   guarantee; fees are shown only where broadly stable and always marked
   "subject to change", otherwise the user is told to verify with the
   authority. Served behind our own endpoint so a live provider (e.g. Sherpa)
   can be added here later without changing the UI.
     GET /api/visa?list=1           → destinations + nationalities (for dropdowns)
     GET /api/visa?from=IN&to=france → requirement for that pairing
   ========================================================= */

var CHECKED = "September 2026";
var STD_DOCS = [
  "Passport valid for at least 6 months beyond travel, with 2+ blank pages",
  "Completed visa application form",
  "Recent passport-size photographs (as per embassy specification)",
  "Confirmed return flight tickets",
  "Proof of accommodation (hotel bookings / invitation)",
  "Proof of sufficient funds (recent bank statements)",
  "Travel medical insurance"
];

// status: visa_required | visa_free | visa_on_arrival | e_visa | eta | permit
var DEST = {
  france: { country: "France", flag: "🇫🇷", region: "Europe (Schengen)", status: "visa_required",
    visaType: "Schengen Short-Stay Visa (Type C)", stay: "Up to 90 days within any 180-day period", entry: "As granted (single / multiple)",
    fee: "€80 for adults (approx. ₹7,500) — subject to change", processing: "Typically 15 working days (apply early in peak season)",
    documents: STD_DOCS.concat(["Travel insurance covering min. €30,000 medical cover across the Schengen area", "Cover letter / detailed day-wise itinerary"]),
    officialName: "France-Visas (Govt. of France)", officialUrl: "https://france-visas.gouv.fr/" },
  switzerland: { country: "Switzerland", flag: "🇨🇭", region: "Europe (Schengen)", status: "visa_required",
    visaType: "Schengen Short-Stay Visa (Type C)", stay: "Up to 90 days within any 180-day period", entry: "As granted",
    fee: "€80 for adults — subject to change", processing: "Typically 15 working days",
    documents: STD_DOCS.concat(["Travel insurance with min. €30,000 Schengen medical cover", "Detailed itinerary"]),
    officialName: "Swiss Government / VFS Global", officialUrl: "https://www.eda.admin.ch/entry-switzerland" },
  germany: { country: "Germany", flag: "🇩🇪", region: "Europe (Schengen)", status: "visa_required",
    visaType: "Schengen Short-Stay Visa (Type C)", stay: "Up to 90 days within any 180-day period", entry: "As granted",
    fee: "€80 for adults — subject to change", processing: "Typically 15 working days",
    documents: STD_DOCS.concat(["Travel insurance with min. €30,000 Schengen cover", "Detailed itinerary"]),
    officialName: "German Missions in India", officialUrl: "https://india.diplo.de/" },
  italy: { country: "Italy", flag: "🇮🇹", region: "Europe (Schengen)", status: "visa_required",
    visaType: "Schengen Short-Stay Visa (Type C)", stay: "Up to 90 days within any 180-day period", entry: "As granted",
    fee: "€80 for adults — subject to change", processing: "Typically 15 working days",
    documents: STD_DOCS.concat(["Travel insurance with min. €30,000 Schengen cover", "Detailed itinerary"]),
    officialName: "Italy Visa / VFS Global", officialUrl: "https://vistoperitalia.esteri.it/" },
  austria: { country: "Austria", flag: "🇦🇹", region: "Europe (Schengen)", status: "visa_required",
    visaType: "Schengen Short-Stay Visa (Type C)", stay: "Up to 90 days within any 180-day period", entry: "As granted",
    fee: "€80 for adults — subject to change", processing: "Typically 15 working days",
    documents: STD_DOCS.concat(["Travel insurance with min. €30,000 Schengen cover", "Detailed itinerary"]),
    officialName: "Austrian Embassy / VFS Global", officialUrl: "https://www.bmeia.gv.at/en/travel-stay/entry-and-residence-in-austria/" },
  uae: { country: "United Arab Emirates (Dubai)", flag: "🇦🇪", region: "Middle East", status: "e_visa",
    visaType: "UAE Tourist e-Visa (30 or 60 days)", stay: "30 or 60 days depending on visa selected", entry: "Single / multiple options",
    fee: "Varies by validity and processing — verify current fee", processing: "Usually 3–5 working days",
    documents: ["Passport valid for at least 6 months", "Passport-size photograph", "Confirmed return tickets", "Hotel booking / host details"],
    note: "Holders of a valid US / UK / EU / Schengen visa or residence may be eligible for visa on arrival — confirm eligibility.",
    officialName: "Federal Authority for Identity & Citizenship (ICP)", officialUrl: "https://icp.gov.ae/en/services/visa-services/" },
  singapore: { country: "Singapore", flag: "🇸🇬", region: "South-East Asia", status: "visa_required",
    visaType: "Singapore Tourist e-Visa (via authorised agent)", stay: "Typically up to 30 days", entry: "As granted",
    fee: "Statutory fee plus authorised-agent charges — verify current amount", processing: "Usually 3–5 working days",
    documents: ["Passport valid for at least 6 months", "Form 14A", "Recent photograph (per ICA spec)", "Confirmed return tickets", "Proof of funds"],
    officialName: "Immigration & Checkpoints Authority (ICA)", officialUrl: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements" },
  thailand: { country: "Thailand", flag: "🇹🇭", region: "South-East Asia", status: "visa_free",
    visaType: "Visa exemption for tourism", stay: "Up to 60 days (as per current exemption)", entry: "Tourism only",
    fee: null, processing: null,
    documents: ["Passport valid for at least 6 months", "Confirmed return / onward tickets", "Proof of accommodation", "Proof of funds (may be checked on arrival)"],
    note: "Visa exemption terms for Indian nationals have changed recently — confirm the current rules and duration before you fly.",
    officialName: "Thailand e-Visa (Govt. of Thailand)", officialUrl: "https://www.thaievisa.go.th/" },
  malaysia: { country: "Malaysia", flag: "🇲🇾", region: "South-East Asia", status: "visa_free",
    visaType: "Visa exemption / eNTRI / eVISA (as applicable)", stay: "Up to 30 days under exemption", entry: "Tourism / social",
    fee: null, processing: "eVISA usually 2–5 working days if required",
    documents: ["Passport valid for at least 6 months", "Confirmed return tickets", "Proof of accommodation", "Proof of funds"],
    note: "Malaysia's visa-exemption for Indian nationals is time-limited — confirm its current validity before travel.",
    officialName: "Malaysia Immigration Department", officialUrl: "https://malaysiavisa.imi.gov.my/" },
  maldives: { country: "Maldives", flag: "🇲🇻", region: "Indian Ocean", status: "visa_on_arrival",
    visaType: "Free visa on arrival", stay: "Up to 30 days", entry: "Tourism",
    fee: "No visa fee", processing: "On arrival",
    documents: ["Passport valid for at least 6 months", "Confirmed return tickets", "Confirmed hotel booking", "Proof of sufficient funds", "Completed Traveller Declaration (online, before arrival)"],
    officialName: "Maldives Immigration", officialUrl: "https://immigration.gov.mv/visa/" },
  srilanka: { country: "Sri Lanka", flag: "🇱🇰", region: "South Asia", status: "eta",
    visaType: "Electronic Travel Authorization (ETA)", stay: "Up to 30 days (double entry)", entry: "Double entry",
    fee: "ETA fee applies — verify current amount", processing: "Usually 24–72 hours",
    documents: ["Passport valid for at least 6 months", "Confirmed return tickets", "Proof of accommodation", "Proof of funds"],
    officialName: "Sri Lanka ETA (Dept. of Immigration & Emigration)", officialUrl: "https://www.eta.gov.lk/" },
  nepal: { country: "Nepal", flag: "🇳🇵", region: "South Asia", status: "visa_free",
    visaType: "No visa required for Indian nationals", stay: "No visa needed", entry: "Multiple",
    fee: "No visa fee", processing: "Not applicable",
    documents: ["Valid Indian passport OR Voter ID card (for entry by land/air as permitted)", "Confirmed travel details"],
    officialName: "Embassy of India, Kathmandu", officialUrl: "https://www.indembkathmandu.gov.in/" },
  bhutan: { country: "Bhutan", flag: "🇧🇹", region: "South Asia", status: "permit",
    visaType: "Entry permit (no visa) + Sustainable Development Fee (SDF)", stay: "As per permit", entry: "As granted",
    fee: "SDF payable per person per night — verify current amount", processing: "Permit arranged before / on arrival",
    documents: ["Valid Indian passport or Voter ID card", "Passport-size photographs", "Confirmed hotel booking", "Travel insurance"],
    officialName: "Department of Immigration, Bhutan", officialUrl: "https://www.immi.gov.bt/" },
  indonesia: { country: "Indonesia (Bali)", flag: "🇮🇩", region: "South-East Asia", status: "visa_on_arrival",
    visaType: "Visa on Arrival / e-VOA", stay: "30 days (extendable once)", entry: "Single",
    fee: "VOA fee applies — verify current amount", processing: "On arrival / e-VOA a few days",
    documents: ["Passport valid for at least 6 months", "Confirmed return / onward tickets", "Proof of accommodation"],
    officialName: "Directorate General of Immigration, Indonesia", officialUrl: "https://evisa.imigrasi.go.id/" },
  vietnam: { country: "Vietnam", flag: "🇻🇳", region: "South-East Asia", status: "e_visa",
    visaType: "Vietnam e-Visa", stay: "Up to 90 days (as granted)", entry: "Single / multiple",
    fee: "e-Visa fee applies — verify current amount", processing: "Usually 3–5 working days",
    documents: ["Passport valid for at least 6 months", "Passport data-page scan", "Passport-size photograph (white background)", "Confirmed travel details"],
    officialName: "Vietnam National e-Visa Portal", officialUrl: "https://evisa.gov.vn/" },
  japan: { country: "Japan", flag: "🇯🇵", region: "East Asia", status: "visa_required",
    visaType: "Japan Tourist Visa", stay: "Typically up to 90 days (as granted)", entry: "Single / multiple",
    fee: "Consular fee applies — verify current amount", processing: "Usually around 5–7 working days",
    documents: STD_DOCS.concat(["Detailed day-wise itinerary", "Bank statements / ITR as required"]),
    officialName: "Embassy of Japan in India", officialUrl: "https://www.in.emb-japan.go.jp/itpr_en/visa.html" },
  usa: { country: "United States", flag: "🇺🇸", region: "North America", status: "visa_required",
    visaType: "B1/B2 Visitor Visa (in-person interview)", stay: "As granted by CBP at entry", entry: "Multiple (typical)",
    fee: "Non-refundable application fee applies — verify current amount", processing: "Interview wait times vary — apply well in advance",
    documents: STD_DOCS.concat(["DS-160 confirmation", "Visa appointment confirmation", "Proof of ties to India / financial documents"]),
    officialName: "U.S. Travel Docs / U.S. Embassy India", officialUrl: "https://www.ustraveldocs.com/in/" },
  uk: { country: "United Kingdom", flag: "🇬🇧", region: "Europe", status: "visa_required",
    visaType: "Standard Visitor Visa", stay: "Usually up to 6 months", entry: "As granted",
    fee: "Application fee applies — verify current amount", processing: "Usually around 3 weeks",
    documents: STD_DOCS.concat(["Detailed itinerary", "Financial documents (6 months)", "Employment / business proof"]),
    officialName: "UK Government (GOV.UK)", officialUrl: "https://www.gov.uk/standard-visitor" },
  australia: { country: "Australia", flag: "🇦🇺", region: "Oceania", status: "visa_required",
    visaType: "Visitor Visa (subclass 600)", stay: "3, 6 or 12 months (as granted)", entry: "As granted",
    fee: "Visa application charge applies — verify current amount", processing: "Varies — apply in advance",
    documents: STD_DOCS.concat(["Detailed itinerary", "Financial capacity documents", "Employment / business proof"]),
    officialName: "Australian Department of Home Affairs", officialUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600" },
  mauritius: { country: "Mauritius", flag: "🇲🇺", region: "Indian Ocean", status: "visa_on_arrival",
    visaType: "Visa on arrival (free)", stay: "Up to 60 days", entry: "Tourism",
    fee: "No visa fee", processing: "On arrival",
    documents: ["Passport valid for at least 6 months", "Confirmed return tickets", "Confirmed accommodation", "Proof of sufficient funds"],
    officialName: "Mauritius Passport & Immigration Office", officialUrl: "https://passport.govmu.org/" },
  seychelles: { country: "Seychelles", flag: "🇸🇨", region: "Indian Ocean", status: "visa_free",
    visaType: "Visitor's Permit on arrival (no prior visa)", stay: "As granted (extendable)", entry: "Tourism",
    fee: "No visa fee (Travel Authorisation may apply) — verify", processing: "On arrival / online authorisation",
    documents: ["Passport valid for at least 6 months", "Confirmed return tickets", "Confirmed accommodation", "Proof of sufficient funds"],
    officialName: "Seychelles Immigration", officialUrl: "https://ica.gov.sc/" }
};

// aliases so common names resolve
var ALIAS = { dubai: "uae", "abu-dhabi": "uae", bali: "indonesia", schengen: "france", "sri-lanka": "srilanka" };

var LABEL = {
  visa_required: "Visa Required", visa_free: "Visa-Free", visa_on_arrival: "Visa on Arrival",
  e_visa: "e-Visa Required", eta: "ETA Required", permit: "Entry Permit"
};

function send(res, status, body, cacheSec) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", cacheSec ? "public, max-age=" + cacheSec + ", s-maxage=" + cacheSec : "no-store");
  res.statusCode = status; res.end(JSON.stringify(body));
}

module.exports = async function (req, res) {
  try {
    var url = new URL(req.url, "http://x");
    if (url.searchParams.get("list")) {
      var dests = Object.keys(DEST).map(function (k) { return { id: k, country: DEST[k].country, flag: DEST[k].flag, region: DEST[k].region, status: DEST[k].status, statusLabel: LABEL[DEST[k].status] || "Check" }; })
        .sort(function (a, b) { return a.country.localeCompare(b.country); });
      return send(res, 200, {
        ok: true,
        nationalities: [{ code: "IN", label: "India" }],
        destinations: dests,
        disclaimer: "Visa rules and fees change frequently. This information is guidance only — always confirm with the official authority before you travel.",
        checked: CHECKED
      }, 86400);
    }

    var from = String(url.searchParams.get("from") || "IN").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    var toRaw = String(url.searchParams.get("to") || "").toLowerCase().replace(/[^a-z-]/g, "");
    var to = ALIAS[toRaw] || toRaw;
    if (!to) return send(res, 400, { ok: false, error: "missing_destination", message: "Please choose a destination." });

    var d = DEST[to];
    if (!d) return send(res, 404, { ok: false, error: "unsupported_destination", message: "Detailed guidance for this destination isn't available yet. Please contact us and we'll help you directly." });

    if (from !== "IN") {
      return send(res, 200, {
        ok: true, supported: false, from: from, to: to, country: d.country, flag: d.flag,
        officialName: d.officialName, officialUrl: d.officialUrl,
        message: "Detailed guidance is currently provided for Indian passport holders. For a " + from + " passport, please verify with the official authority linked below, or contact us for assistance.",
        checked: CHECKED
      }, 3600);
    }

    return send(res, 200, {
      ok: true, supported: true, from: "IN", to: to,
      country: d.country, flag: d.flag, region: d.region,
      status: d.status, statusLabel: LABEL[d.status] || "Check Requirements",
      visaType: d.visaType || null, stay: d.stay || null, entry: d.entry || null,
      fee: d.fee || null, feeNote: d.fee ? null : "Visa fee subject to change — verify the current fee with the official authority.",
      processing: d.processing || null,
      documents: d.documents || [],
      note: d.note || null,
      officialName: d.officialName, officialUrl: d.officialUrl,
      checked: CHECKED,
      disclaimer: "Visa requirements and fees can change. Information shown here is for guidance and should be verified with the relevant official authority before travel."
    }, 43200);
  } catch (e) {
    return send(res, 500, { ok: false, error: "server_error", message: "Something went wrong. Please try again." });
  }
};
