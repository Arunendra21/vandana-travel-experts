/* Vandana Travel Experts — Admin panel frontend.
   Frontend guards are for UX only; every operation is enforced server-side.
   Served same-origin on Vercel so the HttpOnly session cookie is sent. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function qs(n) { var m = new RegExp("[?&]" + n + "=([^&]*)").exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; }

  var I = {
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.78 1 1.42 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/></svg>',
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
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>'
  };

  /* ---------- toast ---------- */
  var toastWrap;
  function toast(msg, type) {
    if (!toastWrap) { toastWrap = document.createElement("div"); toastWrap.className = "ad-toast-wrap"; document.body.appendChild(toastWrap); }
    var t = document.createElement("div"); t.className = "ad-toast" + (type ? " ad-toast--" + type : ""); t.textContent = msg;
    toastWrap.appendChild(t); setTimeout(function () { t.style.opacity = "0"; t.style.transition = ".4s"; setTimeout(function () { t.remove(); }, 400); }, 2800);
  }

  /* ---------- API ---------- */
  function api(path, opts) {
    opts = opts || {};
    var o = { method: opts.method || "GET", headers: { "Accept": "application/json" }, credentials: "same-origin" };
    if (opts.body !== undefined) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(opts.body); }
    return fetch(path, o).then(function (r) { return r.json().then(function (j) { j.__status = r.status; return j; }).catch(function () { return { ok: false, __status: r.status, error: "bad_response" }; }); });
  }

  /* ---------- confirm dialog ---------- */
  function confirmDialog(title, text) {
    return new Promise(function (resolve) {
      var m = document.createElement("div"); m.className = "ad-modal open";
      m.innerHTML = '<div class="ad-modal__bd"></div><div class="ad-modal__dlg"><h3 style="font-size:1.2rem;color:var(--a-navy);margin-bottom:8px">' + esc(title) + '</h3><p style="color:var(--a-500);margin-bottom:20px">' + esc(text) + '</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="ad-btn ad-btn--ghost" data-no>Cancel</button><button class="ad-btn ad-btn--danger" data-yes>Delete</button></div></div>';
      document.body.appendChild(m);
      function done(v) { m.remove(); resolve(v); }
      m.querySelector("[data-no]").onclick = function () { done(false); };
      m.querySelector(".ad-modal__bd").onclick = function () { done(false); };
      m.querySelector("[data-yes]").onclick = function () { done(true); };
    });
  }

  /* ---------- shell ---------- */
  var ME = null;
  function shell(active) {
    document.body.classList.add("ad-body");
    var nav = [["index.html", "dashboard", I.dash, "Dashboard"], ["packages.html", "packages", I.box, "Packages"], ["inquiries.html", "inquiries", I.mail, "Inquiries"], ["settings.html", "settings", I.gear, "Settings"]];
    document.body.innerHTML =
      '<div class="ad-shell"><aside class="ad-side"><div class="ad-side__brand"><img src="../assets/img/logo.png" alt=""><div><b>Vandana</b><span>Admin Panel</span></div></div>' +
        '<nav class="ad-nav">' + nav.map(function (n) { return '<a href="' + n[0] + '" class="' + (n[1] === active ? "is-active" : "") + '">' + n[2] + n[3] + "</a>"; }).join("") + "</nav>" +
        '<div class="ad-side__foot"><div class="ad-side__user">' + esc(ME ? ME.email : "") + '</div><button class="ad-logout" id="ad-logout">' + I.out + "Log out</button></div>" +
      '</aside><main class="ad-main"><button class="ad-burger" id="ad-burger">' + I.menu + '</button><div id="ad-view"></div></main></div>';
    $("#ad-logout").onclick = function () { api("/api/admin/logout", { method: "POST" }).then(function () { location.href = "login.html"; }); };
    var burger = $("#ad-burger"); if (burger) burger.onclick = function () { document.body.classList.toggle("ad-open"); };
    return $("#ad-view");
  }

  function guard() {
    return api("/api/admin/me").then(function (j) {
      if (!j.ok) { location.href = "login.html"; return null; }
      ME = j;
      if (j.mustChange && !/settings\.html/.test(location.pathname)) { location.href = "settings.html?first=1"; return null; }
      return j;
    }).catch(function () { location.href = "login.html"; return null; });
  }

  /* ================= LOGIN ================= */
  function pageLogin() {
    // if already logged in, go to dashboard
    api("/api/admin/me").then(function (j) { if (j.ok) location.href = "index.html"; });
    var f = $("#login-form"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $(".ad-msg", f), btn = f.querySelector('button[type=submit]');
      btn.classList.add("is-loading"); btn.disabled = true;
      api("/api/admin/login", { method: "POST", body: { email: $("#login-email").value, password: $("#login-pass").value } }).then(function (j) {
        if (j.ok) { location.href = j.mustChange ? "settings.html?first=1" : "index.html"; return; }
        msg.textContent = j.message || "Login failed."; msg.className = "ad-msg err show";
        btn.classList.remove("is-loading"); btn.disabled = false;
      }).catch(function () { msg.textContent = "Network error. Please try again."; msg.className = "ad-msg err show"; btn.classList.remove("is-loading"); btn.disabled = false; });
    });
  }

  /* ================= DASHBOARD ================= */
  function pageDashboard() {
    guard().then(function (me) { if (!me) return; var v = shell("dashboard");
      v.innerHTML = '<div class="ad-head"><div><h1>Dashboard</h1><p>Overview of your website content and enquiries.</p></div><a class="ad-btn ad-btn--pri" href="package.html">' + I.plus + 'New Package</a></div><div id="dash-cards"><div class="ad-loading"><span class="ad-spin"></span> Loading…</div></div>';
      api("/api/admin/dashboard").then(function (j) {
        if (!j.ok) { $("#dash-cards").innerHTML = '<div class="ad-empty">Could not load stats.</div>'; return; }
        var p = j.packages, q = j.inquiries;
        function card(n, l, s) { return '<div class="ad-stat"><b>' + (n == null ? "—" : n) + "</b><span>" + l + "</span>" + (s ? "<br><small>" + s + "</small>" : "") + "</div>"; }
        $("#dash-cards").innerHTML =
          '<div class="ad-cards">' + card(p.total, "Total packages", p.published + " published · " + p.draft + " draft") + card(p.national, "National") + card(p.international, "International") + card(p.featured, "Featured") + "</div>" +
          '<div class="ad-cards">' + card(q.total, "Total inquiries") + card(q.new, "New") + card(q.pending, "In progress") + card(q.processed, "Processed") + "</div>" +
          '<div class="ad-panel"><div class="ad-panel__h">System status</div><div class="ad-panel__b">' +
            statusRow("Flight API", j.apis.flight.provider, j.apis.flight.configured) +
            statusRow("Visa data", j.apis.visa.provider, j.apis.visa.configured) +
            statusRow("Email", j.apis.email.provider, j.apis.email.configured) +
          "</div></div>";
      });
    });
  }
  function statusRow(k, prov, ok) { return '<div class="ad-detail-row"><span>' + k + '</span><b>' + esc(prov) + ' &nbsp;<span class="pill pill--' + (ok ? "on" : "off") + '">' + (ok ? "Configured" : "Not configured") + "</span></b></div>"; }

  /* ================= PACKAGES LIST ================= */
  var ALLPKGS = [];
  function pagePackages() {
    guard().then(function (me) { if (!me) return; var v = shell("packages");
      v.innerHTML = '<div class="ad-head"><div><h1>Packages</h1><p>Create, edit, reorder, publish and feature your tour packages.</p></div><a class="ad-btn ad-btn--pri" href="package.html">' + I.plus + 'New Package</a></div>' +
        '<div class="ad-toolbar"><div class="ad-search">' + I.search + '<input id="pk-search" placeholder="Search name, country…"></div>' +
        '<button class="ad-filter is-active" data-f="all">All</button><button class="ad-filter" data-f="National">National</button><button class="ad-filter" data-f="International">International</button>' +
        '<button class="ad-filter" data-f="published">Published</button><button class="ad-filter" data-f="draft">Draft</button><button class="ad-filter" data-f="featured">Featured</button></div>' +
        '<div class="ad-panel"><div class="ad-table-wrap"><table class="ad-table"><thead><tr><th></th><th>Package</th><th>Category</th><th>Duration</th><th>Status</th><th>Featured</th><th>Order</th><th>Actions</th></tr></thead><tbody id="pk-body"><tr><td colspan="8"><div class="ad-loading"><span class="ad-spin"></span> Loading…</div></td></tr></tbody></table></div></div>';
      var curF = "all", term = "";
      $("#pk-search").addEventListener("input", function () { term = this.value.toLowerCase(); draw(); });
      v.querySelectorAll(".ad-filter").forEach(function (b) { b.onclick = function () { v.querySelectorAll(".ad-filter").forEach(function (x) { x.classList.remove("is-active"); }); b.classList.add("is-active"); curF = b.getAttribute("data-f"); draw(); }; });
      function load() { return api("/api/admin/packages").then(function (j) { ALLPKGS = j.ok ? j.packages : []; draw(); }); }
      function match(p) {
        if (term && (p.title + " " + (p.country || "") + " " + (p.region || "")).toLowerCase().indexOf(term) < 0) return false;
        if (curF === "all") return true;
        if (curF === "National" || curF === "International") return p.category === curF;
        if (curF === "featured") return p.featured;
        return p.status === curF;
      }
      function draw() {
        var rows = ALLPKGS.filter(match);
        var body = $("#pk-body");
        if (!rows.length) { body.innerHTML = '<tr><td colspan="8"><div class="ad-empty">No packages found. <a href="package.html">Create one</a>.</div></td></tr>'; return; }
        body.innerHTML = rows.map(function (p, i) {
          return '<tr data-id="' + p.id + '">' +
            '<td><img class="ad-table__thumb" src="' + esc(rel(p.image)) + '" alt="" onerror="this.style.visibility=\'hidden\'"></td>' +
            '<td><div class="ad-table__title">' + esc(p.title) + '</div><div style="font-size:.78rem;color:var(--a-500)">' + esc(p.country || "") + (p.region ? " · " + esc(p.region) : "") + '</div></td>' +
            '<td><span class="pill pill--' + (p.category === "National" ? "nat" : "intl") + '">' + esc(p.category) + "</span></td>" +
            "<td>" + p.nights + "N · " + p.days + "D</td>" +
            '<td><span class="pill pill--' + esc(p.status) + '">' + esc(p.status) + "</span></td>" +
            '<td><button class="ad-ico-btn" data-feat title="Toggle featured"><span class="' + (p.featured ? "star" : "star--off") + '">' + I.star + "</span></button></td>" +
            '<td><button class="ad-ico-btn" data-up title="Move up">' + I.up + '</button><button class="ad-ico-btn" data-down title="Move down">' + I.down + "</button></td>" +
            '<td><div class="ad-row-actions"><a class="ad-ico-btn" href="package.html?id=' + p.id + '" title="Edit">' + I.edit + '</a><button class="ad-ico-btn" data-dup title="Duplicate">' + I.copy + '</button><button class="ad-ico-btn" data-del title="Delete">' + I.trash + "</button></div></td></tr>";
        }).join("");
        body.querySelectorAll("tr").forEach(function (tr) {
          var id = tr.getAttribute("data-id");
          tr.querySelector("[data-feat]").onclick = function () { var p = find(id); api("/api/admin/actions", { method: "POST", body: { op: "featured", id: id, featured: !p.featured } }).then(function (j) { if (j.ok) { p.featured = !p.featured; draw(); toast("Updated", "ok"); } else toast(j.message || "Failed", "err"); }); };
          tr.querySelector("[data-dup]").onclick = function () { api("/api/admin/actions", { method: "POST", body: { op: "duplicate", id: id } }).then(function (j) { if (j.ok) { toast("Duplicated", "ok"); load(); } else toast("Failed", "err"); }); };
          tr.querySelector("[data-del]").onclick = function () { var p = find(id); confirmDialog("Delete package?", 'Delete "' + p.title + '"? It will be archived (removed from the website).').then(function (yes) { if (!yes) return; api("/api/admin/package?id=" + id, { method: "DELETE" }).then(function (j) { if (j.ok) { toast("Deleted", "ok"); load(); } else toast("Failed", "err"); }); }); };
          tr.querySelector("[data-up]").onclick = function () { move(id, -1); };
          tr.querySelector("[data-down]").onclick = function () { move(id, 1); };
        });
      }
      function find(id) { for (var i = 0; i < ALLPKGS.length; i++) if (String(ALLPKGS[i].id) === String(id)) return ALLPKGS[i]; }
      function move(id, dir) {
        ALLPKGS.sort(function (a, b) { return a.sort - b.sort || a.id - b.id; });
        var idx = ALLPKGS.findIndex(function (p) { return String(p.id) === String(id); });
        var j = idx + dir; if (idx < 0 || j < 0 || j >= ALLPKGS.length) return;
        var tmp = ALLPKGS[idx]; ALLPKGS[idx] = ALLPKGS[j]; ALLPKGS[j] = tmp;
        var ids = ALLPKGS.map(function (p) { return p.id; });
        ALLPKGS.forEach(function (p, i) { p.sort = i; });
        draw();
        api("/api/admin/actions", { method: "POST", body: { op: "reorder", ids: ids } }).then(function (r) { if (!r.ok) toast("Reorder failed", "err"); });
      }
      load();
    });
  }
  function rel(u) { return u && /^assets\//.test(u) ? "../" + u : (u || ""); }

  /* ================= PACKAGE EDITOR ================= */
  function repInput(val, ph, big) { var i = document.createElement(big ? "textarea" : "input"); i.value = val || ""; i.placeholder = ph || ""; return i; }
  function pagePackage() {
    guard().then(function (me) { if (!me) return; var v = shell("packages");
      var id = qs("id"); var editing = !!id;
      v.innerHTML = '<div class="ad-head"><div><h1>' + (editing ? "Edit" : "New") + ' Package</h1><p><a href="packages.html">← Back to packages</a></p></div></div><div id="pk-editor"><div class="ad-loading"><span class="ad-spin"></span> Loading…</div></div>';
      function build(pkg) {
        pkg = pkg || { category: "International", currency: "INR", status: "draft", nights: 0, days: 0, highlights: [], itinerary: [], inclusions: [], exclusions: [], featured: false, sort: 0 };
        var host = $("#pk-editor");
        host.innerHTML =
          '<div class="ad-panel"><div class="ad-panel__h">Basic information</div><div class="ad-panel__b"><div class="ad-form">' +
            '<div class="ad-grid2"><div class="ad-field"><label>Package name *</label><input id="f-title" value="' + esc(pkg.title || "") + '"></div>' +
            '<div class="ad-field"><label>Category *</label><select id="f-category"><option value="International"' + (pkg.category === "International" ? " selected" : "") + '>International</option><option value="National"' + (pkg.category === "National" ? " selected" : "") + '>National (India)</option></select></div></div>' +
            '<div class="ad-grid3"><div class="ad-field"><label>Country</label><input id="f-country" value="' + esc(pkg.country || "") + '"></div><div class="ad-field"><label>Region / cities</label><input id="f-region" value="' + esc(pkg.region || "") + '"></div><div class="ad-field"><label>Image URL</label><input id="f-image" value="' + esc(pkg.image || "") + '"></div></div>' +
            '<div class="ad-grid3"><div class="ad-field"><label>Nights</label><input id="f-nights" type="number" min="0" value="' + (pkg.nights || 0) + '"></div><div class="ad-field"><label>Days</label><input id="f-days" type="number" min="0" value="' + (pkg.days || 0) + '"></div><div class="ad-field"><label>Price (optional)</label><input id="f-price" value="' + esc(pkg.price || "") + '" placeholder="e.g. 85,000 or leave blank"></div></div>' +
            '<div class="ad-field"><label>Short summary</label><textarea id="f-summary">' + esc(pkg.summary || "") + '</textarea></div>' +
            '<div class="ad-field"><label>Overview</label><textarea id="f-overview" style="min-height:120px">' + esc(pkg.overview || "") + '</textarea></div>' +
            '<div class="ad-grid3"><div class="ad-field"><label>Status</label><select id="f-status"><option value="draft"' + sel(pkg.status, "draft") + '>Draft</option><option value="published"' + sel(pkg.status, "published") + '>Published</option><option value="unpublished"' + sel(pkg.status, "unpublished") + '>Unpublished</option></select></div>' +
            '<div class="ad-field"><label>Featured</label><select id="f-featured"><option value="no"' + (pkg.featured ? "" : " selected") + '>No</option><option value="yes"' + (pkg.featured ? " selected" : "") + '>Yes</option></select></div>' +
            '<div class="ad-field"><label>Sort order</label><input id="f-sort" type="number" min="0" value="' + (pkg.sort || 0) + '"></div></div>' +
          "</div></div></div>" +
          '<div class="ad-panel"><div class="ad-panel__h">Package image</div><div class="ad-panel__b"><div class="ad-image"><img class="ad-image__preview" id="img-prev" src="' + esc(rel(pkg.image)) + '" onerror="this.style.visibility=\'hidden\'"><div class="ad-image__drop"><div class="ad-field"><label>Upload (JPG/PNG/WEBP, ≤4 MB)</label><input type="file" id="img-file" accept="image/*"><div class="hint">The image is optimised in your browser, then stored securely. Or paste an image URL above.</div></div><div class="ad-msg" id="img-msg"></div></div></div></div></div>' +
          '<div class="ad-panel"><div class="ad-panel__h">Highlights <button class="ad-btn ad-btn--ghost ad-btn--sm" id="add-hl">' + I.plus + 'Add</button></div><div class="ad-panel__b" id="hl-list"></div></div>' +
          '<div class="ad-panel"><div class="ad-panel__h">Itinerary <button class="ad-btn ad-btn--ghost ad-btn--sm" id="add-day">' + I.plus + 'Add Day</button></div><div class="ad-panel__b" id="day-list"></div></div>' +
          '<div class="ad-panel"><div class="ad-panel__h">Inclusions <button class="ad-btn ad-btn--ghost ad-btn--sm" id="add-inc">' + I.plus + 'Add</button></div><div class="ad-panel__b" id="inc-list"></div></div>' +
          '<div class="ad-panel"><div class="ad-panel__h">Exclusions <button class="ad-btn ad-btn--ghost ad-btn--sm" id="add-exc">' + I.plus + 'Add</button></div><div class="ad-panel__b" id="exc-list"></div></div>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px"><a class="ad-btn ad-btn--ghost" href="packages.html">Cancel</a><button class="ad-btn ad-btn--pri" id="pk-save">Save Package</button></div><div class="ad-msg" id="pk-msg" style="text-align:right"></div>';

        // simple lists
        function simpleList(host, items, ph) {
          host.innerHTML = "";
          (items && items.length ? items : []).forEach(function (t) { addSimple(host, t, ph); });
        }
        function addSimple(host, val, ph) {
          var row = document.createElement("div"); row.className = "rep-item";
          var inp = repInput(val, ph); var del = delBtn(function () { row.remove(); dirty(); });
          row.appendChild(inp); row.appendChild(del); host.appendChild(row); inp.addEventListener("input", dirty);
        }
        function delBtn(fn) { var b = document.createElement("button"); b.type = "button"; b.className = "ad-ico-btn ad-btn--danger"; b.innerHTML = I.trash; b.onclick = fn; return b; }
        simpleList($("#hl-list", host) || document.getElementById("hl-list"), pkg.highlights, "Highlight");
        simpleList(document.getElementById("inc-list"), pkg.inclusions, "Inclusion");
        simpleList(document.getElementById("exc-list"), pkg.exclusions, "Exclusion");
        document.getElementById("add-hl").onclick = function () { addSimple(document.getElementById("hl-list"), "", "Highlight"); dirty(); };
        document.getElementById("add-inc").onclick = function () { addSimple(document.getElementById("inc-list"), "", "Inclusion"); dirty(); };
        document.getElementById("add-exc").onclick = function () { addSimple(document.getElementById("exc-list"), "", "Exclusion"); dirty(); };

        // itinerary days
        function renderDays() {
          var host = document.getElementById("day-list"); host.innerHTML = "";
          days.forEach(function (d, i) {
            var box = document.createElement("div"); box.className = "rep-day";
            box.innerHTML = '<div class="rep-day__top"><span class="rep-day__n">' + (i + 1) + '</span><input class="d-title" placeholder="Day title" value="' + esc(d.title || "") + '" style="flex:1"><div class="rep-day__ctrl"></div></div><textarea class="d-body" placeholder="What happens on this day…">' + esc(d.body || "") + "</textarea>";
            var ctrl = box.querySelector(".rep-day__ctrl");
            ctrl.appendChild(iconBtn(I.up, function () { if (i > 0) { var t = days[i - 1]; days[i - 1] = days[i]; days[i] = t; sync(); renderDays(); dirty(); } }));
            ctrl.appendChild(iconBtn(I.down, function () { if (i < days.length - 1) { var t = days[i + 1]; days[i + 1] = days[i]; days[i] = t; sync(); renderDays(); dirty(); } }));
            ctrl.appendChild(iconBtn(I.trash, function () { days.splice(i, 1); renderDays(); dirty(); }, true));
            box.querySelector(".d-title").addEventListener("input", function () { d.title = this.value; dirty(); });
            box.querySelector(".d-body").addEventListener("input", function () { d.body = this.value; dirty(); });
            host.appendChild(box);
          });
        }
        function sync() { } // days array is source of truth
        function iconBtn(svg, fn, danger) { var b = document.createElement("button"); b.type = "button"; b.className = "ad-ico-btn" + (danger ? " ad-btn--danger" : ""); b.innerHTML = svg; b.onclick = fn; return b; }
        var days = (pkg.itinerary || []).map(function (d) { return { day: d.day, title: d.title, body: d.body }; });
        document.getElementById("add-day").onclick = function () { days.push({ title: "", body: "" }); renderDays(); dirty(); };
        renderDays();

        // image upload (client-side downscale)
        document.getElementById("img-file").addEventListener("change", function () {
          var file = this.files[0]; if (!file) return; var msg = document.getElementById("img-msg");
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
                if (j.ok) { document.getElementById("f-image").value = j.url; var pv = document.getElementById("img-prev"); pv.src = j.url; pv.style.visibility = "visible"; msg.textContent = "Uploaded."; msg.className = "ad-msg ok show"; dirty(); }
                else { msg.textContent = j.message || "Upload failed."; msg.className = "ad-msg err show"; }
              }).catch(function () { msg.textContent = "Upload failed."; msg.className = "ad-msg err show"; });
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        });
        document.getElementById("f-image").addEventListener("input", function () { var pv = document.getElementById("img-prev"); pv.src = rel(this.value); pv.style.visibility = "visible"; });

        // save
        function collect(hostId) { return Array.prototype.map.call(document.querySelectorAll("#" + hostId + " .rep-item input, #" + hostId + " .rep-item textarea"), function (i) { return i.value.trim(); }).filter(Boolean); }
        document.getElementById("pk-save").onclick = function () {
          var payload = {
            title: document.getElementById("f-title").value, category: document.getElementById("f-category").value,
            country: document.getElementById("f-country").value, region: document.getElementById("f-region").value, image: document.getElementById("f-image").value,
            nights: document.getElementById("f-nights").value, days: document.getElementById("f-days").value, price: document.getElementById("f-price").value,
            summary: document.getElementById("f-summary").value, overview: document.getElementById("f-overview").value,
            status: document.getElementById("f-status").value, featured: document.getElementById("f-featured").value === "yes", sort: document.getElementById("f-sort").value,
            highlights: collect("hl-list"), inclusions: collect("inc-list"), exclusions: collect("exc-list"),
            itinerary: days.filter(function (d) { return (d.title || "").trim() || (d.body || "").trim(); })
          };
          var msg = document.getElementById("pk-msg"), btn = document.getElementById("pk-save");
          if (!payload.title.trim()) { msg.textContent = "Package name is required."; msg.className = "ad-msg err show"; return; }
          btn.classList.add("is-loading"); btn.disabled = true;
          var req = editing ? api("/api/admin/package?id=" + id, { method: "PUT", body: payload }) : api("/api/admin/packages", { method: "POST", body: payload });
          req.then(function (j) {
            btn.classList.remove("is-loading"); btn.disabled = false;
            if (j.ok) { isDirty = false; toast("Package saved", "ok"); location.href = "packages.html"; }
            else { msg.textContent = (j.errors && j.errors.join(" ")) || j.message || "Save failed."; msg.className = "ad-msg err show"; }
          }).catch(function () { btn.classList.remove("is-loading"); btn.disabled = false; msg.textContent = "Network error."; msg.className = "ad-msg err show"; });
        };
        // dirty tracking
        host.addEventListener("input", dirty);
      }
      if (editing) api("/api/admin/package?id=" + id).then(function (j) { if (j.ok) build(j.package); else { $("#pk-editor").innerHTML = '<div class="ad-empty">Package not found.</div>'; } });
      else build(null);
    });
  }
  function sel(a, b) { return a === b ? " selected" : ""; }
  var isDirty = false;
  function dirty() { isDirty = true; }
  window.addEventListener("beforeunload", function (e) { if (isDirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ================= INQUIRIES ================= */
  function emailPill(s) {
    var map = { sent: ["on", "email sent"], failed: ["off", "email failed"], pending: ["draft", "email pending"] };
    var m = map[s] || map.pending;
    return '<span class="pill pill--' + m[0] + '" title="Email delivery">' + m[1] + "</span>";
  }
  function pageInquiries() {
    guard().then(function (me) { if (!me) return; var v = shell("inquiries");
      v.innerHTML = '<div class="ad-head"><div><h1>Inquiries</h1><p>Customer enquiries submitted through the website. Private — visible to admins only.</p></div></div>' +
        '<div class="ad-toolbar"><div class="ad-search">' + I.search + '<input id="inq-search" placeholder="Search name, email, package…"></div>' +
        '<button class="ad-filter is-active" data-s="">All</button><button class="ad-filter" data-s="new">New</button><button class="ad-filter" data-s="contacted">Contacted</button><button class="ad-filter" data-s="in_progress">In progress</button><button class="ad-filter" data-s="confirmed">Confirmed</button><button class="ad-filter" data-s="closed">Closed</button></div>' +
        '<div class="ad-panel"><div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Customer</th><th>Package</th><th>Travel date</th><th>Received</th><th>Status</th><th>Email</th><th></th></tr></thead><tbody id="inq-body"><tr><td colspan="7"><div class="ad-loading"><span class="ad-spin"></span> Loading…</div></td></tr></tbody></table></div></div>';
      var term = "", status = "", timer = null;
      function load() {
        var qsp = "?q=" + encodeURIComponent(term) + (status ? "&status=" + encodeURIComponent(status) : "");
        api("/api/admin/inquiries" + qsp).then(function (j) {
          var body = $("#inq-body");
          if (!j.ok || !j.inquiries.length) { body.innerHTML = '<tr><td colspan="7"><div class="ad-empty">' + (j.ok ? "No inquiries found." : "Could not load.") + "</div></td></tr>"; return; }
          body.innerHTML = j.inquiries.map(function (q) {
            return '<tr data-id="' + q.id + '" style="cursor:pointer"><td><div class="ad-table__title">' + esc(q.name || "—") + '</div><div style="font-size:.78rem;color:var(--a-500)">' + esc(q.email || "") + "</div></td><td>" + esc(q.package || "—") + "</td><td>" + esc(q.travel_date || "—") + "</td><td>" + fmtDate(q.created_at) + '</td><td><span class="pill pill--' + esc(q.status) + '">' + esc(q.status.replace("_", " ")) + '</span></td><td>' + emailPill(q.email_status) + '</td><td>' + I.eye + "</td></tr>";
          }).join("");
          body.querySelectorAll("tr").forEach(function (tr) { tr.onclick = function () { openInq(tr.getAttribute("data-id"), load); }; });
        });
      }
      $("#inq-search").addEventListener("input", function () { term = this.value; clearTimeout(timer); timer = setTimeout(load, 250); });
      v.querySelectorAll(".ad-filter").forEach(function (b) { b.onclick = function () { v.querySelectorAll(".ad-filter").forEach(function (x) { x.classList.remove("is-active"); }); b.classList.add("is-active"); status = b.getAttribute("data-s"); load(); }; });
      load();
    });
  }
  function openInq(id, reload) {
    api("/api/admin/inquiries?id=" + id).then(function (j) {
      if (!j.ok) { toast("Could not load", "err"); return; }
      var q = j.inquiry;
      var m = document.createElement("div"); m.className = "ad-modal open";
      var opts = ["new", "contacted", "in_progress", "confirmed", "closed"].map(function (s) { return '<option value="' + s + '"' + (q.status === s ? " selected" : "") + ">" + s.replace("_", " ") + "</option>"; }).join("");
      var estatus = q.email_status || "pending";
      m.innerHTML = '<div class="ad-modal__bd"></div><div class="ad-modal__dlg"><button class="ad-modal__x">' + I.x + '</button><h3 style="font-size:1.3rem;color:var(--a-navy);margin-bottom:16px">Inquiry #' + q.id + '</h3>' +
        row("Name", q.name) + row("Email", q.email ? '<a href="mailto:' + esc(q.email) + '">' + esc(q.email) + "</a>" : "—", true) + row("Phone", q.phone ? '<a href="tel:' + esc(q.phone) + '">' + esc(q.phone) + "</a>" : "—", true) +
        row("Package", q.package) + row("Travellers", q.travellers) + row("Travel date", q.travel_date) + row("Source", q.source) + row("Received", fmtDate(q.created_at)) +
        row("Email delivery", emailPill(estatus) + (estatus !== "sent" ? ' <button class="ad-btn ad-btn--ghost ad-btn--sm" id="inq-retry">Resend email</button>' : ""), true) +
        '<div style="margin:14px 0"><label style="font-weight:600;color:var(--a-navy);font-size:.84rem;display:block;margin-bottom:6px">Message</label><div style="background:var(--a-soft);border:1px solid var(--a-border);border-radius:9px;padding:12px;white-space:pre-wrap;font-size:.9rem">' + esc(q.message || "—") + "</div></div>" +
        '<div style="display:flex;gap:10px;align-items:flex-end;margin-top:6px"><div class="ad-field" style="flex:1"><label>Status</label><select id="inq-status">' + opts + '</select></div><button class="ad-btn ad-btn--pri" id="inq-save">Update</button></div>' +
        '<div style="margin-top:16px;text-align:right"><button class="ad-btn ad-btn--danger ad-btn--sm" id="inq-del">Delete inquiry</button></div></div>';
      document.body.appendChild(m);
      function close() { m.remove(); }
      m.querySelector(".ad-modal__x").onclick = close; m.querySelector(".ad-modal__bd").onclick = close;
      m.querySelector("#inq-save").onclick = function () {
        api("/api/admin/inquiries?id=" + id, { method: "PUT", body: { status: m.querySelector("#inq-status").value } }).then(function (r) { if (r.ok) { toast("Status updated", "ok"); close(); reload && reload(); } else toast("Failed", "err"); });
      };
      var retry = m.querySelector("#inq-retry");
      if (retry) retry.onclick = function () {
        retry.disabled = true; retry.textContent = "Sending…";
        api("/api/admin/inquiries?id=" + id, { method: "PUT", body: { op: "retry_email" } }).then(function (r) {
          if (r.ok) { toast("Email sent", "ok"); close(); reload && reload(); }
          else { toast(r.message || "Email failed", "err"); retry.disabled = false; retry.textContent = "Resend email"; }
        }).catch(function () { toast("Network error", "err"); retry.disabled = false; retry.textContent = "Resend email"; });
      };
      m.querySelector("#inq-del").onclick = function () {
        confirmDialog("Delete inquiry?", "Permanently delete inquiry #" + q.id + " from " + (q.name || "this customer") + "? This cannot be undone.").then(function (yes) {
          if (!yes) return;
          api("/api/admin/inquiries?id=" + id, { method: "DELETE" }).then(function (r) { if (r.ok) { toast("Inquiry deleted", "ok"); close(); reload && reload(); } else toast("Failed", "err"); });
        });
      };
      function row(k, val, html) { return '<div class="ad-detail-row"><span>' + k + "</span><b>" + (html ? (val || "—") : esc(val || "—")) + "</b></div>"; }
    });
  }

  /* ================= SETTINGS ================= */
  function pageSettings() {
    guard().then(function (me) { if (!me) return; var v = shell("settings");
      var first = qs("first");
      v.innerHTML = '<div class="ad-head"><div><h1>Settings</h1><p>Your account and system configuration.</p></div></div>' +
        (first || (me && me.mustChange) ? '<div class="ad-banner">Please set a new password to secure your account before continuing.</div>' : "") +
        '<div class="ad-panel"><div class="ad-panel__h">Account</div><div class="ad-panel__b"><div class="ad-detail-row"><span>Admin email</span><b>' + esc(me.email) + '</b></div>' +
          '<div class="ad-form" style="max-width:460px;margin-top:16px"><div class="ad-field"><label>Current password</label><input type="password" id="s-cur"></div><div class="ad-field"><label>New password</label><input type="password" id="s-new"><div class="hint">At least 8 characters, with a letter and a number.</div></div><div class="ad-field"><label>Confirm new password</label><input type="password" id="s-conf"></div><div><button class="ad-btn ad-btn--pri" id="s-save">Change Password</button></div><div class="ad-msg" id="s-msg"></div></div>' +
        "</div></div>" +
        '<div class="ad-panel"><div class="ad-panel__h">System</div><div class="ad-panel__b" id="sys-status"><div class="ad-loading"><span class="ad-spin"></span> Loading…</div></div></div>' +
        '<div class="ad-panel"><div class="ad-panel__h">Activity log</div><div class="ad-panel__b" id="audit-list"><div class="ad-loading"><span class="ad-spin"></span> Loading…</div></div></div>';
      $("#s-save").onclick = function () {
        var msg = $("#s-msg"), cur = $("#s-cur").value, nw = $("#s-new").value, cf = $("#s-conf").value;
        if (nw !== cf) { msg.textContent = "New passwords do not match."; msg.className = "ad-msg err show"; return; }
        var btn = $("#s-save"); btn.classList.add("is-loading"); btn.disabled = true;
        api("/api/admin/password", { method: "POST", body: { current: cur, next: nw } }).then(function (j) {
          btn.classList.remove("is-loading"); btn.disabled = false;
          if (j.ok) { msg.textContent = "Password changed successfully."; msg.className = "ad-msg ok show"; $("#s-cur").value = $("#s-new").value = $("#s-conf").value = ""; toast("Password updated", "ok"); }
          else { msg.textContent = j.message || "Failed."; msg.className = "ad-msg err show"; }
        }).catch(function () { btn.classList.remove("is-loading"); btn.disabled = false; msg.textContent = "Network error."; msg.className = "ad-msg err show"; });
      };
      api("/api/admin/dashboard").then(function (j) {
        if (!j.ok) { $("#sys-status").innerHTML = "—"; return; }
        $("#sys-status").innerHTML = statusRow("Flight API", j.apis.flight.provider, j.apis.flight.configured) + statusRow("Visa data", j.apis.visa.provider, j.apis.visa.configured) + statusRow("Email", j.apis.email.provider, j.apis.email.configured) + '<div class="ad-detail-row"><span>API keys</span><b style="color:var(--a-500)">Managed securely in Vercel environment variables (never shown here).</b></div>';
      });
      api("/api/admin/audit").then(function (j) {
        var host = $("#audit-list");
        if (!j.ok || !j.log.length) { host.innerHTML = '<div class="ad-empty">No activity yet.</div>'; return; }
        host.innerHTML = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Detail</th></tr></thead><tbody>' +
          j.log.map(function (a) { return "<tr><td>" + fmtDate(a.created_at) + "</td><td>" + esc(a.admin_email || "") + "</td><td>" + esc(a.action) + "</td><td>" + esc(a.detail || "") + "</td></tr>"; }).join("") + "</tbody></table></div>";
      });
    });
  }

  function fmtDate(iso) { if (!iso) return "—"; var d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }

  /* ---------- route ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var p = document.body.getAttribute("data-admin");
    if (p === "login") pageLogin();
    else if (p === "dashboard") pageDashboard();
    else if (p === "packages") pagePackages();
    else if (p === "package") pagePackage();
    else if (p === "inquiries") pageInquiries();
    else if (p === "settings") pageSettings();
  });
})();
