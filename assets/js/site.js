/* =========================================================
   Vandana Travel Experts — site scripts
   Shared header/footer, packages, booking, preloader, animations
   ========================================================= */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Business constants ---------- */
  var PHONE = "+919004222290";
  var PHONE2 = "+918779385247";
  var WA = "919004222290";
  var EMAIL = "vandanatravelexperts@gmail.com";
  /* Free, UNLIMITED email delivery for a static site via FormSubmit — no monthly
     cap, no backend, no API keys. Contact/booking forms post to FormSubmit, which
     shows its own free captcha (blocks bots) and then redirects to thankyou.html.
     The inbox owner clicks a one-time "Activate" link FormSubmit emails on the very
     first submission; after that, every enquiry is delivered automatically. */

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function qs(name) { var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; }

  /* ---------- Inline SVG icons ---------- */
  var I = {
    caret: '<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
    tw: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2H21l-6.5 7.43L22 22h-6.4l-4.7-6.15L5.5 22H3l6.96-7.95L2 2h6.56l4.25 5.62zM17.1 20.2h1.4L7 3.7H5.5z"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.3 5.1 12 5.1 12 5.1s-7.3 0-8.83.42A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77C4.7 18.9 12 18.9 12 18.9s7.3 0 8.83-.42a2.5 2.5 0 0 0 1.77-1.77C23 15.2 23 12 23 12zM9.75 15.5v-7l6 3.5z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'
  };
  window.VTE_ICONS = I;

  var PKGS = (window.VTE_PACKAGES || []);
  function pkgById(id) { for (var i = 0; i < PKGS.length; i++) if (PKGS[i].id === id) return PKGS[i]; return null; }

  /* ================= HEADER ================= */
  function buildPackagesMega() {
    var intl = PKGS.filter(function (p) { return p.category === "International"; });
    var nat = PKGS.filter(function (p) { return p.category === "National"; });
    function col(title, list, cat) {
      var links = list.map(function (p) { return '<a class="dropdown__link" href="package.html?id=' + p.id + '">' + esc(p.country === "India" ? p.region : p.country) + " — " + esc(p.title) + "</a>"; }).join("");
      return '<div class="dropdown__group"><div class="dropdown__title">' + I.globe + title +
        ' <a class="dropdown__all" href="packages.html?cat=' + cat + '">View all</a></div>' + links + "</div>";
    }
    return '<div class="dropdown dropdown--mega dropdown--pkgs">' + col("International Packages", intl, "International") + col("Domestic Packages", nat, "National") + "</div>";
  }

  function renderHeader() {
    var page = document.body.getAttribute("data-page") || "";
    function act(p) { return page === p ? " is-active" : ""; }
    var header =
      '<div class="container"><nav class="nav">' +
        '<a class="nav__logo" href="index.html" aria-label="Vandana Travel Experts home">' +
          '<img src="assets/img/logo.png" alt="Vandana Travel Experts logo">' +
          '<span class="nav__logo-text"><span class="ln"><b>Vandana</b> Travel Experts</span></span>' +
        "</a>" +
        '<button class="nav__toggle" aria-label="Toggle menu" aria-expanded="false"><span></span></button>' +
        '<ul class="nav__menu">' +
          '<li class="nav__item"><a class="nav__link' + act("home") + '" href="index.html">Home</a></li>' +
          '<li class="nav__item"><a class="nav__link' + act("about") + '" href="about.html">About Us</a></li>' +
          '<li class="nav__item has-mega"><a class="nav__link' + act("packages") + '" href="packages.html">Packages ' + I.caret + '</a>' + buildPackagesMega() + "</li>" +
          '<li class="nav__item has-mega"><a class="nav__link' + (act("corporate") || act("mice")) + '" href="corporate-travel.html">Services ' + I.caret + '</a>' +
            '<div class="dropdown dropdown--tools">' +
              '<a class="dropdown__link" href="corporate-travel.html">' + I.globe + ' Corporate Travel</a>' +
              '<a class="dropdown__link" href="mice.html">' + I.star + ' MICE &amp; Events</a>' +
            "</div></li>" +
          '<li class="nav__item has-mega"><a class="nav__link' + (act("flights") || act("visa") || act("documents")) + '" href="flights.html">Travel Info ' + I.caret + '</a>' +
            '<div class="dropdown dropdown--tools">' +
              '<a class="dropdown__link" href="flights.html">' + I.plane + ' Live Flight Status</a>' +
              '<a class="dropdown__link" href="visa.html">' + I.doc + ' Visa Requirements</a>' +
              '<a class="dropdown__link" href="documents.html">' + I.doc + ' Travel Documents</a>' +
            "</div></li>" +
          '<li class="nav__item"><a class="nav__link' + act("contact") + '" href="contact.html">Contact Us</a></li>' +
          '<li class="nav__cta"><a class="btn btn--primary btn--sm" href="contact.html">Get a Quote ' + I.arrow + "</a></li>" +
        "</ul>" +
        '<a class="nav__cta desktop-only btn btn--primary btn--sm" href="contact.html">Get a Quote ' + I.arrow + "</a>" +
      "</nav></div>";
    var el = document.getElementById("site-header");
    if (!el) return;
    el.className = "site-header"; el.innerHTML = header;
    var bd = document.createElement("div"); bd.className = "nav__backdrop"; document.body.appendChild(bd);

    var toggle = el.querySelector(".nav__toggle");
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    bd.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    el.querySelectorAll(".nav__item.has-mega > .nav__link").forEach(function (lnk) {
      lnk.addEventListener("click", function (e) {
        if (window.innerWidth <= 900) { e.preventDefault(); lnk.parentElement.classList.toggle("open"); }
      });
    });
    el.querySelectorAll(".nav__menu a").forEach(function (a) {
      if (!a.parentElement.classList.contains("has-mega")) a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    });
    function onScroll() { el.classList.toggle("is-solid", window.scrollY > 30); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ================= FOOTER ================= */
  function renderFooter() {
    var yr = 2026;
    var pkgLinks = PKGS.slice(0, 6);
    var footer =
      '<div class="container">' +
        '<div class="footer__top">' +
          '<div class="footer__brand">' +
            '<img src="assets/img/logo.png" alt="Vandana Travel Experts">' +
            "<p>A trusted travel management company with 25+ years of expertise — customised holidays, corporate travel and MICE events, crafted with precision and care.</p>" +
            '<ul class="footer__contact">' +
              "<li>" + I.phone + '<a href="tel:' + PHONE + '">' + PHONE + " &nbsp;|&nbsp; " + PHONE2 + "</a></li>" +
              "<li>" + I.mail + '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a></li>" +
              "<li>" + I.pin + "<span>1604, 16th Floor, Kamdhenu Commerz, Sector 14, Kharghar, Navi Mumbai – 410210</span></li>" +
            "</ul>" +
            '<div class="footer__socials">' +
              '<a href="https://facebook.com/vandanatravelexperts" target="_blank" rel="noopener" aria-label="Facebook">' + I.fb + "</a>" +
              '<a href="https://x.com/travelvte" target="_blank" rel="noopener" aria-label="X (Twitter)">' + I.tw + "</a>" +
              '<a href="https://instagram.com/vandanatravelexperts" target="_blank" rel="noopener" aria-label="Instagram">' + I.insta + "</a>" +
              '<a href="https://wa.me/' + WA + '" aria-label="WhatsApp">' + I.wa + "</a>" +
            "</div>" +
          "</div>" +
          '<div class="footer__col"><h4>Tour Packages</h4><ul>' + pkgLinks.map(function (p) { return '<li><a href="package.html?id=' + p.id + '">' + esc(p.title) + "</a></li>"; }).join("") + '<li><a href="packages.html">View all packages →</a></li></ul></div>' +
          '<div class="footer__col"><h4>Company</h4><ul>' +
            '<li><a href="about.html">About Us</a></li>' +
            '<li><a href="corporate-travel.html">Corporate Travel</a></li>' +
            '<li><a href="mice.html">MICE &amp; Events</a></li>' +
            '<li><a href="documents.html">Travel Documents</a></li>' +
            '<li><a href="contact.html">Contact Us</a></li>' +
          "</ul></div>" +
          '<div class="footer__col"><h4>Registrations</h4>' +
            '<ul class="footer__reg">' +
              "<li><span>IATA TIDS</span> 96097120</li>" +
              "<li><span>Min. of Tourism, Govt. of India</span> 2110240HE706</li>" +
            "</ul>" +
          "</div>" +
        "</div>" +
        '<div class="footer__note">Promoted by ex-employees of Sahara Airlines, Kingfisher Airlines, HDFC &amp; leading DMCs.</div>' +
        '<div class="footer__bottom">' +
          "<span>© " + yr + " Vandana Travel Experts. All rights reserved.</span>" +
          '<ul><li><a href="privacy.html">Privacy Policy</a></li><li><a href="terms.html">Terms &amp; Conditions</a></li><li><a href="cancellation.html">Cancellation &amp; Refund Policy</a></li></ul>' +
        "</div>" +
      "</div>";
    var el = document.getElementById("site-footer");
    if (el) { el.className = "footer"; el.innerHTML = footer; }

    var wa = document.createElement("a");
    wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi Vandana Travel Experts, I'd like to plan a trip.");
    wa.className = "float-wa"; wa.setAttribute("aria-label", "Chat on WhatsApp"); wa.innerHTML = I.wa;
    document.body.appendChild(wa);

    var top = document.createElement("button");
    top.className = "to-top"; top.setAttribute("aria-label", "Back to top"); top.innerHTML = I.up;
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(top);
    window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 600); }, { passive: true });
  }

  /* ================= PACKAGE CARD ================= */
  function packageCard(p) {
    var chips = (p.highlights || []).slice(0, 3).map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("");
    var catClass = p.category === "National" ? "is-nat" : "is-intl";
    var loc = p.country === "India" ? p.region : p.country;
    return '<article class="pkg-card reveal" data-cat="' + p.category + '" data-name="' + esc((p.title + " " + p.country + " " + p.region).toLowerCase()) + '">' +
      '<a class="pkg-card__media" href="package.html?id=' + p.id + '" aria-label="' + esc(p.title) + '">' +
        '<img src="' + p.image + '" alt="' + esc(p.title) + ' — ' + esc(loc) + '" loading="lazy">' +
        '<span class="pkg-card__badge ' + catClass + '">' + I.globe + esc(p.category) + "</span>" +
        '<span class="pkg-card__dur">' + I.clock + esc(p.duration.label) + "</span>" +
      "</a>" +
      '<div class="pkg-card__body">' +
        '<div class="pkg-card__loc">' + I.pin + esc(loc) + "</div>" +
        '<h3 class="pkg-card__title"><a href="package.html?id=' + p.id + '">' + esc(p.title) + "</a></h3>" +
        '<p class="pkg-card__desc">' + esc(p.summary) + "</p>" +
        (chips ? '<ul class="pkg-card__chips">' + chips + "</ul>" : "") +
        '<div class="pkg-card__foot">' +
          '<div class="pkg-card__price"><small>Starting price</small><b>On request</b></div>' +
          '<div class="pkg-card__actions">' +
            '<a class="btn btn--outline btn--sm" href="package.html?id=' + p.id + '">Explore</a>' +
            '<button class="btn btn--primary btn--sm" data-book="' + esc(p.title) + '">Book Now</button>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  /* ================= DESTINATION SHOWCASE (home) ================= */
  var DESTS = [
    { name: "Europe", img: "dest-europe.png" }, { name: "Australia", img: "dest-australia.png" },
    { name: "Ladakh", img: "dest-ladakh.png" }, { name: "Sikkim", img: "dest-sikkim.png" },
    { name: "Dubai", img: "dest-dubai.png" }, { name: "USA", img: "dest-america.png" },
    { name: "Japan", img: "dest-japan.png" }, { name: "Kerala", img: "dest-kerala.png" },
    { name: "Bhutan", img: "dest-bhutan.png" }, { name: "Thailand", img: "dest-thailand.png" },
    { name: "Kashmir", img: "dest-kashmir.png" }, { name: "Ooty", img: "dest-ooty.png" }
  ];
  function destCard(d) {
    return '<a class="dest-card reveal" href="packages.html">' +
      '<img src="assets/img/' + d.img + '" alt="' + d.name + '" loading="lazy">' +
      '<div class="dest-card__body"><div class="dest-card__name">' + d.name + "</div>" +
      '<div class="dest-card__meta">' + I.globe + "Explore tours</div>" +
      '<span class="dest-card__link">View packages ' + I.arrow + "</span></div></a>";
  }

  /* ================= HOME ================= */
  function renderHome() {
    var dg = document.getElementById("dest-grid");
    if (dg) dg.innerHTML = DESTS.map(destCard).join("");

    var emptyMsg = '<p class="pkg-empty-note">New tour packages are being added — please check back soon or <a href="contact.html">contact us</a> for a tailor-made trip.</p>';
    var ig = document.getElementById("pkg-intl-grid");
    var dgp = document.getElementById("pkg-dom-grid");
    if (ig) { var intl = PKGS.filter(function (p) { return p.category === "International"; }).slice(0, 6); ig.innerHTML = intl.length ? intl.map(packageCard).join("") : emptyMsg; }
    if (dgp) { var dom = PKGS.filter(function (p) { return p.category === "National"; }).slice(0, 6); dgp.innerHTML = dom.length ? dom.map(packageCard).join("") : emptyMsg; }

    document.querySelectorAll(".pkg-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-target");
        document.querySelectorAll(".pkg-tab").forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        document.querySelectorAll(".pkg-panel").forEach(function (pn) { pn.classList.toggle("is-active", pn.id === target); });
        revealAll();
      });
    });
  }

  /* ================= PACKAGES PAGE ================= */
  function renderPackagesPage() {
    var grid = document.getElementById("pkgs-grid");
    if (!grid) return;
    grid.innerHTML = PKGS.map(packageCard).join("");
    var counter = document.getElementById("pkgs-count");
    var current = "all", term = "";
    function apply() {
      var shown = 0;
      grid.querySelectorAll(".pkg-card").forEach(function (c) {
        var okCat = current === "all" || c.getAttribute("data-cat") === current;
        var okTerm = !term || c.getAttribute("data-name").indexOf(term) > -1;
        var show = okCat && okTerm;
        c.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (counter) counter.textContent = shown + (shown === 1 ? " package" : " packages");
      var empty = document.getElementById("pkgs-empty");
      if (empty) empty.style.display = shown ? "none" : "block";
      revealAll();
    }
    // filter from URL (?cat=International|National)
    var urlCat = qs("cat");
    document.querySelectorAll(".filter-tab").forEach(function (t) {
      if (urlCat && t.getAttribute("data-filter") === urlCat) { document.querySelectorAll(".filter-tab").forEach(function (x) { x.classList.remove("is-active"); }); t.classList.add("is-active"); current = urlCat; }
      t.addEventListener("click", function () {
        document.querySelectorAll(".filter-tab").forEach(function (x) { x.classList.remove("is-active"); });
        t.classList.add("is-active"); current = t.getAttribute("data-filter"); apply();
      });
    });
    var search = document.getElementById("pkgs-search");
    if (search) search.addEventListener("input", function () { term = search.value.trim().toLowerCase(); apply(); });
    apply();
  }

  /* ================= PACKAGE DETAIL ================= */
  function renderPackageDetail() {
    var mount = document.getElementById("pkg-detail");
    if (!mount) return;
    var p = pkgById(qs("id")) || PKGS[0];
    if (!p) { mount.innerHTML = '<div class="container"><p>Package not found. <a href="packages.html">Browse all packages</a>.</p></div>'; return; }
    document.title = p.title + " — Vandana Travel Experts";
    var loc = p.country === "India" ? p.region : p.country;
    var catClass = p.category === "National" ? "is-nat" : "is-intl";

    var days = p.itinerary.map(function (d) {
      return '<div class="itin-day reveal">' +
        '<div class="itin-day__marker"><span>Day</span><b>' + d.day + "</b></div>" +
        '<div class="itin-day__body"><h4>' + esc(d.title) + "</h4>" + (d.body ? "<p>" + esc(d.body) + "</p>" : "") + "</div></div>";
    }).join("");
    function list(items, cls, icon) {
      return '<ul class="io-list ' + cls + '">' + items.map(function (x) { return "<li>" + icon + "<span>" + esc(x) + "</span></li>"; }).join("") + "</ul>";
    }
    var chips = (p.highlights || []).map(function (h) { return '<span class="hl-chip">' + I.star + esc(h) + "</span>"; }).join("");

    mount.innerHTML =
      '<section class="pkg-hero" style="background-image:linear-gradient(120deg,rgba(3,40,78,.82),rgba(4,107,210,.5)),url(\'' + p.image + '\')">' +
        '<div class="container"><div class="pkg-hero__inner reveal">' +
          '<div class="breadcrumb"><a href="index.html">Home</a>' + I.chevR + '<a href="packages.html">Packages</a>' + I.chevR + "<span>" + esc(p.title) + "</span></div>" +
          '<span class="pkg-hero__badge ' + catClass + '">' + I.globe + esc(p.category) + " Tour</span>" +
          "<h1>" + esc(p.title) + "</h1>" +
          '<div class="pkg-hero__meta"><span>' + I.pin + esc(loc) + "</span><span>" + I.clock + esc(p.duration.label) + "</span><span>" + I.tag + "Price on request</span></div>" +
        "</div></div>" +
      "</section>" +
      '<section class="section pkg-detail-body"><div class="container"><div class="pkg-detail-grid">' +
        '<div class="pkg-detail-main">' +
          '<div class="pkg-block reveal"><h2 class="pkg-block__title">Overview</h2><p class="pkg-overview">' + esc(p.overview) + "</p>" +
            (chips ? '<div class="hl-chips">' + chips + "</div>" : "") + "</div>" +
          '<div class="pkg-block reveal"><h2 class="pkg-block__title">Day-by-Day Itinerary</h2><div class="itin">' + days + "</div></div>" +
          '<div class="pkg-block reveal"><div class="io-grid">' +
            '<div class="io-col io-col--in"><h3>' + I.check + "What's included</h3>" + list(p.inclusions, "io-in", I.check) + "</div>" +
            '<div class="io-col io-col--ex"><h3>' + I.x + "What's excluded</h3>" + list(p.exclusions, "io-ex", I.x) + "</div>" +
          "</div></div>" +
          '<p class="pkg-note reveal">Itinerary, hotels and sightseeing are as per the source package and may be adjusted for availability, weather or operational reasons. Prices are shared on request based on travel dates and group size.</p>' +
        "</div>" +
        '<aside class="pkg-detail-side"><div class="pkg-booking-card reveal">' +
          '<div class="pkg-booking-card__price"><small>Starting price</small><b>On request</b></div>' +
          '<ul class="pkg-booking-card__facts">' +
            "<li>" + I.globe + "<span>Destination</span><b>" + esc(loc) + "</b></li>" +
            "<li>" + I.clock + "<span>Duration</span><b>" + esc(p.duration.label) + "</b></li>" +
            "<li>" + I.tag + "<span>Category</span><b>" + esc(p.category) + " Tour</b></li>" +
            "<li>" + I.calendar + "<span>Days</span><b>" + p.itinerary.length + " days planned</b></li>" +
          "</ul>" +
          '<button class="btn btn--primary" data-book="' + esc(p.title) + '" style="width:100%">Book This Package ' + I.arrow + "</button>" +
          '<a class="btn btn--outline" href="https://wa.me/' + WA + '?text=' + encodeURIComponent("Hi, I'm interested in the " + p.title + " package.") + '" style="width:100%;margin-top:10px">' + I.wa + " Enquire on WhatsApp</a>" +
          '<a class="pkg-booking-card__call" href="tel:' + PHONE + '">' + I.phone + " Call " + PHONE + "</a>" +
        "</div></aside>" +
      "</div></div></section>";
  }

  /* ================= TRAVEL DOCUMENTS (PDF library) ================= */
  function fmtSize(n) { n = +n || 0; if (n <= 0) return ""; if (n < 1024 * 1024) return Math.round(n / 1024) + " KB"; return (n / 1048576).toFixed(1) + " MB"; }
  function docCard(d) {
    var url = esc(d.file_url || "#");
    return '<article class="doc-card reveal">' +
      '<div class="doc-card__badge">' + I.doc + '<span>PDF</span></div>' +
      '<div class="doc-card__body">' +
        (d.category ? '<span class="doc-card__cat">' + esc(d.category) + "</span>" : "") +
        "<h3>" + esc(d.title) + "</h3>" +
        (d.description ? "<p>" + esc(d.description) + "</p>" : "") +
        '<div class="doc-card__foot">' +
          (fmtSize(d.file_size) ? '<span class="doc-card__size">' + fmtSize(d.file_size) + "</span>" : "<span></span>") +
          '<div class="doc-card__actions">' +
            '<a class="btn btn--outline btn--sm" href="' + url + '" target="_blank" rel="noopener">' + I.eye + " View</a>" +
            '<a class="btn btn--primary btn--sm" href="' + url + '" download>' + I.down + " Download</a>" +
          "</div>" +
        "</div>" +
      "</div></article>";
  }
  function renderDocsInto(mount, docs, counter) {
    if (!docs.length) { mount.innerHTML = '<p class="pkg-empty-note">Our travel documents are being prepared — please check back soon or <a href="contact.html">contact us</a> for itineraries.</p>'; if (counter) counter.textContent = ""; return; }
    var cats = [];
    docs.forEach(function (d) { var c = d.category || "General"; if (cats.indexOf(c) < 0) cats.push(c); });
    var html = cats.map(function (c) {
      var items = docs.filter(function (d) { return (d.category || "General") === c; });
      return '<div class="doc-group"><h2 class="doc-group__title">' + esc(c) + ' <span>' + items.length + "</span></h2>" +
        '<div class="doc-grid">' + items.map(docCard).join("") + "</div></div>";
    }).join("");
    mount.innerHTML = html;
    if (counter) counter.textContent = docs.length + (docs.length === 1 ? " document" : " documents");
    revealAll();
  }
  function renderDocuments() {
    var mount = document.getElementById("docs-library");
    if (!mount) return;
    var counter = document.getElementById("docs-count");
    var all = [];
    function apply() {
      var term = (document.getElementById("docs-search") || {}).value || "";
      term = term.trim().toLowerCase();
      var list = term ? all.filter(function (d) { return ((d.title || "") + " " + (d.description || "") + " " + (d.category || "")).toLowerCase().indexOf(term) > -1; }) : all;
      renderDocsInto(mount, list, counter);
    }
    fetch(API_BASE + "/api/documents").then(function (r) { return r.json(); }).then(function (j) {
      all = (j && j.ok && Array.isArray(j.documents)) ? j.documents : [];
      apply();
      var s = document.getElementById("docs-search"); if (s) s.addEventListener("input", apply);
    }).catch(function () { renderDocsInto(mount, [], counter); });
  }

  /* ================= BOOKING MODAL ================= */
  function buildBookingModal() {
    if (document.getElementById("book-modal")) return;
    var opts = PKGS.map(function (p) { return '<option value="' + esc(p.title) + '">' + esc(p.title) + " (" + esc(p.category) + ")</option>"; }).join("");
    var m = document.createElement("div");
    m.id = "book-modal"; m.className = "modal"; m.setAttribute("aria-hidden", "true");
    m.innerHTML =
      '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__dialog" role="dialog" aria-modal="true" aria-label="Book your trip">' +
        '<button class="modal__close" data-close aria-label="Close">' + I.x + "</button>" +
        '<div class="modal__head"><span class="eyebrow">Book / Enquire</span><h3>Plan Your Journey</h3><p>Share your details and our travel experts will get back within 24 hours with a personalised quote.</p></div>' +
        '<form class="modal__form" data-form="booking" novalidate>' +
          '<div class="field-row">' +
            '<div class="field"><label for="b-name">Full Name *</label><input id="b-name" name="name" type="text" required placeholder="Your name"></div>' +
            '<div class="field"><label for="b-phone">Phone *</label><input id="b-phone" name="phone" type="tel" required placeholder="+91 ..." pattern="[0-9 +\\-]{7,}"></div>' +
          "</div>" +
          '<div class="field"><label for="b-email">Email *</label><input id="b-email" name="email" type="email" required placeholder="you@example.com"></div>' +
          '<div class="field"><label for="b-pkg">Selected Package</label><select id="b-pkg" name="package">' + opts + "</select></div>" +
          '<div class="field-row">' +
            '<div class="field"><label for="b-trav">Travellers</label><input id="b-trav" name="travellers" type="number" min="1" value="2"></div>' +
            '<div class="field"><label for="b-date">Preferred Date</label><input id="b-date" name="travel_date" type="date"></div>' +
          "</div>" +
          '<div class="field"><label for="b-msg">Requirements</label><textarea id="b-msg" name="message" placeholder="Tell us about your plans — flights needed, hotel category, occasion…"></textarea></div>' +
          '<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">' +
          '<button class="btn btn--primary" type="submit" style="width:100%">Send Enquiry ' + I.arrow + "</button>" +
          '<div class="form-msg" role="status"></div>' +
        "</form>" +
      "</div>";
    document.body.appendChild(m);
    m.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeBooking(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeBooking(); });
    initForm(m.querySelector("form"));
  }
  function openBooking(pkgTitle, message) {
    buildBookingModal();
    var m = document.getElementById("book-modal");
    var sel = m.querySelector("#b-pkg");
    if (pkgTitle && sel) {
      var found = false;
      for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === pkgTitle) { sel.selectedIndex = i; found = true; break; } }
      if (!found) { var o = document.createElement("option"); o.value = pkgTitle; o.textContent = pkgTitle; sel.insertBefore(o, sel.firstChild); sel.selectedIndex = 0; }
    }
    if (message) { var t = m.querySelector("#b-msg"); if (t && !t.value) t.value = message; }
    m.classList.add("open"); m.setAttribute("aria-hidden", "false"); document.body.classList.add("modal-open");
    var f = m.querySelector("input,select,textarea"); if (f) setTimeout(function () { f.focus(); }, 60);
  }
  function closeBooking() {
    var m = document.getElementById("book-modal");
    if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open"); }
  }
  function initBookingTriggers() {
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-book]");
      if (!b) return;
      e.preventDefault();
      openBooking(b.getAttribute("data-book"), b.getAttribute("data-book-msg") || "");
    });
  }

  /* ================= FORMS (free, UNLIMITED FormSubmit + captcha) ================= */
  // FormSubmit alias (keeps the email out of the page source). Activated & bound
  // to vandanatravelexperts@gmail.com.
  var FORM_ID = "d17060d003ec2c43d856f1999a8432e5";
  var FORM_POST = "https://formsubmit.co/" + FORM_ID;        // native POST → thankyou.html
  var FORM_AJAX = "https://formsubmit.co/ajax/" + FORM_ID;   // ajax (newsletter / fallback)
  function val(f, n) { var el = f.querySelector("[name=" + n + "]"); return el ? el.value.trim() : ""; }
  function setBtn(btn, loading) { if (btn) { btn.disabled = loading; btn.classList.toggle("is-loading", loading); } }
  function hidden(f, name, value) {
    var el = f.querySelector('input[type="hidden"][name="' + name + '"]');
    if (!el) { el = document.createElement("input"); el.type = "hidden"; el.name = name; f.appendChild(el); }
    el.value = value; return el;
  }
  function validateRequired(f, msg) {
    var invalid = null;
    f.querySelectorAll("[required]").forEach(function (el) {
      if (!el.value.trim() || (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value))) { if (!invalid) invalid = el; el.classList.add("is-err"); }
      else el.classList.remove("is-err");
    });
    if (invalid) { if (msg) { msg.textContent = "Please fill the highlighted fields correctly."; msg.className = "form-msg err"; } invalid.focus(); }
    return !invalid;
  }
  function nextUrl() { return location.origin + location.pathname.replace(/[^/]*$/, "") + "thankyou.html"; }
  function subscribed(f, msg) {
    if (msg) { msg.textContent = "You have been successfully subscribed!"; msg.className = "form-msg ok"; }
    f.reset(); var b = f.querySelector("button"); if (b) setBtn(b, false);
  }

  function initForm(f) {
    if (!f || f.__wired) return; f.__wired = true;
    var type = f.getAttribute("data-form");
    f.__loadedAt = Date.now();
    // honeypot bot trap
    if (!f.querySelector('[name="_honey"]')) {
      var hp = document.createElement("input");
      hp.type = "text"; hp.name = "_honey"; hp.tabIndex = -1; hp.autocomplete = "off";
      hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
      f.appendChild(hp);
    }

    if (type === "newsletter") {
      // inline AJAX subscribe — unlimited, no captcha needed for a single email field
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var msg = f.querySelector(".form-msg");
        if (f.querySelector('[name="_honey"]').value) { subscribed(f, msg); return; }
        if (!validateRequired(f, msg)) return;
        var btn = f.querySelector('button[type="submit"]'); setBtn(btn, true);
        var fd = new FormData(f); fd.append("_subject", "Newsletter subscription"); fd.append("_captcha", "false");
        fetch(FORM_AJAX, { method: "POST", body: fd, headers: { Accept: "application/json" } })
          .then(function () { subscribed(f, msg); })
          .catch(function () { subscribed(f, msg); });
      });
      return;
    }

    // contact & booking → store securely in the DB + email the team via /api/inquiry.
    // Honeypot + time-trap + server-side rate-limit guard against spam.
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = f.querySelector(".form-msg");
      if (f.querySelector('[name="_honey"]').value) { inquirySuccess(f); return; }
      if (Date.now() - (f.__loadedAt || 0) < 2500) { if (msg) { msg.textContent = "Please take a moment to complete the form."; msg.className = "form-msg err"; } f.__loadedAt = Date.now() - 2500; return; }
      if (!validateRequired(f, msg)) return;
      var btn = f.querySelector('button[type="submit"]'); setBtn(btn, true);
      if (msg) { msg.textContent = "Sending your enquiry…"; msg.className = "form-msg"; }
      var payload = {
        name: val(f, "name"), email: val(f, "email"), phone: val(f, "phone"),
        package: val(f, "package") || (type === "booking" ? "Booking enquiry" : ""),
        travellers: val(f, "travellers"), travel_date: val(f, "travel_date"), message: val(f, "message"),
        source: type + " form", _honey: (f.querySelector('[name="_honey"]') || {}).value || ""
      };
      fetch(API_BASE + "/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) { if (j && j.ok) inquirySuccess(f); else fallbackFormSubmit(f, type, msg, btn); })
        .catch(function () { fallbackFormSubmit(f, type, msg, btn); });
    });
  }
  function inquirySuccess(f) {
    var host = f.parentNode;
    var s = document.createElement("div"); s.className = "form-success";
    s.innerHTML = '<div class="form-success__tick">' + I.check + "</div><h3>Thank you!</h3><p>Your enquiry has reached the Vandana Travel Experts team. We'll get back to you within 24 hours.</p>" +
      '<div class="form-success__cta"><a class="btn btn--outline btn--sm" href="https://wa.me/' + WA + '">Message us on WhatsApp</a></div>';
    f.style.display = "none"; host.appendChild(s);
  }
  function fallbackFormSubmit(f, type, msg, btn) {
    var fd = new FormData(f); fd.delete("_honey");
    fd.append("_subject", type === "booking" ? "New Booking Enquiry — " + (val(f, "package") || "Package") : "New Website Enquiry from " + (val(f, "name") || ""));
    fd.append("_template", "table"); fd.append("_captcha", "false");
    fetch(FORM_AJAX, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) { if (j && (j.success === true || j.success === "true")) inquirySuccess(f); else { if (msg) { msg.innerHTML = 'We couldn\'t send right now. Please email <a href="mailto:' + EMAIL + '">' + EMAIL + "</a> or WhatsApp us."; msg.className = "form-msg err"; } setBtn(btn, false); } })
      .catch(function () { if (msg) { msg.innerHTML = 'Network issue. <a href="mailto:' + EMAIL + '">Email us</a> or WhatsApp ' + PHONE + "."; msg.className = "form-msg err"; } setBtn(btn, false); });
  }
  function initForms() { document.querySelectorAll("form[data-form]").forEach(initForm); }

  /* ================= ABOUT PAGE (affiliations + why-us) ================= */
  function affilCard(a) {
    var inner;
    if (a.img) {
      inner = '<div class="affil__logo"><img src="assets/img/logos/' + a.img + '" alt="' + esc(a.name) + ' logo" loading="lazy"></div>' +
        (a.sub ? '<div class="affil__sub">' + a.sub + "</div>" : "");
    } else {
      var size = a.ac.length >= 5 ? 18 : 23;
      inner = '<div class="affil__seal" style="--c:' + a.c + '">' +
        '<svg viewBox="0 0 100 100" aria-hidden="true">' +
          '<circle cx="50" cy="50" r="47" fill="#fff" stroke="var(--c)" stroke-width="2.5"/>' +
          '<circle cx="50" cy="50" r="40" fill="none" stroke="var(--c)" stroke-width="1" stroke-dasharray="1.5 3" opacity=".55"/>' +
          '<path d="M50 9 l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.6-5 2.6 .9-5.6-4-4 5.6-.8z" fill="var(--c)"/>' +
          '<path d="M27 74 q23 12 46 0" fill="none" stroke="var(--c)" stroke-width="1" opacity=".5"/>' +
          '<text x="50" y="57" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-weight="800" font-size="' + size + '" fill="var(--c)">' + a.ac + "</text>" +
        "</svg></div>" +
        '<div class="affil__name">' + a.name + "</div><div class=\"affil__sub\">" + a.sub + "</div>";
    }
    return '<div class="affil reveal">' + inner + "</div>";
  }
  function renderAbout() {
    var ag = document.getElementById("affil-grid");
    if (ag) {
      var affils = [
        { name: "IATA", img: "iata.svg", sub: "TIDS: 96097120" },
        { ac: "TAAI", name: "TAAI", sub: "Member", c: "#0ea5e9" },
        { name: "TAFI", img: "tafi.png", sub: "Member" },
        { name: "ADTOI", img: "adtoi.webp", sub: "Member" },
        { name: "NIDHI", img: "nidhi.jpg", sub: "Registered" },
        { name: "IATO", img: "iato.png", sub: "Member" },
        { name: "Ministry of Tourism", img: "mot.webp", sub: "Recognition No. 2110240HE706" }
      ];
      ag.innerHTML = affils.map(affilCard).join("");
    }
    var wg = document.getElementById("why-grid");
    if (wg) {
      var why = [
        ["25 Years' Experience", "Deep expertise across the travel and aviation industry."],
        ["24×7 Customer Service", "Reliable support whenever you need it — before, during and after your trip."],
        ["Tours of Every Duration", "From a 1-night getaway to a 30-night grand tour."],
        ["Every Lifestyle & Budget", "Luxury, upgraded and cost-saver tours to suit you."],
        ["For Every Traveller", "Individuals, families, corporates, groups and MICE clients."],
        ["Every Age Group", "Thoughtfully planned tours for ages 7 to 70."],
        ["Special Group Tours", "Students, senior citizens, honeymooners, corporates and more."],
        ["New Destination Ideas", "Innovative suggestions to inspire your next journey."],
        ["10,000+ Families Served", "A one-stop solution trusted for successful vacations."]
      ];
      wg.innerHTML = why.map(function (w, i) {
        return '<div class="why-item reveal" data-delay="' + ((i % 3) + 1) + '"><span class="why-item__ic">' + I.check + "</span><div><b>" + w[0] + "</b><p>" + w[1] + "</p></div></div>";
      }).join("");
    }
  }

  /* ================= TESTIMONIALS ================= */
  var TESTI = [
    { name: "Shalini Gupta", role: "Corporate Travel Experience", img: "avatar-5.webp", text: "We organized our company conference through Vandana Travel Experts, and everything was perfectly managed — from flights and hotel bookings to event coordination. Their professionalism and attention to detail were outstanding." },
    { name: "Rajesh Khanna", role: "Family Holiday Review", img: "avatar-1.jpg", text: "Our family trip to Bali was absolutely amazing thanks to Vandana Travel Experts. The itinerary was well planned and the entire journey was smooth and enjoyable." },
    { name: "Amit Verma", role: "MICE Event Testimonial", img: "avatar-2.jpg", text: "We partnered with Vandana Travel Experts for our annual corporate incentive trip to Dubai. Their team handled everything flawlessly and ensured a fantastic experience for our employees." },
    { name: "Neha & Rohan", role: "Destination Wedding", img: "avatar-4.webp", text: "Our destination wedding in Goa was beautifully organized. Vandana Travel Experts managed travel, accommodation, and event coordination seamlessly." },
    { name: "Sanjay Mehta", role: "Travel Planning Feedback", img: "avatar-3.jpg", text: "The team at Vandana Travel Experts is very knowledgeable and supportive. They guided us through visa processing and travel planning for our Europe tour." }
  ];
  function renderTestimonials() {
    var track = document.getElementById("testi-track");
    if (!track) return;
    track.innerHTML = TESTI.map(function (t) {
      var stars = ""; for (var i = 0; i < 5; i++) stars += I.star;
      return '<div class="testi-card"><div class="testi-card__inner"><div class="testi-card__quote">&ldquo;</div>' +
        '<div class="testi-card__stars">' + stars + "</div><p class=\"testi-card__text\">" + t.text + "</p>" +
        '<div class="testi-card__person"><img src="assets/img/' + t.img + '" alt="' + t.name + '" loading="lazy"><div><b>' + t.name + "</b><small>" + t.role + "</small></div></div></div></div>";
    }).join("");
    var idx = 0;
    function perView() { return window.innerWidth >= 1080 ? 3 : window.innerWidth >= 760 ? 2 : 1; }
    function maxIdx() { return Math.max(0, TESTI.length - perView()); }
    function go(n) { idx = Math.min(Math.max(0, n), maxIdx()); track.style.transform = "translateX(-" + (idx * (100 / perView())) + "%)"; }
    var prev = document.getElementById("testi-prev"), next = document.getElementById("testi-next");
    if (prev) prev.addEventListener("click", function () { go(idx - 1); });
    if (next) next.addEventListener("click", function () { go(idx + 1); });
    var timer = setInterval(function () { go(idx >= maxIdx() ? 0 : idx + 1); }, 5000);
    track.parentElement.addEventListener("mouseenter", function () { clearInterval(timer); });
    window.addEventListener("resize", function () { go(idx); });
  }

  /* ================= MARQUEE STRIP (seamless, any width) ================= */
  function initMarquee() {
    var track = document.querySelector(".strip__track");
    var seq = track && track.querySelector(".strip__seq");
    var strip = document.querySelector(".strip");
    if (!seq || !strip) return;
    var base = seq.innerHTML;
    // Grow the first sequence until it is at least as wide as the viewport,
    // so one "half" of the track always covers the screen (no trailing gap).
    var guard = 0;
    while (seq.scrollWidth < strip.clientWidth + 120 && guard < 40) { seq.innerHTML += base; guard++; }
    // Duplicate the (now wide) sequence so the track is exactly two identical
    // halves — translateX(-50%) then loops perfectly seamlessly, forever.
    if (!track.querySelector(".strip__seq--clone")) {
      var clone = seq.cloneNode(true);
      clone.classList.add("strip__seq--clone");
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    }
  }

  /* ================= HERO ================= */
  function heroSlides() {
    var slides = document.querySelectorAll(".hero__slide");
    if (!slides.length) return;
    var i = 0; slides[0].classList.add("is-active");
    setInterval(function () { slides[i].classList.remove("is-active"); i = (i + 1) % slides.length; slides[i].classList.add("is-active"); }, 5500);
  }
  function heroParallax() {
    var slides = document.querySelector(".hero__slides"); var hero = document.querySelector(".hero");
    if (!slides || !hero || REDUCED) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(function () { var y = window.scrollY; if (y < hero.offsetHeight) slides.style.transform = "translate3d(0," + (y * 0.28).toFixed(1) + "px,0)"; ticking = false; }); ticking = true; }
    }, { passive: true });
  }

  /* ================= COUNTERS + REVEAL ================= */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")); var dur = 1800, start = null;
    function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); else el.textContent = target; }
    requestAnimationFrame(step);
  }
  var revealObs;
  function revealAll() { document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { if (revealObs) revealObs.observe(el); }); }
  function initObservers() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
      document.querySelectorAll("[data-count]").forEach(countUp); return;
    }
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealAll();
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.querySelectorAll("[data-count]").forEach(countUp); statObs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    document.querySelectorAll("[data-stats]").forEach(function (s) { statObs.observe(s); });
    setTimeout(function () {
      if (!document.querySelector(".reveal.in")) {
        document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
        document.querySelectorAll("[data-stats] [data-count]").forEach(countUp);
      }
    }, 1600);
  }

  function initFavourites() {
    document.addEventListener("click", function (e) {
      var f = e.target.closest && e.target.closest(".pkg-card__fav"); if (!f) return;
      e.preventDefault(); f.classList.toggle("is-fav");
    });
  }

  /* ================= PRELOADER ================= */
  function initPreloader() {
    var pl = document.getElementById("preloader");
    if (!pl) return;
    var done = false;
    function hide() {
      if (done) return; done = true;
      pl.classList.add("is-done");
      setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 650);
    }
    if (document.readyState === "complete") setTimeout(hide, 400);
    else window.addEventListener("load", function () { setTimeout(hide, 300); });
    setTimeout(hide, 2200); // safety cap — never hang
  }

  /* ================= LIVE TRAVEL INFO (flights + visa) ================= */
  // Same-origin on Vercel; cross-origin to the Vercel API from other hosts (CORS-enabled).
  var API_BASE = /(^|\.)vercel\.app$/.test(location.hostname) ? "" : "https://vandana-travel-experts.vercel.app";
  var INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
  var flightService = { get: function (code) { return fetch(API_BASE + "/api/flight?flight=" + encodeURIComponent(code)).then(function (r) { return r.json(); }); } };
  var visaService = {
    list: function () { return fetch(API_BASE + "/api/visa?list=1").then(function (r) { return r.json(); }); },
    get: function (from, to) { return fetch(API_BASE + "/api/visa?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to)).then(function (r) { return r.json(); }); }
  };
  function fmtTime(iso) { if (!iso) return "—"; var d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function fmtDate(iso) { if (!iso) return ""; var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString([], { day: "2-digit", month: "short" }); }
  function timeAgo(iso) { var d = new Date(iso); if (isNaN(d)) return "just now"; var s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000)); if (s < 60) return "just now"; var m = Math.round(s / 60); if (m < 60) return m + " min ago"; return Math.round(m / 60) + " hr ago"; }

  function renderFlightsPage() {
    var form = document.getElementById("flight-form"); if (!form) return;
    var out = document.getElementById("flight-result");
    var input = document.getElementById("flight-input");
    function loading(code) { out.innerHTML = '<div class="tool-loading"><span class="tool-spin"></span> Searching for flight <b>' + esc(code) + "</b>…</div>"; }
    function msg(text, err) { out.innerHTML = '<div class="tool-msg' + (err ? " tool-msg--err" : "") + '">' + esc(text) + "</div>"; }
    function badge(s) {
      var map = { scheduled: ["Scheduled", "st-sched"], active: ["In Air", "st-active"], landed: ["Landed", "st-landed"], cancelled: ["Cancelled", "st-cancel"], incident: ["Diverted", "st-delay"], diverted: ["Diverted", "st-delay"] };
      var m = map[s] || [s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown", "st-sched"];
      return '<span class="fl-badge ' + m[1] + '">' + m[0] + "</span>";
    }
    function leg(label, l) {
      function row(k, v) { return v && v !== "—" ? '<div class="fl-row"><span>' + k + "</span><b>" + esc(v) + "</b></div>" : ""; }
      return '<div class="fl-leg"><h4>' + label + "</h4>" +
        row("Scheduled", fmtTime(l.scheduled) + (fmtDate(l.scheduled) ? " · " + fmtDate(l.scheduled) : "")) +
        (l.estimated ? row("Estimated", fmtTime(l.estimated)) : "") +
        (l.actual ? row("Actual", fmtTime(l.actual)) : "") +
        row("Terminal", l.terminal) + row("Gate", l.gate) + "</div>";
    }
    function render(d, code) {
      if (!d || !d.ok) { msg((d && d.message) || "No live flight information is currently available. Please try again.", true); return; }
      var f = d.flight;
      if (!f) { msg(d.message || "No live information found for this flight.", false); return; }
      var dep = f.departure, arr = f.arrival, delay = Math.max(dep.delay || 0, arr.delay || 0);
      out.innerHTML =
        '<div class="fl-card reveal in">' +
          (d.demo ? '<div class="fl-demo">' + INFO + " Sample data shown. Add your free AviationStack key in Vercel to show live status.</div>" : "") +
          '<div class="fl-top"><div><div class="fl-no">' + esc(f.number || code) + '</div><div class="fl-al">' + esc(f.airline || "—") + "</div></div>" + badge(f.status) + "</div>" +
          '<div class="fl-route"><div class="fl-port"><b>' + esc(dep.iata || "—") + "</b><span>" + esc(dep.airport || "") + '</span></div><div class="fl-line">' + I.plane + '</div><div class="fl-port fl-port--r"><b>' + esc(arr.iata || "—") + "</b><span>" + esc(arr.airport || "") + "</span></div></div>" +
          '<div class="fl-grid">' + leg("Departure", dep) + leg("Arrival", arr) + "</div>" +
          (delay > 0 ? '<div class="fl-delay">' + INFO + " Delayed by approximately " + delay + " min</div>" : "") +
          '<div class="fl-foot"><span>Updated ' + timeAgo(d.updated) + " · Source: " + esc(d.source || "—") + '</span><div class="fl-actions"><button class="btn btn--outline btn--sm" data-refresh="' + esc(code) + '">↻ Refresh</button><button class="btn btn--primary btn--sm" data-book="Flight Booking Assistance">Enquire</button></div></div>' +
        "</div>";
    }
    function search(code) {
      code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length < 3) { msg("Please enter a valid flight number, e.g. AI302.", true); return; }
      loading(code);
      flightService.get(code).then(function (d) { render(d, code); }).catch(function () { msg("No live flight information is currently available. Please try again.", true); });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); search(input.value); });
    out.addEventListener("click", function (e) { var r = e.target.closest && e.target.closest("[data-refresh]"); if (r) search(r.getAttribute("data-refresh")); });
    var q = qs("flight"); if (q) { input.value = q; search(q); }
  }

  var VISA_IMG = {
    france: "dest-france.jpg", italy: "dest-europe.png", switzerland: "dest-switzerland.jpg",
    uae: "dest-dubai.png", singapore: "dest-singapore.jpg", thailand: "dest-thailand.png",
    srilanka: "dest-srilanka.jpg", nepal: "dest-nepal.jpg", bhutan: "dest-bhutan.png",
    japan: "dest-japan.png", usa: "dest-america.png", australia: "dest-australia.png", mauritius: "pkg-mauritius.jpg"
  };
  function visaBadgeCls(s) { return { visa_required: "vb-req", visa_free: "vb-free", visa_on_arrival: "vb-arr", e_visa: "vb-evisa", eta: "vb-evisa", permit: "vb-permit" }[s] || "vb-req"; }

  function renderVisaPage() {
    var form = document.getElementById("visa-form"); if (!form) return;
    var out = document.getElementById("visa-result");
    var toSel = document.getElementById("visa-to"), fromSel = document.getElementById("visa-from");
    var grid = document.getElementById("visa-dests");
    function runFor(id) { if (!id) return; toSel.value = id; form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); var sec = document.getElementById("visa-result-section"); if (sec) setTimeout(function () { sec.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80); }
    visaService.list().then(function (d) {
      if (d && d.ok) {
        toSel.innerHTML = '<option value="">Select destination…</option>' + d.destinations.map(function (x) { return '<option value="' + x.id + '">' + x.flag + " " + esc(x.country) + "</option>"; }).join("");
        if (grid) {
          var feat = d.destinations.filter(function (x) { return VISA_IMG[x.id]; });
          grid.innerHTML = feat.map(function (x) {
            return '<button class="visa-dest reveal" data-visa="' + x.id + '" type="button">' +
              '<img src="assets/img/' + VISA_IMG[x.id] + '" alt="' + esc(x.country) + '" loading="lazy">' +
              '<span class="visa-dest__grad"></span>' +
              '<span class="visa-dest__body"><span class="visa-dest__name">' + esc(x.country) + '</span><span class="visa-badge visa-badge--sm ' + visaBadgeCls(x.status) + '">' + esc(x.statusLabel || "Check") + "</span></span></button>";
          }).join("");
          revealAll();
        }
      } else { toSel.innerHTML = '<option value="">Unavailable — try later</option>'; if (grid) grid.innerHTML = ""; }
    }).catch(function () { toSel.innerHTML = '<option value="">Unavailable — try later</option>'; });
    if (grid) grid.addEventListener("click", function (e) { var b = e.target.closest("[data-visa]"); if (b) runFor(b.getAttribute("data-visa")); });
    function badge(s, label) { return '<span class="visa-badge ' + visaBadgeCls(s) + '">' + esc(label || "Check") + "</span>"; }
    function fact(k, v) { return v ? '<div class="visa-fact"><span>' + k + "</span><b>" + esc(v) + "</b></div>" : ""; }
    function render(d) {
      if (!d || !d.ok) { out.innerHTML = '<div class="tool-msg tool-msg--err">' + esc((d && d.message) || "Unable to fetch requirements.") + "</div>"; return; }
      if (d.supported === false) {
        out.innerHTML = '<div class="visa-card reveal in"><div class="visa-head"><div class="visa-flag">' + (d.flag || "🌍") + "</div><div><h3>" + esc(d.country || "") + '</h3></div></div><div class="visa-note">' + INFO + " " + esc(d.message) + '</div><div class="visa-source">Official source: <a href="' + esc(d.officialUrl) + '" target="_blank" rel="noopener">' + esc(d.officialName || "Official portal") + "</a></div></div>";
        return;
      }
      var docs = (d.documents || []).map(function (x) { return "<li>" + I.check + "<span>" + esc(x) + "</span></li>"; }).join("");
      var bookMsg = "Visa enquiry\nNationality: Indian passport\nDestination: " + d.country + "\nVisa type: " + (d.visaType || "—");
      out.innerHTML =
        '<div class="visa-card reveal in">' +
          '<div class="visa-head"><div class="visa-flag">' + (d.flag || "🌍") + '</div><div class="visa-head__t"><h3>' + esc(d.country) + '</h3><div class="visa-sub">Indian Passport · ' + esc(d.region || "") + "</div></div>" + badge(d.status, d.statusLabel) + "</div>" +
          '<div class="visa-facts">' + fact("Visa Type", d.visaType) + fact("Allowed Stay", d.stay) + fact("Entry", d.entry) + fact("Visa Fee", d.fee || d.feeNote) + fact("Processing", d.processing || "Verify with the authority") + "</div>" +
          (d.note ? '<div class="visa-note">' + INFO + " " + esc(d.note) + "</div>" : "") +
          '<h4 class="visa-h4">Required Documents</h4><ul class="visa-docs">' + docs + "</ul>" +
          '<div class="visa-source">Official source: <a href="' + esc(d.officialUrl) + '" target="_blank" rel="noopener">' + esc(d.officialName) + "</a> · Last checked: " + esc(d.checked) + "</div>" +
          '<div class="visa-disc">' + INFO + " " + esc(d.disclaimer) + "</div>" +
          '<div class="visa-cta"><button class="btn btn--primary" data-book="Visa Assistance — ' + esc(d.country) + '" data-book-msg="' + esc(bookMsg) + '">Get Visa Assistance</button><a class="btn btn--outline" href="' + esc(d.officialUrl) + '" target="_blank" rel="noopener">Official Portal ↗</a></div>' +
        "</div>";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = toSel.value; if (!to) { out.innerHTML = '<div class="tool-msg tool-msg--err">Please choose a destination.</div>'; return; }
      out.innerHTML = '<div class="tool-loading"><span class="tool-spin"></span> Checking current visa information…</div>';
      visaService.get(fromSel.value || "IN", to).then(render).catch(function () { out.innerHTML = '<div class="tool-msg tool-msg--err">Visa information is currently unavailable. Please try again, or contact us for assistance.</div>'; });
    });
  }

  /* The DATABASE is the single source of truth for published packages. Once the
     backend is configured, whatever it returns is authoritative — INCLUDING an
     empty list (e.g. the admin unpublished everything), so unpublishing really
     does clear the public site. The bundled static array in packages.js is a
     last-resort fallback used ONLY when the API is unreachable or not yet
     configured, so the site still renders during an outage. */
  function loadPackages(done) {
    var finished = false;
    var to = setTimeout(function () { if (!finished) { finished = true; done(); } }, 2500);
    fetch(API_BASE + "/api/packages").then(function (r) { return r.json(); }).then(function (j) {
      if (finished) return; finished = true; clearTimeout(to);
      if (j && j.ok && j.configured && Array.isArray(j.packages)) { PKGS = j.packages; window.VTE_PACKAGES = j.packages; }
      done();
    }).catch(function () { if (finished) return; finished = true; clearTimeout(to); done(); });
  }

  /* ================= INIT ================= */
  initPreloader(); // run ASAP (script is at end of body)
  document.addEventListener("DOMContentLoaded", function () {
    loadPackages(function () {
      renderHeader();
      renderFooter();
      renderHome();
      renderPackagesPage();
      renderPackageDetail();
      renderAbout();
      renderTestimonials();
      initMarquee();
      heroSlides();
      heroParallax();
      initBookingTriggers();
      initFavourites();
      initForms();
      renderFlightsPage();
      renderVisaPage();
      renderDocuments();
      initObservers();
    });
  });
})();
