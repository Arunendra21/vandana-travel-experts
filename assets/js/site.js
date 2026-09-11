/* =========================================================
   Vandana Travel Experts — site scripts
   Shared header/footer injection + interactions/animations
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Small SVG icon set (inline, no external deps) ---------- */
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
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7l4.6 3.6-1.7 2.9-2.5-.3a1 1 0 0 0-.9 1.6l2 2 2 2a1 1 0 0 0 1.6-.9l-.3-2.5 2.9-1.7 3.6 4.6a1 1 0 0 0 1.7-.9z"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21V7l8-4 8 4v14M9 21v-4h6v4"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>',
    bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11M4 17h16M4 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2m8 0v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2M4 11h16"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>',
    holiday: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
    visa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h4M7 12h6M7 16h3"/><circle cx="17" cy="9" r="2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>',
    price: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  };

  /* ---------- Site data ---------- */
  var PHONE = "+919004222290";
  var PHONE2 = "+918779385247";
  var WA = "919004222290";
  var EMAIL = "vandanatravelexperts@gmail.com";

  var intlMenu = [
    { g: "Europe", items: ["Switzerland", "France", "Italy", "Germany", "Netherlands", "Austria", "Paris", "Interlaken"] },
    { g: "Middle East & Africa", items: ["Dubai & Middle East", "Mauritius", "Seychelles", "Africa"] },
    { g: "Asia Pacific", items: ["Bhutan", "Nepal", "Thailand", "Japan & China", "Australia & New Zealand", "South East Asia"] },
    { g: "Americas & Islands", items: ["America", "Sri Lanka & Maldives", "Eurasia"] }
  ];
  var domMenu = [
    { g: "North India", items: ["Himachal", "Manali", "Chardham", "Leh Ladakh", "Nainital", "Uttarakhand"] },
    { g: "South India", items: ["Kerala", "Tamil Nadu", "Karnataka", "Andaman", "Lakshadweep"] },
    { g: "North East", items: ["Sikkim", "West Bengal", "Assam", "Meghalaya", "Manipur"] },
    { g: "West & Central", items: ["Rajasthan", "Goa", "Maharashtra", "Madhya Pradesh"] }
  ];

  window.VTE_DATA = {
    destinations: [
      { name: "Europe", img: "dest-europe.png", tag: "International" },
      { name: "Australia", img: "dest-australia.png", tag: "International" },
      { name: "Ladakh", img: "dest-ladakh.png", tag: "Domestic" },
      { name: "Sikkim", img: "dest-sikkim.png", tag: "Domestic" },
      { name: "Dubai", img: "dest-dubai.png", tag: "International" },
      { name: "America", img: "dest-america.png", tag: "International" },
      { name: "Japan", img: "dest-japan.png", tag: "International" },
      { name: "Kerala", img: "dest-kerala.png", tag: "Domestic" },
      { name: "Bhutan", img: "dest-bhutan.png", tag: "International" },
      { name: "Thailand", img: "dest-thailand.png", tag: "International" },
      { name: "Kashmir", img: "dest-kashmir.png", tag: "Domestic" },
      { name: "Ooty", img: "dest-ooty.png", tag: "Domestic" }
    ],
    intl: [
      { name: "Dubai & Middle East", img: "dest-dubai.png", price: "85,000", opts: 12, days: "6N / 7D", desc: "Skyscrapers, desert safaris and luxury shopping in the dazzling Emirates." },
      { name: "Europe Holiday", img: "dest-europe.png", price: "1,98,000", opts: 43, days: "9N / 10D", desc: "A grand multi-country journey through Europe's most iconic cities." },
      { name: "America Holiday", img: "dest-america.png", price: "4,75,000", opts: 18, days: "10N / 11D", desc: "Coast-to-coast USA — landmarks, theme parks and skylines." },
      { name: "Mauritius Holiday", img: "pkg-mauritius.jpg", price: "99,000", opts: 4, days: "5N / 6D", desc: "Turquoise lagoons, white beaches and island luxury resorts." },
      { name: "Africa Holiday", img: "pkg-africa.jpg", price: "2,28,000", opts: 8, days: "7N / 8D", desc: "Thrilling safaris and breathtaking wildlife across the savannah." },
      { name: "Bhutan Holiday", img: "dest-bhutan.png", price: "99,000", opts: 2, days: "5N / 6D", desc: "The Land of the Thunder Dragon — monasteries, valleys and calm." }
    ],
    dom: [
      { name: "Kerala Holiday", img: "dest-kerala.png", price: "18,990", opts: 17, days: "4N / 5D", desc: "Backwaters, houseboats and lush green landscapes of God's Own Country." },
      { name: "Himachal Holiday", img: "pkg-himachal.jpg", price: "19,990", opts: 18, days: "5N / 6D", desc: "Snow peaks, pine valleys and hill-station charm in the Himalayas." },
      { name: "Sikkim & Darjeeling", img: "dest-sikkim.png", price: "46,990", opts: 6, days: "6N / 7D", desc: "Tea gardens, monasteries and Himalayan views of the North East." },
      { name: "Rajasthan Holiday", img: "pkg-rajasthan.jpg", price: "24,990", opts: 21, days: "5N / 6D", desc: "Royal palaces, golden forts and vibrant desert culture." },
      { name: "Andaman Holiday", img: "pkg-andaman.jpg", price: "34,990", opts: 5, days: "5N / 6D", desc: "Coral reefs, pristine islands and unforgettable water sports." },
      { name: "Chardham Yatra", img: "pkg-chardham.jpg", price: "95,990", opts: 3, days: "9N / 10D", desc: "A sacred Himalayan pilgrimage to the four holy shrines." }
    ],
    testimonials: [
      { name: "Shalini Gupta", role: "Corporate Travel Experience", img: "avatar-5.webp", text: "We organized our company conference through Vandana Travel Experts, and everything was perfectly managed — from flights and hotel bookings to event coordination. Their professionalism and attention to detail were outstanding." },
      { name: "Rajesh Khanna", role: "Family Holiday Review", img: "avatar-1.jpg", text: "Our family trip to Bali was absolutely amazing thanks to Vandana Travel Experts. The itinerary was well planned and the entire journey was smooth and enjoyable." },
      { name: "Amit Verma", role: "MICE Event Testimonial", img: "avatar-2.jpg", text: "We partnered with Vandana Travel Experts for our annual corporate incentive trip to Dubai. Their team handled everything flawlessly and ensured a fantastic experience for our employees." },
      { name: "Neha & Rohan", role: "Destination Wedding", img: "avatar-4.webp", text: "Our destination wedding in Goa was beautifully organized. Vandana Travel Experts managed travel, accommodation, and event coordination seamlessly." },
      { name: "Sanjay Mehta", role: "Travel Planning Feedback", img: "avatar-3.jpg", text: "The team at Vandana Travel Experts is very knowledgeable and supportive. They guided us through visa processing and travel planning for our Europe tour." }
    ]
  };

  /* ---------- Header ---------- */
  function buildMega(list, label) {
    var groups = list.map(function (grp) {
      var chips = grp.items.map(function (it) { return '<a href="contact.html">' + it + "</a>"; }).join("");
      return '<div class="dropdown__group"><div class="dropdown__title">' + grp.g + '</div><div class="dropdown__chips">' + chips + "</div></div>";
    }).join("");
    return '<div class="dropdown dropdown--mega">' + groups + "</div>";
  }

  function renderHeader() {
    var page = document.body.getAttribute("data-page") || "";
    function act(p) { return page === p ? " is-active" : ""; }
    var header =
      '<div class="container"><nav class="nav">' +
        '<a class="nav__logo" href="index.html" aria-label="Vandana Travel Experts home">' +
          '<img src="assets/img/logo.png" alt="Vandana Travel Experts logo">' +
          '<span class="nav__logo-text"><span class="ln"><b>Vandana</b> Travel Experts</span><small>We Keep it Simple</small></span>' +
        "</a>" +
        '<button class="nav__toggle" aria-label="Toggle menu" aria-expanded="false"><span></span></button>' +
        '<ul class="nav__menu">' +
          '<li class="nav__item"><a class="nav__link' + act("home") + '" href="index.html">Home</a></li>' +
          '<li class="nav__item"><a class="nav__link' + act("about") + '" href="about.html">About Us</a></li>' +
          '<li class="nav__item has-mega"><a class="nav__link" href="index.html#international">International Packages ' + I.caret + '</a>' + buildMega(intlMenu) + "</li>" +
          '<li class="nav__item has-mega"><a class="nav__link" href="index.html#domestic">Domestic Packages ' + I.caret + '</a>' + buildMega(domMenu) + "</li>" +
          '<li class="nav__item"><a class="nav__link" href="index.html#corporate">Corporate Travel</a></li>' +
          '<li class="nav__item"><a class="nav__link' + act("contact") + '" href="contact.html">Contact Us</a></li>' +
          '<li class="nav__cta"><a class="btn btn--primary btn--sm" href="contact.html">Get a Quote ' + I.arrow + "</a></li>" +
        "</ul>" +
        '<a class="nav__cta desktop-only btn btn--primary btn--sm" href="contact.html">Get a Quote ' + I.arrow + "</a>" +
      "</nav></div>";
    var el = document.getElementById("site-header");
    if (el) { el.className = "site-header"; el.innerHTML = header; }
    var bd = document.createElement("div"); bd.className = "nav__backdrop"; document.body.appendChild(bd);

    // interactions
    var toggle = el.querySelector(".nav__toggle");
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    bd.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    // mobile accordion for dropdown items
    el.querySelectorAll(".nav__item.has-mega > .nav__link").forEach(function (lnk) {
      lnk.addEventListener("click", function (e) {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          lnk.parentElement.classList.toggle("open");
        }
      });
    });
    el.querySelectorAll(".nav__menu a:not(.has-mega > .nav__link)").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    });

    // scroll solidify
    function onScroll() {
      if (window.scrollY > 30) el.classList.add("is-solid");
      else el.classList.remove("is-solid");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    var yr = 2026;
    var svcLinks = ["Flight", "Hotel", "Bus", "Holiday Packages", "Visa Assistance", "Travel Insurance"];
    var helpLinks = ["Become a Partner", "Web Check-In", "Contact Us", "Testimonials", "About Us"];
    var footer =
      '<div class="container">' +
        '<div class="footer__top">' +
          '<div class="footer__brand">' +
            '<img src="assets/img/logo.png" alt="Vandana Travel Experts">' +
            "<p>A trusted travel management company with 25+ years of expertise — luxury holidays, corporate travel and MICE events, crafted with precision and care.</p>" +
            '<ul class="footer__contact">' +
              "<li>" + I.phone + '<a href="tel:' + PHONE + '">' + PHONE + " &nbsp;|&nbsp; " + PHONE2 + "</a></li>" +
              "<li>" + I.mail + '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a></li>" +
              "<li>" + I.pin + "<span>1604, Kamdhenu Commerz, Sector 14, Kharghar, Navi Mumbai – 410210</span></li>" +
            "</ul>" +
            '<div class="footer__socials">' +
              '<a href="#" aria-label="Facebook">' + I.fb + "</a>" +
              '<a href="#" aria-label="Twitter">' + I.tw + "</a>" +
              '<a href="#" aria-label="Instagram">' + I.insta + "</a>" +
              '<a href="#" aria-label="YouTube">' + I.yt + "</a>" +
              '<a href="https://wa.me/' + WA + '" aria-label="WhatsApp">' + I.wa + "</a>" +
            "</div>" +
          "</div>" +
          '<div class="footer__col"><h4>Services</h4><ul>' + svcLinks.map(function (s) { return '<li><a href="index.html#services">' + s + "</a></li>"; }).join("") + "</ul></div>" +
          '<div class="footer__col"><h4>Company</h4><ul>' + helpLinks.map(function (s) { return '<li><a href="about.html">' + s + "</a></li>"; }).join("") + "</ul></div>" +
          '<div class="footer__col"><h4>Download Our App</h4>' +
            "<p style=\"font-size:.9rem;margin-bottom:16px\">Get exclusive discounts, instant fare alerts and flight tracking.</p>" +
            '<div class="footer__apps">' +
              '<a href="#"><img src="assets/img/playstore.jpg" alt="Get it on Google Play"></a>' +
              '<a href="#"><img src="assets/img/appstore.png" alt="Download on the App Store"></a>' +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="footer__bottom">' +
          "<span>© " + yr + " Vandana Travel Experts. All rights reserved.</span>" +
          '<ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms &amp; Conditions</a></li><li><a href="#">Cancellation &amp; Payment Policy</a></li><li><a href="#">Disclaimer</a></li></ul>' +
        "</div>" +
      "</div>";
    var el = document.getElementById("site-footer");
    if (el) { el.className = "footer"; el.innerHTML = footer; }

    // floating buttons
    var wa = document.createElement("a");
    wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi Vandana Travel Experts, I'd like to plan a trip.");
    wa.className = "float-wa"; wa.setAttribute("aria-label", "Chat on WhatsApp"); wa.innerHTML = I.wa;
    document.body.appendChild(wa);

    var top = document.createElement("button");
    top.className = "to-top"; top.setAttribute("aria-label", "Back to top"); top.innerHTML = I.up;
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(top);
    window.addEventListener("scroll", function () {
      if (window.scrollY > 600) top.classList.add("show"); else top.classList.remove("show");
    }, { passive: true });
  }

  /* ---------- Expose icons for pages ---------- */
  window.VTE_ICONS = I;

  /* ---------- Home page rendering ---------- */
  function money(p) { return '<b>₹' + p + ' <span>/ person</span></b>'; }

  function pkgCard(p) {
    return '<article class="pkg-card reveal">' +
      '<div class="pkg-card__media"><img src="assets/img/' + p.img + '" alt="' + p.name + '" loading="lazy">' +
        '<span class="pkg-card__tag">' + I.layers + p.opts + ' tour options</span>' +
        '<button class="pkg-card__fav" aria-label="Save">' + I.heart + '</button>' +
      "</div>" +
      '<div class="pkg-card__body">' +
        '<h3 class="pkg-card__title">' + p.name + "</h3>" +
        '<p class="pkg-card__desc">' + p.desc + "</p>" +
        '<div class="pkg-card__feats"><span>' + I.calendar + p.days + "</span><span>" + I.check + "All inclusive</span></div>" +
        '<div class="pkg-card__foot"><div class="pkg-card__price"><small>Starting from</small>' + money(p.price) + "</div>" +
          '<a class="btn btn--primary" href="contact.html">Enquire ' + I.arrow + "</a>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function destCard(d) {
    return '<a class="dest-card reveal" href="index.html#' + (d.tag === "Domestic" ? "domestic" : "international") + '">' +
      '<img src="assets/img/' + d.img + '" alt="' + d.name + '" loading="lazy">' +
      '<div class="dest-card__body">' +
        '<div class="dest-card__name">' + d.name + "</div>" +
        '<div class="dest-card__meta">' + I.globe + d.tag + " tour</div>" +
        '<span class="dest-card__link">Explore packages ' + I.arrow + "</span>" +
      "</div>" +
    "</a>";
  }

  function renderHome() {
    var D = window.VTE_DATA;
    var dg = document.getElementById("dest-grid");
    if (dg) dg.innerHTML = D.destinations.map(destCard).join("");
    var ig = document.getElementById("pkg-intl-grid");
    if (ig) ig.innerHTML = D.intl.map(pkgCard).join("");
    var dgp = document.getElementById("pkg-dom-grid");
    if (dgp) dgp.innerHTML = D.dom.map(pkgCard).join("");

    // package tabs
    document.querySelectorAll(".pkg-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-target");
        document.querySelectorAll(".pkg-tab").forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        document.querySelectorAll(".pkg-panel").forEach(function (p) { p.classList.toggle("is-active", p.id === target); });
        revealAll();
      });
    });
  }

  /* ---------- Testimonials carousel ---------- */
  function renderTestimonials() {
    var track = document.getElementById("testi-track");
    if (!track) return;
    var D = window.VTE_DATA.testimonials;
    track.innerHTML = D.map(function (t) {
      var stars = ""; for (var i = 0; i < 5; i++) stars += I.star;
      return '<div class="testi-card"><div class="testi-card__inner">' +
        '<div class="testi-card__quote">&ldquo;</div>' +
        '<div class="testi-card__stars">' + stars + "</div>" +
        '<p class="testi-card__text">' + t.text + "</p>" +
        '<div class="testi-card__person"><img src="assets/img/' + t.img + '" alt="' + t.name + '" loading="lazy"><div><b>' + t.name + "</b><small>" + t.role + "</small></div></div>" +
        "</div></div>";
    }).join("");

    var idx = 0;
    function perView() { return window.innerWidth >= 1080 ? 3 : window.innerWidth >= 760 ? 2 : 1; }
    function maxIdx() { return Math.max(0, D.length - perView()); }
    function go(n) { idx = Math.min(Math.max(0, n), maxIdx()); track.style.transform = "translateX(-" + (idx * (100 / perView())) + "%)"; }
    var prev = document.getElementById("testi-prev"), next = document.getElementById("testi-next");
    if (prev) prev.addEventListener("click", function () { go(idx - 1); });
    if (next) next.addEventListener("click", function () { go(idx + 1); });
    var timer = setInterval(function () { go(idx >= maxIdx() ? 0 : idx + 1); }, 5000);
    track.parentElement.addEventListener("mouseenter", function () { clearInterval(timer); });
    window.addEventListener("resize", function () { go(idx); });
  }

  /* ---------- Hero slideshow ---------- */
  function heroSlides() {
    var slides = document.querySelectorAll(".hero__slide");
    if (!slides.length) return;
    var i = 0;
    slides[0].classList.add("is-active");
    setInterval(function () {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 5500);
  }

  /* ---------- Count-up stats ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dur = 1800, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Scroll reveal + counters ---------- */
  var revealObs;
  function revealAll() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { if (revealObs) revealObs.observe(el); });
  }
  function initObservers() {
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealAll();

    var counted = false;
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.querySelectorAll("[data-count]").forEach(countUp); statObs.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll("[data-stats]").forEach(function (s) { statObs.observe(s); });
  }

  /* ---------- Newsletter / contact form (front-end only) ---------- */
  function initForms() {
    document.querySelectorAll("form[data-form]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var type = f.getAttribute("data-form");
        var msg = f.querySelector(".form-msg");
        if (type === "contact") {
          var name = f.querySelector("[name=name]").value.trim();
          var email = f.querySelector("[name=email]").value.trim();
          var message = f.querySelector("[name=message]").value.trim();
          var body = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\n" + message);
          window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Trip enquiry from " + name) + "&body=" + body;
        }
        if (msg) { msg.textContent = type === "contact" ? "Opening your email app… we'll reply within 24 hours." : "You have been successfully subscribed!"; msg.className = "form-msg ok"; }
        f.reset();
      });
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    renderHome();
    renderTestimonials();
    heroSlides();
    initForms();
    initObservers();
  });
})();
