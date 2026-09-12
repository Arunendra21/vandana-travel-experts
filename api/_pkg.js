/* Package validation + normalisation (server-side; never trust the client). */
function slugify(s) {
  return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "package";
}
function str(v, max) { return String(v == null ? "" : v).slice(0, max || 400); }
function arrStr(v, maxItems, maxLen) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, maxItems || 40).map(function (x) { return str(x, maxLen || 300); }).filter(function (x) { return x.trim(); });
}
function itinerary(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 40).map(function (d, i) {
    return { day: Number(d && d.day) || (i + 1), title: str(d && d.title, 200), body: str(d && d.body, 4000) };
  }).filter(function (d) { return d.title || d.body; });
}

// Returns { ok, errors, data }
function validate(input, opts) {
  opts = opts || {};
  var e = [];
  var title = str(input.title, 200).trim();
  if (!title) e.push("Title is required.");
  var category = str(input.category, 20);
  if (category !== "National" && category !== "International") e.push("Category must be National or International.");
  var status = str(input.status, 20);
  if (["draft", "published", "unpublished"].indexOf(status) < 0) status = "draft";
  var nights = Math.max(0, Math.min(60, parseInt(input.nights, 10) || 0));
  var days = Math.max(0, Math.min(60, parseInt(input.days, 10) || 0));
  var data = {
    title: title,
    slug: slugify(input.slug || title),
    category: category,
    country: str(input.country, 120),
    region: str(input.region, 160),
    nights: nights,
    days: days,
    price: input.price == null || String(input.price).trim() === "" ? null : str(input.price, 60),
    currency: str(input.currency || "INR", 8),
    summary: str(input.summary, 600),
    overview: str(input.overview, 6000),
    image: str(input.image, 400),
    highlights: arrStr(input.highlights, 8, 120),
    itinerary: itinerary(input.itinerary),
    inclusions: arrStr(input.inclusions, 60, 400),
    exclusions: arrStr(input.exclusions, 60, 400),
    status: status,
    featured: !!input.featured,
    sort: Math.max(0, Math.min(9999, parseInt(input.sort, 10) || 0))
  };
  return { ok: e.length === 0, errors: e, data: data };
}

module.exports = { slugify: slugify, validate: validate };
