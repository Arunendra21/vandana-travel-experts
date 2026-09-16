/* ============================================================================
   Vandana Travel Experts — Admin control center (single-page app).
   Talks ONLY to the real backend (/api/admin/*, same-origin HttpOnly cookie).
   Design goals: nothing ever fails silently. Every load has loading / empty /
   error(retry) states. Network failures show a visible, retryable message
   instead of a blank screen or a redirect loop.
   ========================================================================== */
(function () {
  "use strict";
  var BUILD = "admin-spa-2026-09-16-domain";

  /* ---------- tiny helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmtDate(iso) { if (!iso) return "—"; var d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString([], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  function fmtSize(n) { n = +n || 0; if (n <= 0) return "—"; if (n < 1048576) return Math.round(n / 1024) + " KB"; return (n / 1048576).toFixed(1) + " MB"; }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 250); }; }

  var I = {
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.78 1 1.42 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>'
  };

  /* ---------- toast ---------- */
  var toastWrap;
  function toast(msg, type) {
    if (!toastWrap) { toastWrap = el("div", "ad-toast-wrap"); document.body.appendChild(toastWrap); }
    var t = el("div", "ad-toast" + (type ? " ad-toast--" + type : "")); t.textContent = msg;
    toastWrap.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transition = ".4s"; setTimeout(function () { t.remove(); }, 400); }, 3000);
  }

  /* ---------- robust API: NEVER throws or hangs; always resolves to an object.
     A 12s timeout guarantees a stalled/blocked request becomes a visible error
     (never an endless spinner or blank). ---------- */
  function api(path, opts) {
    opts = opts || {};
    var o = { method: opts.method || "GET", headers: { Accept: "application/json" }, credentials: "same-origin", cache: "no-store" };
    if (opts.body !== undefined) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(opts.body); }
    var ctrl = null, timer = null;
    try { ctrl = new AbortController(); o.signal = ctrl.signal; timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 12000); } catch (e) {}
    function done(v) { if (timer) clearTimeout(timer); return v; }
    return fetch(path, o).then(function (r) {
      return r.json().then(function (j) { j.__status = r.status; return done(j); })
        .catch(function () { return done({ ok: false, __status: r.status, error: "bad_response", message: "The server sent an unexpected response (HTTP " + r.status + ")." }); });
    }).catch(function () {
      return done({ ok: false, __net: true, error: "network", message: "Couldn't reach the server (request blocked, offline, or timed out). If you use Brave Shields or an ad-blocker, allow this site, then Retry." });
    });
  }

  /* ---------- confirm dialog ---------- */
  function confirmDialog(title, text, yesLabel) {
    return new Promise(function (resolve) {
      var m = el("div", "ad-modal open");
      m.innerHTML = '<div class="ad-modal__bd"></div><div class="ad-modal__dlg"><h3 style="font-size:1.2rem;color:var(--a-navy);margin-bottom:8px">' + esc(title) + '</h3><p style="color:var(--a-500);margin-bottom:20px">' + esc(text) + '</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="ad-btn ad-btn--ghost" data-no>Cancel</button><button class="ad-btn ad-btn--danger" data-yes>' + esc(yesLabel || "Delete") + '</button></div></div>';
      document.body.appendChild(m);
      function done(v) { m.remove(); resolve(v); }
      m.querySelector("[data-no]").onclick = function () { done(false); };
      m.querySelector(".ad-modal__bd").onclick = function () { done(false); };
      m.querySelector("[data-yes]").onclick = function () { done(true); };
    });
  }
  function modal(html, width) {
    var m = el("div", "ad-modal open");
    m.innerHTML = '<div class="ad-modal__bd"></div><div class="ad-modal__dlg"' + (width ? ' style="max-width:' + width + 'px"' : '') + '><button class="ad-modal__x" aria-label="Close">' + I.x + '</button><div class="ad-modal__content"></div></div>';
    document.body.appendChild(m);
    $(".ad-modal__content", m).innerHTML = html;
    function close() { m.remove(); }
    m.querySelector(".ad-modal__x").onclick = close;
    m.querySelector(".ad-modal__bd").onclick = close;
    return { root: m, close: close, content: $(".ad-modal__content", m) };
  }

  /* ---------- state blocks (loading / empty / error) ---------- */
  function loadingBlock(label) { return '<div class="ad-loading"><span class="ad-spin"></span> ' + esc(label || "Loading…") + '</div>'; }
  function emptyBlock(msg, actionHtml) { return '<div class="ad-empty">' + esc(msg) + (actionHtml ? ' ' + actionHtml : '') + '</div>'; }
  function errorBlock(msg) {
    return '<div class="ad-state-error"><div class="ad-state-error__ic">' + I.refresh + '</div><p>' + esc(msg || "Something went wrong.") + '</p><button class="ad-btn ad-btn--pri" data-retry>' + I.refresh + ' Retry</button></div>';
  }
  // renders into `host`, calls loader() -> promise<result>; on ok calls onData(result), else shows error+retry.
  // A watchdog guarantees the loading state is never permanent even if a promise never settles.
  function withData(host, loader, onData, loadLabel) {
    host.innerHTML = loadingBlock(loadLabel);
    var settled = false;
    function fail(msg) {
      if (settled) return; settled = true;
      host.innerHTML = errorBlock(msg || "Could not load this section.");
      var rb = host.querySelector("[data-retry]"); if (rb) rb.onclick = function () { withData(host, loader, onData, loadLabel); };
    }
    var wd = setTimeout(function () { fail("This is taking longer than expected — the request may be blocked. Please Retry."); }, 15000);
    loader().then(function (j) {
      if (settled) return; clearTimeout(wd); settled = true;
      if (j && j.ok) { try { onData(j); } catch (e) { fail("Loaded, but failed to render: " + (e && e.message || e)); } return; }
      settled = false; clearTimeout(wd); fail(j && j.message ? j.message : "Could not load this section.");
    }, function () { clearTimeout(wd); fail("Request failed. Please Retry."); });
  }

  /* ============================ SHELL ============================ */
  var ME = null, SHELL_BUILT = false;
  function isSuper() { return !!(ME && ME.isSuper); }
  function canPerm(p) { if (!p) return true; if (isSuper()) return true; return ME && Array.isArray(ME.permissions) && ME.permissions.indexOf(p) >= 0; }
  // [href, key, icon, label, requiredPerm|null, superOnly]
  function navFor() {
    var items = [
      ["#/dashboard", "dashboard", I.dash, "Dashboard", null, false],
      ["#/packages", "packages", I.box, "Packages", "packages.view", false],
      ["#/documents", "documents", I.file, "Documents", "documents.view", false],
      ["#/inquiries", "inquiries", I.mail, "Inquiries", "inquiries.view", false],
      ["#/travel", "travel", I.plane, "Travel Data", null, false],
      ["#/admins", "admins", I.users, "Administrators", null, true],
      ["#/audit", "audit", I.list, "Audit Logs", null, true],
      ["#/settings", "settings", I.gear, "Settings", null, false]
    ];
    return items.filter(function (n) { if (n[5] && !isSuper()) return false; return canPerm(n[4]); });
  }
  function buildShell() {
    document.body.classList.add("ad-body");
    var roleBadge = isSuper() ? '<span class="ad-role ad-role--super">' + I.shield + 'Super Admin</span>' : '<span class="ad-role">Admin</span>';
    document.body.innerHTML =
      '<div class="ad-shell"><aside class="ad-side"><div class="ad-side__brand"><img src="/assets/img/logo.png" alt=""><div><b>Vandana</b><span>Admin Panel</span></div></div>' +
        '<nav class="ad-nav" id="ad-nav">' + navFor().map(function (n) { return '<a href="' + n[0] + '" data-nav="' + n[1] + '">' + n[2] + n[3] + '</a>'; }).join("") + '</nav>' +
        '<div class="ad-side__foot">' + roleBadge + '<div class="ad-side__user" id="ad-user">' + esc(ME ? (ME.name ? ME.name + " · " : "") + ME.email : "") + '</div><button class="ad-logout" id="ad-logout">' + I.out + 'Log out</button><div class="ad-build">build ' + esc(BUILD) + '</div></div>' +
      '</aside><main class="ad-main"><button class="ad-burger" id="ad-burger">' + I.menu + '</button><div id="ad-view"></div></main></div>';
    $("#ad-logout").onclick = function () {
      api("/api/admin/logout", { method: "POST" }).then(function () { location.replace("login.html"); });
    };
    var burger = $("#ad-burger"); if (burger) burger.onclick = function () { document.body.classList.toggle("ad-open"); };
    $("#ad-nav").addEventListener("click", function () { document.body.classList.remove("ad-open"); });
    SHELL_BUILT = true;
  }
  function setActiveNav(name) { $all("#ad-nav a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("data-nav") === name); }); }
  function view() { return $("#ad-view"); }
  function head(title, sub, actionsHtml) {
    return '<div class="ad-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + (actionsHtml || '') + '</div>';
  }

  /* ============================ DASHBOARD ============================ */
  function pageDashboard() {
    setActiveNav("dashboard");
    var v = view(); v.innerHTML = head("Dashboard", "A live overview of your website — every number below is queried from the database.");
    var host = el("div"); v.appendChild(host);
    withData(host, function () { return api("/api/admin/dashboard"); }, function (j) {
      var p = j.packages || {}, q = j.inquiries || {}, d = j.documents || {}, a = j.apis || {};
      function card(n, l, s, href) {
        var inner = '<b>' + (n == null ? "—" : n) + '</b><span>' + esc(l) + '</span>' + (s ? '<small>' + esc(s) + '</small>' : '');
        return href ? '<a class="ad-stat ad-stat--link" href="' + href + '">' + inner + '</a>' : '<div class="ad-stat">' + inner + '</div>';
      }
      function statusRow(k, prov, ok) { return '<div class="ad-detail-row"><span>' + esc(k) + '</span><b>' + esc(prov) + ' &nbsp;<span class="pill pill--' + (ok ? "on" : "off") + '">' + (ok ? "Configured" : "Not set") + '</span></b></div>'; }
      host.innerHTML =
        '<div class="ad-cards">' +
          card(p.total, "Total packages", (p.published || 0) + " published · " + (p.draft || 0) + " draft", "#/packages") +
          card(p.national, "National", null, "#/packages?f=National") +
          card(p.international, "International", null, "#/packages?f=International") +
          card(p.featured, "Featured", null, "#/packages?f=featured") +
        '</div>' +
        '<div class="ad-cards">' +
          card(q.total, "Inquiries", null, "#/inquiries") +
          card(q.new, "New", null, "#/inquiries?s=new") +
          card(q.pending, "In progress", null, "#/inquiries") +
          card(d.total, "Documents", (d.published || 0) + " published", "#/documents") +
        '</div>' +
        (q.email_failed ? '<div class="ad-banner ad-banner--warn">' + q.email_failed + ' inquiry email(s) failed to send. Open Inquiries to resend.</div>' : '') +
        (isSuper() ? '<div class="ad-panel"><div class="ad-panel__h">Administrators <a class="ad-panel__link" href="#/admins">Manage →</a></div><div class="ad-panel__b" id="dash-admins">' + loadingBlock() + '</div></div>' : '') +
        '<div class="ad-panel"><div class="ad-panel__h">Integrations</div><div class="ad-panel__b">' +
          statusRow("Flight API", (a.flight && a.flight.provider) || "—", a.flight && a.flight.configured) +
          statusRow("Visa data", (a.visa && a.visa.provider) || "—", a.visa && a.visa.configured) +
          statusRow("Email", (a.email && a.email.provider) || "—", a.email && a.email.configured) +
          '<div class="ad-detail-row"><span>API keys</span><b style="color:var(--a-500)">Stored securely in Vercel — never shown here.</b></div>' +
        '</div></div>';
      if (isSuper()) {
        api("/api/admin/users").then(function (u) {
          var box = $("#dash-admins"); if (!box) return;
          if (!u.ok) { box.innerHTML = '<div class="ad-detail-row"><span>Administrators</span><b>—</b></div>'; return; }
          var rows = u.admins || [], active = 0, sup = 0, inv = 0;
          rows.forEach(function (x) { if (x.status === "active") active++; if (x.role === "super_admin") sup++; if (x.status === "invited") inv++; });
          box.innerHTML = '<div class="ad-detail-row"><span>Total administrators</span><b>' + rows.length + '</b></div>' +
            '<div class="ad-detail-row"><span>Active</span><b>' + active + '</b></div>' +
            '<div class="ad-detail-row"><span>Super Admins</span><b>' + sup + '</b></div>' +
            (inv ? '<div class="ad-detail-row"><span>Pending invites</span><b>' + inv + '</b></div>' : '');
        });
      }
    });
  }

  /* ============================ PACKAGES ============================ */
  function pagePackages(params) {
    setActiveNav("packages");
    var v = view();
    v.innerHTML = head("Packages", "Create, edit, publish, feature and reorder tour packages.",
      '<a class="ad-btn ad-btn--pri" href="#/packages/new">' + I.plus + 'Add Package</a>') +
      '<div class="ad-toolbar"><div class="ad-search">' + I.search + '<input id="pk-search" placeholder="Search name, country, region…"></div>' +
      '<button class="ad-filter" data-f="all">All</button><button class="ad-filter" data-f="National">National</button><button class="ad-filter" data-f="International">International</button>' +
      '<button class="ad-filter" data-f="published">Published</button><button class="ad-filter" data-f="draft">Draft</button><button class="ad-filter" data-f="featured">Featured</button></div>' +
      '<div class="ad-panel"><div id="pk-host"></div></div>';
    var host = $("#pk-host");
    var curF = (params && params.f) || "all", term = "", ALL = [];
    $all(".ad-filter", v).forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-f") === curF); });
    function draw() {
      var rows = ALL.filter(function (p) {
        if (term && (p.title + " " + (p.country || "") + " " + (p.region || "")).toLowerCase().indexOf(term) < 0) return false;
        if (curF === "all") return true;
        if (curF === "National" || curF === "International") return p.category === curF;
        if (curF === "featured") return p.featured;
        return p.status === curF;
      });
      if (!rows.length) { host.innerHTML = emptyBlock(ALL.length ? "No packages match this filter." : "No packages yet.", '<a href="#/packages/new">Add the first one</a>.'); return; }
      host.innerHTML = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th></th><th>Package</th><th>Category</th><th>Duration</th><th>Status</th><th>Featured</th><th>Order</th><th>Actions</th></tr></thead><tbody>' +
        rows.map(function (p) {
          return '<tr data-id="' + p.id + '">' +
            '<td><img class="ad-table__thumb" src="' + esc(rel(p.image)) + '" alt="" onerror="this.style.visibility=\'hidden\'"></td>' +
            '<td><div class="ad-table__title">' + esc(p.title) + '</div><div class="ad-table__sub">' + esc(p.country || "") + (p.region ? " · " + esc(p.region) : "") + '</div></td>' +
            '<td><span class="pill pill--' + (p.category === "National" ? "nat" : "intl") + '">' + esc(p.category) + '</span></td>' +
            '<td>' + (p.nights || 0) + 'N · ' + (p.days || 0) + 'D</td>' +
            '<td><span class="pill pill--' + esc(p.status) + '">' + esc(p.status) + '</span></td>' +
            '<td><button class="ad-ico-btn" data-feat title="Toggle featured"><span class="' + (p.featured ? "star" : "star--off") + '">' + I.star + '</span></button></td>' +
            '<td><button class="ad-ico-btn" data-up title="Move up">' + I.up + '</button><button class="ad-ico-btn" data-down title="Move down">' + I.down + '</button></td>' +
            '<td><div class="ad-row-actions"><a class="ad-ico-btn" href="' + custUrl("package.html?id=" + p.slug) + '" target="_blank" rel="noopener" title="View on site">' + I.eye + '</a>' +
              '<a class="ad-ico-btn" href="#/packages/edit/' + p.id + '" title="Edit">' + I.edit + '</a>' +
              '<button class="ad-ico-btn" data-dup title="Duplicate">' + I.copy + '</button>' +
              '<button class="ad-ico-btn" data-del title="Delete">' + I.trash + '</button></div></td></tr>';
        }).join("") + '</tbody></table></div>';
      $all("tr[data-id]", host).forEach(function (tr) {
        var id = tr.getAttribute("data-id"), p = byId(ALL, id);
        tr.querySelector("[data-feat]").onclick = function () {
          api("/api/admin/actions", { method: "POST", body: { op: "featured", id: id, featured: !p.featured } }).then(function (j) {
            if (j.ok) { p.featured = !p.featured; draw(); toast("Updated", "ok"); } else toast(j.message || "Failed", "err");
          });
        };
        tr.querySelector("[data-dup]").onclick = function () {
          api("/api/admin/actions", { method: "POST", body: { op: "duplicate", id: id } }).then(function (j) { if (j.ok) { toast("Duplicated (as draft)", "ok"); reload(); } else toast(j.message || "Failed", "err"); });
        };
        tr.querySelector("[data-del]").onclick = function () {
          confirmDialog("Delete package?", 'Archive "' + p.title + '"? It will be removed from the public website. You can still restore it in the database.').then(function (yes) {
            if (!yes) return; api("/api/admin/package?id=" + id, { method: "DELETE" }).then(function (j) { if (j.ok) { toast("Package archived", "ok"); reload(); } else toast(j.message || "Failed", "err"); });
          });
        };
        tr.querySelector("[data-up]").onclick = function () { move(id, -1); };
        tr.querySelector("[data-down]").onclick = function () { move(id, 1); };
      });
    }
    function move(id, dir) {
      ALL.sort(function (a, b) { return (a.sort - b.sort) || (a.id - b.id); });
      var idx = ALL.findIndex(function (p) { return String(p.id) === String(id); }), j = idx + dir;
      if (idx < 0 || j < 0 || j >= ALL.length) return;
      var t = ALL[idx]; ALL[idx] = ALL[j]; ALL[j] = t;
      var ids = ALL.map(function (p) { return p.id; });
      ALL.forEach(function (p, i) { p.sort = i; });
      draw();
      api("/api/admin/actions", { method: "POST", body: { op: "reorder", ids: ids } }).then(function (r) { if (!r.ok) toast("Reorder failed to save", "err"); });
    }
    function reload() { withData(host, function () { return api("/api/admin/packages"); }, function (j) { ALL = j.packages || []; draw(); }); }
    $("#pk-search").addEventListener("input", debounce(function () { term = this.value.toLowerCase(); draw(); }, 180));
    $all(".ad-filter", v).forEach(function (b) { b.onclick = function () { $all(".ad-filter", v).forEach(function (x) { x.classList.remove("is-active"); }); b.classList.add("is-active"); curF = b.getAttribute("data-f"); draw(); }; });
    reload();
  }
  function rel(u) { return u && /^assets\//.test(u) ? "/" + u : (u || ""); }
  function custUrl(rel) { return "/" + rel; }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i]; }

  /* ---------- PACKAGE EDITOR ---------- */
  function pagePackageEditor(id) {
    setActiveNav("packages");
    var editing = !!id, v = view();
    v.innerHTML = head((editing ? "Edit" : "New") + " Package", null, '<a class="ad-btn ad-btn--ghost" href="#/packages">← Back to packages</a>');
    var host = el("div"); v.appendChild(host);
    if (editing) { withData(host, function () { return api("/api/admin/package?id=" + id); }, function (j) { buildForm(host, j.package, id); }); }
    else buildForm(host, null, null);
  }
  function buildForm(host, pkg, id) {
    pkg = pkg || { category: "International", currency: "INR", status: "draft", nights: 0, days: 0, highlights: [], itinerary: [], inclusions: [], exclusions: [], featured: false, sort: 0 };
    var days = (pkg.itinerary || []).map(function (d) { return { day: d.day, title: d.title, body: d.body }; });
    function sel(a, b) { return a === b ? " selected" : ""; }
    host.innerHTML =
      '<div class="ad-panel"><div class="ad-panel__h">Basic information</div><div class="ad-panel__b"><div class="ad-form">' +
        '<div class="ad-grid2"><div class="ad-field"><label>Package name *</label><input id="f-title" value="' + esc(pkg.title || "") + '"></div>' +
        '<div class="ad-field"><label>Category *</label><select id="f-category"><option value="International"' + sel(pkg.category, "International") + '>International</option><option value="National"' + sel(pkg.category, "National") + '>National (India)</option></select></div></div>' +
        '<div class="ad-grid3"><div class="ad-field"><label>Country</label><input id="f-country" value="' + esc(pkg.country || "") + '"></div><div class="ad-field"><label>Region / cities</label><input id="f-region" value="' + esc(pkg.region || "") + '"></div><div class="ad-field"><label>Price (optional)</label><input id="f-price" value="' + esc(pkg.price || "") + '" placeholder="e.g. 85,000 or blank = On request"></div></div>' +
        '<div class="ad-grid3"><div class="ad-field"><label>Nights</label><input id="f-nights" type="number" min="0" value="' + (pkg.nights || 0) + '"></div><div class="ad-field"><label>Days</label><input id="f-days" type="number" min="0" value="' + (pkg.days || 0) + '"></div><div class="ad-field"><label>Sort order</label><input id="f-sort" type="number" min="0" value="' + (pkg.sort || 0) + '"></div></div>' +
        '<div class="ad-field"><label>Short summary</label><textarea id="f-summary">' + esc(pkg.summary || "") + '</textarea></div>' +
        '<div class="ad-field"><label>Overview</label><textarea id="f-overview" style="min-height:120px">' + esc(pkg.overview || "") + '</textarea></div>' +
        '<div class="ad-grid2"><div class="ad-field"><label>Status</label><select id="f-status"><option value="draft"' + sel(pkg.status, "draft") + '>Draft (hidden)</option><option value="published"' + sel(pkg.status, "published") + '>Published (live)</option><option value="unpublished"' + sel(pkg.status, "unpublished") + '>Unpublished (hidden)</option></select></div>' +
        '<div class="ad-field"><label>Featured on homepage</label><select id="f-featured"><option value="no"' + (pkg.featured ? "" : " selected") + '>No</option><option value="yes"' + (pkg.featured ? " selected" : "") + '>Yes</option></select></div></div>' +
      '</div></div></div>' +
      '<div class="ad-panel"><div class="ad-panel__h">Package image</div><div class="ad-panel__b"><div class="ad-image"><img class="ad-image__preview" id="img-prev" src="' + esc(rel(pkg.image)) + '" onerror="this.style.visibility=\'hidden\'"><div class="ad-image__drop"><div class="ad-field"><label>Upload (JPG/PNG/WEBP, ≤4 MB)</label><input type="file" id="img-file" accept="image/*"><div class="hint">Optimised in your browser, then stored securely. Or paste an image URL below.</div></div><div class="ad-field"><label>Image URL</label><input id="f-image" value="' + esc(pkg.image || "") + '"></div><div class="ad-msg" id="img-msg"></div></div></div></div></div>' +
      repPanel("Highlights", "hl") + repPanel("Inclusions", "inc") + repPanel("Exclusions", "exc") +
      '<div class="ad-panel"><div class="ad-panel__h">Itinerary <button class="ad-btn ad-btn--ghost ad-btn--sm" id="add-day">' + I.plus + 'Add Day</button></div><div class="ad-panel__b" id="day-list"></div></div>' +
      '<div class="ad-saverow"><a class="ad-btn ad-btn--ghost" href="#/packages">Cancel</a><button class="ad-btn ad-btn--pri" id="pk-save">Save Package</button><div class="ad-msg" id="pk-msg"></div></div>';

    // simple repeatable lists
    fillRep("hl", pkg.highlights, "Highlight"); fillRep("inc", pkg.inclusions, "Inclusion"); fillRep("exc", pkg.exclusions, "Exclusion");
    $("#add-hl", host).onclick = function () { addRep("hl", "", "Highlight"); };
    $("#add-inc", host).onclick = function () { addRep("inc", "", "Inclusion"); };
    $("#add-exc", host).onclick = function () { addRep("exc", "", "Exclusion"); };

    function renderDays() {
      var dh = $("#day-list", host); dh.innerHTML = "";
      days.forEach(function (d, i) {
        var box = el("div", "rep-day");
        box.innerHTML = '<div class="rep-day__top"><span class="rep-day__n">' + (i + 1) + '</span><input class="d-title" placeholder="Day title" value="' + esc(d.title || "") + '" style="flex:1"><div class="rep-day__ctrl"></div></div><textarea class="d-body" placeholder="What happens on this day…">' + esc(d.body || "") + '</textarea>';
        var ctrl = box.querySelector(".rep-day__ctrl");
        ctrl.appendChild(icoBtn(I.up, function () { if (i > 0) { var t = days[i - 1]; days[i - 1] = days[i]; days[i] = t; renderDays(); } }));
        ctrl.appendChild(icoBtn(I.down, function () { if (i < days.length - 1) { var t = days[i + 1]; days[i + 1] = days[i]; days[i] = t; renderDays(); } }));
        ctrl.appendChild(icoBtn(I.trash, function () { days.splice(i, 1); renderDays(); }, true));
        box.querySelector(".d-title").addEventListener("input", function () { d.title = this.value; });
        box.querySelector(".d-body").addEventListener("input", function () { d.body = this.value; });
        dh.appendChild(box);
      });
    }
    $("#add-day", host).onclick = function () { days.push({ title: "", body: "" }); renderDays(); };
    renderDays();

    // image upload (client downscale)
    $("#img-file", host).addEventListener("change", function () {
      var file = this.files[0]; if (!file) return; var msg = $("#img-msg", host);
      if (!/^image\//.test(file.type)) { msg.textContent = "Please choose an image file."; msg.className = "ad-msg err show"; return; }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 1600, s = Math.min(1, max / img.width), w = Math.round(img.width * s), h = Math.round(img.height * s);
          var c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
          var data = c.toDataURL("image/jpeg", 0.82);
          msg.textContent = "Uploading…"; msg.className = "ad-msg show";
          api("/api/admin/upload", { method: "POST", body: { filename: file.name, data: data } }).then(function (j) {
            if (j.ok) { $("#f-image", host).value = j.url; var pv = $("#img-prev", host); pv.src = j.url; pv.style.visibility = "visible"; msg.textContent = "Uploaded ✓"; msg.className = "ad-msg ok show"; }
            else { msg.textContent = j.message || "Upload failed."; msg.className = "ad-msg err show"; }
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    $("#f-image", host).addEventListener("input", function () { var pv = $("#img-prev", host); pv.src = rel(this.value); pv.style.visibility = "visible"; });

    $("#pk-save", host).onclick = function () {
      var msg = $("#pk-msg", host), btn = $("#pk-save", host);
      var payload = {
        title: $("#f-title", host).value, category: $("#f-category", host).value,
        country: $("#f-country", host).value, region: $("#f-region", host).value, image: $("#f-image", host).value,
        nights: $("#f-nights", host).value, days: $("#f-days", host).value, price: $("#f-price", host).value,
        summary: $("#f-summary", host).value, overview: $("#f-overview", host).value,
        status: $("#f-status", host).value, featured: $("#f-featured", host).value === "yes", sort: $("#f-sort", host).value,
        highlights: collectRep("hl"), inclusions: collectRep("inc"), exclusions: collectRep("exc"),
        itinerary: days.filter(function (d) { return (d.title || "").trim() || (d.body || "").trim(); })
      };
      if (!payload.title.trim()) { msg.textContent = "Package name is required."; msg.className = "ad-msg err show"; return; }
      btn.classList.add("is-loading"); btn.disabled = true; msg.textContent = "";
      var req = id ? api("/api/admin/package?id=" + id, { method: "PUT", body: payload }) : api("/api/admin/packages", { method: "POST", body: payload });
      req.then(function (j) {
        btn.classList.remove("is-loading"); btn.disabled = false;
        if (j.ok) { toast("Package saved ✓", "ok"); location.hash = "#/packages"; }
        else { msg.textContent = (j.errors && j.errors.join(" ")) || j.message || "Save failed."; msg.className = "ad-msg err show"; }
      });
    };

    // helpers scoped to this form
    function repPanel(title, key) { return '<div class="ad-panel"><div class="ad-panel__h">' + title + ' <button class="ad-btn ad-btn--ghost ad-btn--sm" id="add-' + key + '">' + I.plus + 'Add</button></div><div class="ad-panel__b" id="' + key + '-list"></div></div>'; }
    function fillRep(key, items, ph) { var h = $("#" + key + "-list", host); h.innerHTML = ""; (items || []).forEach(function (t) { addRep(key, t, ph); }); }
    function addRep(key, val, ph) {
      var h = $("#" + key + "-list", host), row = el("div", "rep-item");
      var inp = el("input"); inp.value = val || ""; inp.placeholder = ph || "";
      var del = icoBtn(I.trash, function () { row.remove(); }, true);
      row.appendChild(inp); row.appendChild(del); h.appendChild(row);
    }
    function collectRep(key) { return $all("#" + key + "-list .rep-item input", host).map(function (i) { return i.value.trim(); }).filter(Boolean); }
    function icoBtn(svg, fn, danger) { var b = el("button", "ad-ico-btn" + (danger ? " ad-btn--danger" : ""), svg); b.type = "button"; b.onclick = fn; return b; }
  }

  /* ============================ DOCUMENTS ============================ */
  function pageDocuments() {
    setActiveNav("documents");
    var v = view();
    v.innerHTML = head("Travel Documents", "Manage the PDFs shown on the public Travel Documents page.",
      '<button class="ad-btn ad-btn--pri" id="doc-new">' + I.plus + 'New Document</button>') +
      '<div class="ad-toolbar"><div class="ad-search">' + I.search + '<input id="doc-search" placeholder="Search title, category…"></div>' +
      '<button class="ad-filter is-active" data-f="all">All</button><button class="ad-filter" data-f="published">Published</button><button class="ad-filter" data-f="draft">Draft</button><button class="ad-filter" data-f="unpublished">Unpublished</button></div>' +
      '<div class="ad-panel"><div id="doc-host"></div></div>';
    var host = $("#doc-host"), ALL = [], curF = "all", term = "";
    function draw() {
      var rows = ALL.filter(function (d) { if (term && ((d.title || "") + " " + (d.category || "")).toLowerCase().indexOf(term) < 0) return false; return curF === "all" ? true : d.status === curF; });
      if (!rows.length) { host.innerHTML = emptyBlock(ALL.length ? "No documents match." : "No documents yet.", '<a href="#" id="doc-empty-new">Add one</a>.'); var en = $("#doc-empty-new", host); if (en) en.onclick = function (e) { e.preventDefault(); openDoc(0); }; return; }
      host.innerHTML = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Document</th><th>Category</th><th>Size</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>' +
        rows.map(function (d) {
          return '<tr data-id="' + d.id + '"><td><div class="ad-table__title">' + esc(d.title) + '</div><div class="ad-table__sub">' + esc(d.file_name || "") + '</div></td>' +
            '<td>' + esc(d.category || "—") + '</td><td>' + fmtSize(d.file_size) + '</td>' +
            '<td><span class="pill pill--' + esc(d.status) + '">' + esc(d.status) + '</span></td><td>' + (d.sort || 0) + '</td>' +
            '<td><div class="ad-row-actions"><a class="ad-ico-btn" href="' + esc(docUrl(d.file_url)) + '" target="_blank" rel="noopener" title="View">' + I.eye + '</a>' +
            '<button class="ad-ico-btn" data-edit title="Edit">' + I.edit + '</button><button class="ad-ico-btn" data-del title="Delete">' + I.trash + '</button></div></td></tr>';
        }).join("") + '</tbody></table></div>';
      $all("tr[data-id]", host).forEach(function (tr) {
        var id = tr.getAttribute("data-id"), d = byId(ALL, id);
        tr.querySelector("[data-edit]").onclick = function () { openDoc(id); };
        tr.querySelector("[data-del]").onclick = function () { confirmDialog("Delete document?", 'Remove "' + d.title + '" from the website?').then(function (yes) { if (!yes) return; api("/api/admin/document?id=" + id, { method: "DELETE" }).then(function (j) { if (j.ok) { toast("Deleted", "ok"); reload(); } else toast(j.message || "Failed", "err"); }); }); };
      });
    }
    function reload() { withData(host, function () { return api("/api/admin/documents"); }, function (j) { ALL = j.documents || []; draw(); }); }
    function openDoc(id) {
      function form(d) {
        d = d || { title: "", description: "", category: "Pilgrimage Tours", file_url: "", file_name: "", file_size: 0, status: "published", sort: 0 };
        var stOpts = ["published", "draft", "unpublished"].map(function (s) { return '<option value="' + s + '"' + (d.status === s ? " selected" : "") + '>' + s + '</option>'; }).join("");
        var mm = modal('<h3 class="ad-modal__title">' + (id ? "Edit" : "New") + ' Document</h3><div class="ad-form">' +
          '<div class="ad-field"><label>Title *</label><input id="d-title" value="' + esc(d.title || "") + '"></div>' +
          '<div class="ad-field"><label>Description</label><textarea id="d-desc">' + esc(d.description || "") + '</textarea></div>' +
          '<div class="ad-grid3"><div class="ad-field"><label>Category</label><input id="d-cat" value="' + esc(d.category || "") + '"></div>' +
            '<div class="ad-field"><label>Status</label><select id="d-status">' + stOpts + '</select></div>' +
            '<div class="ad-field"><label>Sort</label><input id="d-sort" type="number" min="0" value="' + (d.sort || 0) + '"></div></div>' +
          '<div class="ad-field"><label>PDF file (upload ≤15 MB) or paste a URL below</label><input type="file" id="d-file" accept="application/pdf"><div class="ad-msg" id="d-up"></div></div>' +
          '<div class="ad-field"><label>File URL</label><input id="d-url" value="' + esc(d.file_url || "") + '" placeholder="assets/docs/… or https://…"></div>' +
          '<div class="ad-saverow"><button class="ad-btn ad-btn--ghost" id="d-cancel">Cancel</button><button class="ad-btn ad-btn--pri" id="d-save">Save Document</button><div class="ad-msg" id="d-msg"></div></div></div>', 560);
        var c = mm.content, fileName = d.file_name || "", fileSize = d.file_size || 0;
        $("#d-cancel", c).onclick = mm.close;
        $("#d-file", c).addEventListener("change", function () {
          var f = this.files[0]; if (!f) return; var up = $("#d-up", c);
          if (f.type !== "application/pdf") { up.textContent = "Please choose a PDF."; up.className = "ad-msg err show"; return; }
          if (f.size > 15 * 1048576) { up.textContent = "PDF must be ≤15 MB."; up.className = "ad-msg err show"; return; }
          var rd = new FileReader();
          rd.onload = function () {
            up.textContent = "Uploading…"; up.className = "ad-msg show";
            api("/api/admin/uploadpdf", { method: "POST", body: { filename: f.name, data: rd.result } }).then(function (j) {
              if (j.ok) { $("#d-url", c).value = j.url; fileName = f.name; fileSize = j.size || f.size; if (!$("#d-title", c).value) $("#d-title", c).value = f.name.replace(/\.pdf$/i, ""); up.textContent = "Uploaded ✓"; up.className = "ad-msg ok show"; }
              else { up.textContent = j.message || "Upload failed."; up.className = "ad-msg err show"; }
            });
          };
          rd.readAsDataURL(f);
        });
        $("#d-save", c).onclick = function () {
          var msg = $("#d-msg", c), btn = $("#d-save", c);
          var payload = { title: $("#d-title", c).value, description: $("#d-desc", c).value, category: $("#d-cat", c).value, status: $("#d-status", c).value, sort: $("#d-sort", c).value, file_url: $("#d-url", c).value, file_name: fileName, file_size: fileSize };
          if (!payload.title.trim()) { msg.textContent = "Title is required."; msg.className = "ad-msg err show"; return; }
          if (!payload.file_url.trim()) { msg.textContent = "Upload a PDF or paste a URL."; msg.className = "ad-msg err show"; return; }
          btn.classList.add("is-loading"); btn.disabled = true;
          var req = id ? api("/api/admin/document?id=" + id, { method: "PUT", body: payload }) : api("/api/admin/documents", { method: "POST", body: payload });
          req.then(function (j) { btn.classList.remove("is-loading"); btn.disabled = false; if (j.ok) { toast("Document saved ✓", "ok"); mm.close(); reload(); } else { msg.textContent = j.message || "Save failed."; msg.className = "ad-msg err show"; } });
        };
      }
      if (id) api("/api/admin/document?id=" + id).then(function (j) { if (j.ok) form(j.document); else toast(j.message || "Not found", "err"); });
      else form(null);
    }
    $("#doc-new").onclick = function () { openDoc(0); };
    $("#doc-search").addEventListener("input", debounce(function () { term = this.value.toLowerCase(); draw(); }, 180));
    $all(".ad-filter", v).forEach(function (b) { b.onclick = function () { $all(".ad-filter", v).forEach(function (x) { x.classList.remove("is-active"); }); b.classList.add("is-active"); curF = b.getAttribute("data-f"); draw(); }; });
    reload();
  }
  function docUrl(u) { return u && /^assets\//.test(u) ? "/" + u : (u || "#"); }

  /* ============================ INQUIRIES ============================ */
  function pageInquiries(params) {
    setActiveNav("inquiries");
    var v = view();
    v.innerHTML = head("Inquiries", "Customer enquiries from the website — bookings, corporate travel, MICE and visa. Private to admins.") +
      '<div class="ad-toolbar"><div class="ad-search">' + I.search + '<input id="inq-search" placeholder="Search name, email, package…"></div>' +
      '<button class="ad-filter" data-s="">All</button><button class="ad-filter" data-s="new">New</button><button class="ad-filter" data-s="contacted">Contacted</button><button class="ad-filter" data-s="in_progress">In progress</button><button class="ad-filter" data-s="confirmed">Confirmed</button><button class="ad-filter" data-s="closed">Closed</button></div>' +
      '<div class="ad-panel"><div id="inq-host"></div></div>';
    var host = $("#inq-host"), term = "", status = (params && params.s) || "";
    $all(".ad-filter", v).forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-s") === status); });
    function load() {
      withData(host, function () { return api("/api/admin/inquiries?q=" + encodeURIComponent(term) + (status ? "&status=" + encodeURIComponent(status) : "")); }, function (j) {
        var rows = j.inquiries || [];
        if (!rows.length) { host.innerHTML = emptyBlock("No inquiries found."); return; }
        host.innerHTML = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Customer</th><th>Interest</th><th>Travel date</th><th>Received</th><th>Status</th><th>Email</th><th></th></tr></thead><tbody>' +
          rows.map(function (q) {
            return '<tr data-id="' + q.id + '" style="cursor:pointer"><td><div class="ad-table__title">' + esc(q.name || "—") + '</div><div class="ad-table__sub">' + esc(q.email || "") + '</div></td>' +
              '<td>' + esc(q.package || "—") + '</td><td>' + esc(q.travel_date || "—") + '</td><td>' + fmtDate(q.created_at) + '</td>' +
              '<td><span class="pill pill--' + esc(q.status) + '">' + esc((q.status || "").replace("_", " ")) + '</span></td><td>' + emailPill(q.email_status) + '</td><td>' + I.eye + '</td></tr>';
          }).join("") + '</tbody></table></div>';
        $all("tr[data-id]", host).forEach(function (tr) { tr.onclick = function () { openInq(tr.getAttribute("data-id"), load); }; });
      });
    }
    $("#inq-search").addEventListener("input", debounce(function () { term = this.value; load(); }, 250));
    $all(".ad-filter", v).forEach(function (b) { b.onclick = function () { $all(".ad-filter", v).forEach(function (x) { x.classList.remove("is-active"); }); b.classList.add("is-active"); status = b.getAttribute("data-s"); load(); }; });
    load();
  }
  function emailPill(s) { var map = { sent: ["on", "sent"], failed: ["off", "failed"], pending: ["draft", "pending"] }, m = map[s] || map.pending; return '<span class="pill pill--' + m[0] + '" title="Email delivery">' + m[1] + '</span>'; }
  function openInq(id, reload) {
    api("/api/admin/inquiries?id=" + id).then(function (j) {
      if (!j.ok) { toast(j.message || "Could not load", "err"); return; }
      var q = j.inquiry, est = q.email_status || "pending";
      var opts = ["new", "contacted", "in_progress", "confirmed", "closed"].map(function (s) { return '<option value="' + s + '"' + (q.status === s ? " selected" : "") + '>' + s.replace("_", " ") + '</option>'; }).join("");
      function row(k, val, html) { return '<div class="ad-detail-row"><span>' + k + '</span><b>' + (html ? (val || "—") : esc(val || "—")) + '</b></div>'; }
      var mm = modal('<h3 class="ad-modal__title">Inquiry #' + q.id + '</h3>' +
        row("Name", q.name) + row("Email", q.email ? '<a href="mailto:' + esc(q.email) + '">' + esc(q.email) + '</a>' : "—", true) + row("Phone", q.phone ? '<a href="tel:' + esc(q.phone) + '">' + esc(q.phone) + '</a>' : "—", true) +
        row("Interest", q.package) + row("Travellers", q.travellers) + row("Travel date", q.travel_date) + row("Source", q.source) + row("Received", fmtDate(q.created_at)) +
        row("Email delivery", emailPill(est) + (est !== "sent" ? ' <button class="ad-btn ad-btn--ghost ad-btn--sm" id="inq-retry">Resend email</button>' : ""), true) +
        '<div style="margin:14px 0"><label class="ad-mini-label">Message</label><div class="ad-msg-box">' + esc(q.message || "—") + '</div></div>' +
        '<div class="ad-saverow"><div class="ad-field" style="flex:1"><label>Status</label><select id="inq-status">' + opts + '</select></div><button class="ad-btn ad-btn--pri" id="inq-save">Update status</button></div>' +
        '<div style="margin-top:14px;text-align:right"><button class="ad-btn ad-btn--danger ad-btn--sm" id="inq-del">Delete inquiry</button></div>', 560);
      var c = mm.content;
      $("#inq-save", c).onclick = function () { api("/api/admin/inquiries?id=" + id, { method: "PUT", body: { status: $("#inq-status", c).value } }).then(function (r) { if (r.ok) { toast("Status updated", "ok"); mm.close(); reload && reload(); } else toast(r.message || "Failed", "err"); }); };
      var rt = $("#inq-retry", c);
      if (rt) rt.onclick = function () { rt.disabled = true; rt.textContent = "Sending…"; api("/api/admin/inquiries?id=" + id, { method: "PUT", body: { op: "retry_email" } }).then(function (r) { if (r.ok) { toast("Email sent ✓", "ok"); mm.close(); reload && reload(); } else { toast(r.message || "Email failed", "err"); rt.disabled = false; rt.textContent = "Resend email"; } }); };
      $("#inq-del", c).onclick = function () { confirmDialog("Delete inquiry?", "Permanently delete inquiry #" + q.id + "? This cannot be undone.").then(function (yes) { if (!yes) return; api("/api/admin/inquiries?id=" + id, { method: "DELETE" }).then(function (r) { if (r.ok) { toast("Inquiry deleted", "ok"); mm.close(); reload && reload(); } else toast(r.message || "Failed", "err"); }); }); };
    });
  }

  /* ============================ TRAVEL DATA (flights + visa health) ============================ */
  function pageTravel() {
    setActiveNav("travel");
    var v = view();
    v.innerHTML = head("Travel Data", "Live flight status and visa information are served from external sources in real time — never stored or faked here.");
    var host = el("div"); v.appendChild(host);
    withData(host, function () { return api("/api/admin/dashboard"); }, function (j) {
      var a = j.apis || {};
      function panel(title, prov, ok, note, testHtml) {
        return '<div class="ad-panel"><div class="ad-panel__h">' + title + '</div><div class="ad-panel__b">' +
          '<div class="ad-detail-row"><span>Provider</span><b>' + esc(prov) + '</b></div>' +
          '<div class="ad-detail-row"><span>Status</span><b><span class="pill pill--' + (ok ? "on" : "off") + '">' + (ok ? "Configured" : "Not configured") + '</span></b></div>' +
          '<p class="ad-note">' + note + '</p>' + (testHtml || '') + '</div></div>';
      }
      host.innerHTML =
        panel("Live Flight Status", (a.flight && a.flight.provider) || "AeroDataBox / AviationStack", a.flight && a.flight.configured,
          "Customers track flights on the public Flights page. Without an API key it runs in clearly-labelled demo mode. Add <code>AERODATABOX_KEY</code> in Vercel for live data.",
          '<div class="ad-inline-test"><input id="fl-code" placeholder="Flight no. e.g. AI302"><button class="ad-btn ad-btn--ghost ad-btn--sm" id="fl-test">Test</button><span id="fl-out" class="ad-note"></span></div>') +
        panel("Visa Requirements", (a.visa && a.visa.provider) || "Vandana curated (official sources)", a.visa && a.visa.configured,
          "Visa info is curated from official government sources with a 'last checked' date and links to official portals — authoritative, not fabricated.",
          '<div class="ad-inline-test"><input id="vs-to" placeholder="Destination e.g. thailand"><button class="ad-btn ad-btn--ghost ad-btn--sm" id="vs-test">Test</button><span id="vs-out" class="ad-note"></span></div>');
      var api_base = /(^|\.)vercel\.app$/.test(location.hostname) ? "" : "https://vandana-travel-experts.vercel.app";
      $("#fl-test", host).onclick = function () { var code = $("#fl-code", host).value.trim(); if (!code) return; $("#fl-out", host).textContent = "Checking…"; fetch(api_base + "/api/flight?flight=" + encodeURIComponent(code)).then(function (r) { return r.json(); }).then(function (d) { $("#fl-out", host).textContent = d.ok ? (d.demo ? "Demo response OK" : "Live response OK") + " · " + (d.source || "") : (d.message || "No data"); }).catch(function () { $("#fl-out", host).textContent = "Request blocked/failed"; }); };
      $("#vs-test", host).onclick = function () { var to = $("#vs-to", host).value.trim(); if (!to) return; $("#vs-out", host).textContent = "Checking…"; fetch(api_base + "/api/visa?from=IN&to=" + encodeURIComponent(to)).then(function (r) { return r.json(); }).then(function (d) { $("#vs-out", host).textContent = d.ok ? (d.country || to) + ": " + (d.statusLabel || d.status || "found") : (d.message || "Not covered"); }).catch(function () { $("#vs-out", host).textContent = "Request blocked/failed"; }); };
    });
  }

  /* ============================ SETTINGS ============================ */
  function pageSettings(params) {
    setActiveNav("settings");
    var v = view();
    v.innerHTML = head("Settings", "Your account, integration status and the admin activity log.");
    var host = el("div"); v.appendChild(host);
    var first = params && params.first;
    var permsHtml = isSuper() ? '<span class="pill pill--super">All permissions</span>'
      : ((ME && ME.permissions && ME.permissions.length) ? ME.permissions.map(function (p) { return '<span class="pill pill--draft" style="margin:2px 4px 2px 0">' + esc(p) + '</span>'; }).join("") : '<span style="color:var(--a-500)">No permissions assigned yet.</span>');
    host.innerHTML =
      (first || (ME && ME.mustChange) ? '<div class="ad-banner ad-banner--warn">Please set a new password to secure your account before continuing.</div>' : '') +
      '<div class="ad-panel"><div class="ad-panel__h">Your profile</div><div class="ad-panel__b">' +
        '<div class="ad-detail-row"><span>Email</span><b>' + esc(ME ? ME.email : "") + '</b></div>' +
        '<div class="ad-detail-row"><span>Role</span><b>' + (isSuper() ? rolePill("super_admin") : rolePill("admin")) + '</b></div>' +
        '<div class="ad-detail-row"><span>Permissions</span><b>' + permsHtml + '</b></div>' +
        '<div class="ad-form" style="max-width:460px;margin-top:12px"><div class="ad-field"><label>Display name</label><input id="p-name" value="' + esc(ME ? (ME.name || "") : "") + '"></div><div><button class="ad-btn ad-btn--ghost" id="p-save">Save name</button></div><div class="ad-msg" id="p-msg"></div></div>' +
      '</div></div>' +
      '<div class="ad-panel"><div class="ad-panel__h">Change password</div><div class="ad-panel__b">' +
        '<div class="ad-form" style="max-width:460px">' +
          '<div class="ad-field"><label>Current password</label><input type="password" id="s-cur"></div>' +
          '<div class="ad-field"><label>New password</label><input type="password" id="s-new"><div class="hint">At least 8 characters, with a letter and a number.</div></div>' +
          '<div class="ad-field"><label>Confirm new password</label><input type="password" id="s-conf"></div>' +
          '<div><button class="ad-btn ad-btn--pri" id="s-save">Change Password</button></div><div class="ad-msg" id="s-msg"></div>' +
        '</div></div></div>' +
      '<div class="ad-panel"><div class="ad-panel__h">System &amp; integrations</div><div class="ad-panel__b" id="sys-status">' + loadingBlock() + '</div></div>';
    $("#p-save", host).onclick = function () {
      var btn = $("#p-save", host), msg = $("#p-msg", host); btn.classList.add("is-loading"); btn.disabled = true;
      api("/api/admin/profile", { method: "PUT", body: { name: $("#p-name", host).value } }).then(function (j) {
        btn.classList.remove("is-loading"); btn.disabled = false;
        if (j.ok) { if (ME) ME.name = $("#p-name", host).value; msg.textContent = "Saved ✓"; msg.className = "ad-msg ok show"; toast("Profile updated", "ok"); }
        else { msg.textContent = j.message || "Failed."; msg.className = "ad-msg err show"; }
      });
    };
    $("#s-save", host).onclick = function () {
      var msg = $("#s-msg", host), cur = $("#s-cur", host).value, nw = $("#s-new", host).value, cf = $("#s-conf", host).value, btn = $("#s-save", host);
      if (nw !== cf) { msg.textContent = "New passwords do not match."; msg.className = "ad-msg err show"; return; }
      btn.classList.add("is-loading"); btn.disabled = true;
      api("/api/admin/password", { method: "POST", body: { current: cur, next: nw } }).then(function (j) {
        btn.classList.remove("is-loading"); btn.disabled = false;
        if (j.ok) { msg.textContent = "Password changed ✓"; msg.className = "ad-msg ok show"; $("#s-cur", host).value = $("#s-new", host).value = $("#s-conf", host).value = ""; if (ME) ME.mustChange = false; toast("Password updated", "ok"); }
        else { msg.textContent = j.message || "Failed."; msg.className = "ad-msg err show"; }
      });
    };
    api("/api/admin/dashboard").then(function (j) {
      var s = $("#sys-status", host); if (!s) return;
      if (!j.ok) { s.innerHTML = errorBlock(j.message); var rb = s.querySelector("[data-retry]"); if (rb) rb.onclick = function () { pageSettings(params); }; return; }
      var a = j.apis || {};
      function r(k, prov, ok) { return '<div class="ad-detail-row"><span>' + k + '</span><b>' + esc(prov) + ' &nbsp;<span class="pill pill--' + (ok ? "on" : "off") + '">' + (ok ? "Configured" : "Not set") + '</span></b></div>'; }
      s.innerHTML = r("Flight API", (a.flight && a.flight.provider) || "—", a.flight && a.flight.configured) + r("Visa data", (a.visa && a.visa.provider) || "—", a.visa && a.visa.configured) + r("Email", (a.email && a.email.provider) || "—", a.email && a.email.configured) + '<div class="ad-detail-row"><span>API keys</span><b style="color:var(--a-500)">Managed in Vercel environment variables — never shown here.</b></div>' + (isSuper() ? '<div class="ad-detail-row"><span>Audit log</span><b><a href="#/audit">View admin activity →</a></b></div>' : '');
    });
  }

  /* ============================ ADMINISTRATORS (super only) ============================ */
  var PERM_GROUPS = [
    { label: "Packages", perms: ["packages.view", "packages.create", "packages.edit", "packages.delete", "packages.publish"] },
    { label: "Inquiries", perms: ["inquiries.view", "inquiries.edit", "inquiries.delete"] },
    { label: "Documents", perms: ["documents.view", "documents.create", "documents.edit", "documents.delete"] },
    { label: "Media & other", perms: ["media.upload", "integrations.view", "settings.view"] }
  ];
  function rolePill(r) { return r === "super_admin" ? '<span class="pill pill--super">Super Admin</span>' : '<span class="pill pill--intl">Admin</span>'; }
  function statusPill(s) { var map = { active: "on", disabled: "off", invited: "draft", archived: "off" }; return '<span class="pill pill--' + (map[s] || "draft") + '">' + esc(s) + '</span>'; }
  function pageAdmins() {
    setActiveNav("admins");
    var v = view();
    v.innerHTML = head("Administrators", "Create and manage who can access this panel and what they can do.",
      '<a class="ad-btn ad-btn--pri" href="#/admins/new">' + I.plus + 'Add Administrator</a>');
    var strip = el("div"); v.appendChild(strip);
    var host = el("div", "ad-panel"); v.appendChild(host);
    withData(host, function () { return api("/api/admin/users"); }, function (j) {
      var rows = j.admins || [];
      var st = { total: rows.length, active: 0, disabled: 0, invited: 0, supers: 0, admins: 0 };
      rows.forEach(function (a) { if (a.status === "active") st.active++; if (a.status === "disabled") st.disabled++; if (a.status === "invited") st.invited++; if (a.role === "super_admin") st.supers++; else st.admins++; });
      strip.innerHTML = '<div class="ad-cards">' +
        '<div class="ad-stat"><b>' + st.total + '</b><span>Administrators</span></div>' +
        '<div class="ad-stat"><b>' + st.active + '</b><span>Active</span></div>' +
        '<div class="ad-stat"><b>' + st.disabled + '</b><span>Disabled</span><small>' + st.invited + ' invited</small></div>' +
        '<div class="ad-stat"><b>' + st.supers + '</b><span>Super Admins</span><small>' + st.admins + ' admins</small></div></div>';
      host.innerHTML = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Administrator</th><th>Role</th><th>Status</th><th>Last login</th><th>Created</th><th>Actions</th></tr></thead><tbody>' +
        rows.map(function (a) {
          var isMe = ME && a.id === ME.id;
          return '<tr data-id="' + a.id + '"><td><div class="ad-table__title">' + esc(a.name || "—") + (isMe ? ' <span class="ad-you">you</span>' : '') + '</div><div class="ad-table__sub">' + esc(a.email) + '</div></td>' +
            '<td>' + rolePill(a.role) + '</td><td>' + statusPill(a.status) + '</td><td>' + (a.last_login ? fmtDate(a.last_login) : "—") + '</td><td>' + fmtDate(a.created_at) + '</td>' +
            '<td><div class="ad-row-actions">' +
              '<a class="ad-ico-btn" href="#/admins/edit/' + a.id + '" title="Edit">' + I.edit + '</a>' +
              (a.status === "active" ? '<button class="ad-ico-btn" data-disable title="Disable">' + I.x + '</button>' : '<button class="ad-ico-btn" data-enable title="Enable">' + I.refresh + '</button>') +
              '<button class="ad-ico-btn" data-reset title="Reset access (new invite)">' + I.shield + '</button>' +
              '<button class="ad-ico-btn" data-del title="Archive">' + I.trash + '</button>' +
            '</div></td></tr>';
        }).join("") + '</tbody></table></div>';
      $all("tr[data-id]", host).forEach(function (tr) {
        var id = tr.getAttribute("data-id"), a = byId(rows, id);
        function act(op, okMsg) { return function () { api("/api/admin/user?id=" + id, { method: "PUT", body: { op: op } }).then(function (r) { if (r.ok) { toast(okMsg, "ok"); if (r.inviteUrl) showInvite(a.email, r.inviteUrl); pageAdmins(); } else toast(r.message || "Failed", "err"); }); }; }
        var db = tr.querySelector("[data-disable]"); if (db) db.onclick = function () { confirmDialog("Disable administrator?", 'Disable "' + (a.name || a.email) + '"? They will be logged out and cannot sign in until re-enabled.', "Disable").then(function (y) { if (y) act("disable", "Administrator disabled")(); }); };
        var eb = tr.querySelector("[data-enable]"); if (eb) eb.onclick = act("enable", "Administrator enabled");
        tr.querySelector("[data-reset]").onclick = function () { confirmDialog("Reset access?", 'Generate a new setup link for "' + a.email + '"? Their current password stops working until they set a new one.', "Reset").then(function (y) { if (y) act("reset", "New invite link generated")(); }); };
        tr.querySelector("[data-del]").onclick = function () { confirmDialog("Archive administrator?", 'Archive "' + (a.name || a.email) + '"? They lose access immediately. Their created content and audit history are kept.', "Archive").then(function (y) { if (!y) return; api("/api/admin/user?id=" + id, { method: "DELETE" }).then(function (r) { if (r.ok) { toast("Administrator archived", "ok"); pageAdmins(); } else toast(r.message || "Failed", "err"); }); }); };
      });
    });
  }
  function showInvite(email, url) {
    var mm = modal('<h3 class="ad-modal__title">Invitation link</h3>' +
      '<p style="color:var(--a-500);margin-bottom:12px">Email delivery isn\'t configured, so copy this one-time setup link and send it to <b>' + esc(email) + '</b>. They open it to set their own password. The link expires in 7 days.</p>' +
      '<div class="ad-field"><textarea id="inv-url" readonly style="min-height:70px">' + esc(url) + '</textarea></div>' +
      '<div class="ad-saverow"><button class="ad-btn ad-btn--pri" id="inv-copy">Copy link</button></div>', 560);
    $("#inv-copy", mm.content).onclick = function () { var t = $("#inv-url", mm.content); t.select(); try { document.execCommand("copy"); toast("Copied", "ok"); } catch (e) { navigator.clipboard && navigator.clipboard.writeText(url); toast("Copied", "ok"); } };
  }
  function pageAdminEditor(id) {
    setActiveNav("admins");
    var editing = !!id, v = view();
    v.innerHTML = head((editing ? "Edit" : "New") + " Administrator", null, '<a class="ad-btn ad-btn--ghost" href="#/admins">← Back</a>');
    var host = el("div"); v.appendChild(host);
    var loader = editing ? function () { return api("/api/admin/user?id=" + id); } : function () { return api("/api/admin/users"); };
    withData(host, loader, function (j) {
      var a = editing ? j.admin : { name: "", email: "", role: "admin", status: "new", permissions: [] };
      var assignable = j.assignablePerms || [];
      function permBoxes() {
        return PERM_GROUPS.map(function (g) {
          var boxes = g.perms.filter(function (p) { return assignable.indexOf(p) >= 0; }).map(function (p) {
            var checked = (a.permissions || []).indexOf(p) >= 0 ? " checked" : "";
            return '<label class="ad-perm"><input type="checkbox" class="perm-cb" value="' + p + '"' + checked + '> ' + esc(p) + '</label>';
          }).join("");
          return boxes ? '<div class="ad-perm-group"><div class="ad-perm-group__t">' + g.label + '</div>' + boxes + '</div>' : "";
        }).join("");
      }
      host.innerHTML =
        '<div class="ad-panel"><div class="ad-panel__h">Account</div><div class="ad-panel__b"><div class="ad-form">' +
          '<div class="ad-grid2"><div class="ad-field"><label>Full name</label><input id="a-name" value="' + esc(a.name || "") + '"></div>' +
          '<div class="ad-field"><label>Email ' + (editing ? "(cannot change)" : "*") + '</label><input id="a-email" type="email" value="' + esc(a.email || "") + '"' + (editing ? " readonly" : "") + '></div></div>' +
          '<div class="ad-field" style="max-width:320px"><label>Role</label><select id="a-role"><option value="admin"' + (a.role === "admin" ? " selected" : "") + '>Admin (assigned permissions)</option><option value="super_admin"' + (a.role === "super_admin" ? " selected" : "") + '>Super Admin (full control)</option></select></div>' +
        '</div></div></div>' +
        '<div class="ad-panel" id="perm-panel"><div class="ad-panel__h">Permissions</div><div class="ad-panel__b"><p class="ad-note" id="perm-note"></p><div class="ad-perms" id="perm-list">' + permBoxes() + '</div></div></div>' +
        '<div class="ad-saverow"><a class="ad-btn ad-btn--ghost" href="#/admins">Cancel</a><button class="ad-btn ad-btn--pri" id="a-save">' + (editing ? "Save changes" : "Create & get invite link") + '</button><div class="ad-msg" id="a-msg"></div></div>';
      function refreshPermUI() {
        var sup = $("#a-role", host).value === "super_admin";
        $("#perm-list", host).style.opacity = sup ? ".45" : "1";
        $("#perm-list", host).style.pointerEvents = sup ? "none" : "auto";
        $("#perm-note", host).textContent = sup ? "Super Admins have every permission automatically." : "Tick the areas this administrator can manage. The backend enforces these on every request.";
      }
      $("#a-role", host).onchange = refreshPermUI; refreshPermUI();
      $("#a-save", host).onclick = function () {
        var msg = $("#a-msg", host), btn = $("#a-save", host);
        var role = $("#a-role", host).value;
        var perms = role === "super_admin" ? [] : $all(".perm-cb", host).filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
        var payload = { name: $("#a-name", host).value, role: role, permissions: perms };
        if (!editing) { payload.email = $("#a-email", host).value; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) { msg.textContent = "Enter a valid email."; msg.className = "ad-msg err show"; return; } }
        btn.classList.add("is-loading"); btn.disabled = true; msg.textContent = "";
        var req = editing ? api("/api/admin/user?id=" + id, { method: "PUT", body: payload }) : api("/api/admin/users", { method: "POST", body: payload });
        req.then(function (r) {
          btn.classList.remove("is-loading"); btn.disabled = false;
          if (r.ok) { toast(editing ? "Administrator updated" : "Administrator created", "ok"); location.hash = "#/admins"; if (r.inviteUrl) setTimeout(function () { showInvite(payload.email, r.inviteUrl); }, 300); }
          else { msg.textContent = r.message || (r.errors && r.errors.join(" ")) || "Save failed."; msg.className = "ad-msg err show"; }
        });
      };
    });
  }

  /* ============================ AUDIT LOGS (super only) ============================ */
  function pageAudit(params) {
    setActiveNav("audit");
    var v = view();
    v.innerHTML = head("Audit Logs", "A record of important administrator actions. Newest first.") +
      '<div class="ad-toolbar"><div class="ad-search">' + I.search + '<input id="au-search" placeholder="Search action, admin, detail…"></div>' +
      '<select id="au-admin" class="ad-select"><option value="">All admins</option></select>' +
      '<select id="au-action" class="ad-select"><option value="">All actions</option></select></div>' +
      '<div class="ad-panel"><div id="au-host"></div></div>';
    var host = $("#au-host"), term = "", who = "", act = "";
    function load() {
      withData(host, function () { return api("/api/admin/audit?q=" + encodeURIComponent(term) + "&admin=" + encodeURIComponent(who) + "&action=" + encodeURIComponent(act)); }, function (j) {
        var sa = $("#au-admin"), sc = $("#au-action");
        if (sa && sa.options.length <= 1 && j.admins) j.admins.forEach(function (a) { var o = document.createElement("option"); o.value = a; o.textContent = a; sa.appendChild(o); });
        if (sc && sc.options.length <= 1 && j.actions) j.actions.forEach(function (a) { var o = document.createElement("option"); o.value = a; o.textContent = a; sc.appendChild(o); });
        var rows = j.log || [];
        if (!rows.length) { host.innerHTML = emptyBlock("No matching activity."); return; }
        host.innerHTML = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>When</th><th>Administrator</th><th>Action</th><th>Detail</th></tr></thead><tbody>' +
          rows.map(function (a) { return '<tr><td style="white-space:nowrap">' + fmtDate(a.created_at) + '</td><td>' + esc(a.admin_email || "—") + '</td><td><span class="pill pill--draft">' + esc(a.action) + '</span></td><td>' + esc(a.detail || "") + '</td></tr>'; }).join("") + '</tbody></table></div>';
      });
    }
    $("#au-search").addEventListener("input", debounce(function () { term = this.value; load(); }, 250));
    $("#au-admin").onchange = function () { who = this.value; load(); };
    $("#au-action").onchange = function () { act = this.value; load(); };
    load();
  }

  /* ============================ ROUTER ============================ */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ""); // e.g. "packages/edit/12?f=x"
    var qIdx = h.indexOf("?"), qs = "";
    if (qIdx > -1) { qs = h.slice(qIdx + 1); h = h.slice(0, qIdx); }
    var parts = h.split("/").filter(Boolean);
    var params = {};
    qs.split("&").forEach(function (kv) { if (!kv) return; var p = kv.split("="); params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
    return { parts: parts, params: params };
  }
  // sections that require a specific permission (super_admin bypasses); or super-only.
  var SECTION_PERM = { packages: "packages.view", documents: "documents.view", inquiries: "inquiries.view" };
  var SUPER_SECTIONS = { admins: 1, audit: 1 };
  function denied() {
    setActiveNav("");
    view().innerHTML = head("Access denied") + '<div class="ad-panel"><div class="ad-panel__b"><div class="ad-empty">You don\'t have permission to view this section. <a href="#/dashboard">Back to dashboard</a>.</div></div></div>';
  }
  function route() {
    if (!SHELL_BUILT) return;
    window.scrollTo(0, 0);
    var r = parseHash(), p = r.parts;
    var section = p[0] || "dashboard";
    // authorization gate (UX; the backend enforces the real check)
    if (SUPER_SECTIONS[section] && !isSuper()) return denied();
    if (SECTION_PERM[section] && !canPerm(SECTION_PERM[section])) return denied();
    try {
      if (section === "dashboard" || section === "") return pageDashboard();
      if (section === "packages") {
        if (p[1] === "new") { if (!canPerm("packages.create")) return denied(); return pagePackageEditor(null); }
        if (p[1] === "edit" && p[2]) { if (!canPerm("packages.edit")) return denied(); return pagePackageEditor(p[2]); }
        return pagePackages(r.params);
      }
      if (section === "documents") return pageDocuments();
      if (section === "inquiries") return pageInquiries(r.params);
      if (section === "travel") return pageTravel();
      if (section === "admins") { if (p[1] === "new") return pageAdminEditor(null); if (p[1] === "edit" && p[2]) return pageAdminEditor(p[2]); return pageAdmins(); }
      if (section === "audit") return pageAudit(r.params);
      if (section === "settings") return pageSettings(r.params);
      // unknown -> dashboard
      location.hash = "#/dashboard";
    } catch (e) {
      view().innerHTML = errorBlock("Something went wrong rendering this screen. " + (e && e.message ? "(" + e.message + ")" : ""));
      var rb = view().querySelector("[data-retry]"); if (rb) rb.onclick = function () { route(); };
    }
  }

  /* ============================ BOOT ============================ */
  function fatal(msg, retryFn) {
    document.body.className = "ad-fatal-body";
    document.body.innerHTML = '<div class="ad-fatal"><img src="/assets/img/logo.png" alt=""><h2>Admin Panel</h2><p>' + esc(msg) + '</p><button class="ad-btn ad-btn--pri" id="fatal-retry">' + I.refresh + ' Retry</button></div>';
    $("#fatal-retry").onclick = retryFn;
  }
  function boot() {
    // Surface any unexpected error visibly instead of failing silently.
    window.addEventListener("unhandledrejection", function (ev) { try { toast("Error: " + ((ev.reason && ev.reason.message) || ev.reason || "see console"), "err"); } catch (e) {} });
    window.addEventListener("error", function (ev) { try { toast("Error: " + (ev.message || "see console"), "err"); } catch (e) {} });
    api("/api/admin/me").then(function (j) {
      if (j.__net) { fatal("Couldn't reach the server. Check your connection — if you use Brave Shields or an ad-blocker, allow this site — then retry.", boot); return; }
      if (!j.ok) { location.replace("login.html"); return; }
      ME = j;
      buildShell();
      if (j.mustChange && !/settings/.test(location.hash)) { location.hash = "#/settings?first=1"; }
      else if (!location.hash) { location.hash = "#/dashboard"; }
      route();
      window.addEventListener("hashchange", route);
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
