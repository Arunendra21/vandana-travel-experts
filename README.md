# Vandana Travel Experts — Website

A modern, fully responsive, animation-rich website for [Vandana Travel Experts](https://www.travelvandana.com/),
built as a **static site** (plain HTML, CSS & vanilla JavaScript) — no PHP, no WordPress, no build step.

> _We Keep it Simple — DMC | Tours | Weddings | Events | Holidays_

## ✨ Features

- **National & International tour packages** — 16 real packages sourced from the company's package PDFs,
  cleanly separated into National (India) and International, with a filter + search discovery page.
- **Structured package data** — every package lives in [`assets/js/packages.js`](assets/js/packages.js)
  (id, title, category, country, region, duration, image, summary, highlights, overview, day-by-day
  itinerary, inclusions, exclusions). Add or edit a package in one place — the UI updates automatically.
- **Package detail pages** — `package.html?id=…` renders the full itinerary, inclusions and exclusions.
- **Book Now flow** — every card and detail page has a **Book Now** button that opens a booking form
  with the selected package **pre-filled**. Submissions are emailed to the office (see below).
- **Premium branded loading screen** — the `vte` logo with a subtle plane-along-a-route animation that
  disappears as soon as the page is ready.
- **Rich animations** — hero Ken-Burns slideshow + parallax, scroll-reveal, animated counters,
  hover-zoom cards, testimonials carousel, animated section underlines.
- **Policy pages** — Terms & Conditions, Cancellation & Refund Policy (with the fee table), and Privacy
  Policy, transcribed from the company's official documents.
- **Responsive** — tested from 320 px phones to 1440 px desktops, no horizontal overflow.
- Floating WhatsApp button, back-to-top, accessible markup, `prefers-reduced-motion` support.

## 📧 Email delivery (important — one-time setup)

The contact form and the Book Now form deliver real email to **vandanatravelexperts@gmail.com** via
[FormSubmit](https://formsubmit.co) — **free, unlimited (no monthly cap), no backend, no API keys.**

**How it works:** when a visitor submits an enquiry (the selected package is included automatically),
FormSubmit shows its own **free captcha** ("I'm not a robot") to block bots, then redirects to
`thankyou.html`. On top of that, every form has a hidden **honeypot** and a **time-trap** that silently
catch automated bots.

**One-time activation:** the **first** submission emails a one-time **"Activate"** link to
`vandanatravelexperts@gmail.com`. **Open that email once and click "Activate"** — after that, every
submission is delivered to the inbox automatically. Nothing else to set up.

To change the destination address, edit `EMAIL` at the top of `assets/js/site.js`.
(Optional privacy tweak: after activating, FormSubmit gives you a random alias URL like
`formsubmit.co/el/xxxx`; put it in `FORM_POST`/`FORM_AJAX` to keep your email out of the page source.)

## 📁 Structure

```
vandana-travel-experts/
├── index.html              # Home
├── about.html              # About Us
├── packages.html           # All packages (National / International filter + search)
├── package.html            # Package detail (?id=…)
├── contact.html            # Contact + enquiry form
├── terms.html              # Terms & Conditions
├── cancellation.html       # Cancellation & Refund Policy
├── privacy.html            # Privacy Policy
└── assets/
    ├── css/style.css        # All styles + design tokens
    ├── js/packages.js       # Structured package data (edit here)
    ├── js/site.js           # Header/footer, packages UI, booking, forms, animations
    └── img/                 # Destination, package & brand images
```

## ✏️ Editing content

- **Packages:** edit the `window.VTE_PACKAGES` array in `assets/js/packages.js`.
- **Contact details / email:** the constants at the top of `assets/js/site.js`.
- **Business registrations & footer:** `renderFooter()` in `assets/js/site.js`.
- **Colors / fonts:** the CSS variables in `:root` at the top of `assets/css/style.css`.

## 📷 Images

Package/destination photos are the company's own images plus freely-licensed landmark photos from
Wikimedia Commons (no watermarks or third-party logos). Prices are shown as **"On request"** wherever
the source PDF did not state a price — no prices were invented.

## 🚀 View / deploy

Open `index.html`, or serve the folder (`python3 -m http.server 8000`). The site is published with
GitHub Pages and can also be deployed to Vercel (static, zero config).

---

© 2026 Vandana Travel Experts. All rights reserved.

## 🔐 Admin Panel (Vercel)

A secure, server-authenticated admin panel to manage packages & inquiries without editing code.

- **Auth:** email + password (scrypt-hashed), HTTP-only `Secure` `SameSite=Strict` signed session cookie, validated **server-side on every `/api/admin/*` request**. Login lockout after repeated failures; logout & password change invalidate all sessions.
- **Data:** Vercel Postgres (`admins`, `packages`, `inquiries`, `audit_log`). Images: Vercel Blob (validated, optimised).
- **Customer site** reads **published** packages from `/api/packages` and falls back to the bundled static data if the DB is absent — it never breaks. Bookings post to `/api/inquiry`, which stores the enquiry (private) **and** emails the team; the enquiry then appears in the admin panel.

### One-time setup
1. In Vercel → **Storage**, add **Postgres** and **Blob** (both inject their env vars automatically).
2. In Vercel → **Settings → Environment Variables**, add: `AUTH_SECRET`, `SETUP_TOKEN`, `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD` (temporary), and (optional) `AERODATABOX_KEY`. See [`.env.example`](.env.example).
3. **Redeploy.**
4. Initialise once — creates tables, seeds the 16 packages, creates the first admin:
   ```bash
   curl -X POST https://YOUR-APP.vercel.app/api/admin/setup -H "x-setup-token: YOUR_SETUP_TOKEN"
   ```
5. Log in at **`/admin/login.html`** with your initial credentials → you'll be forced to set a new password.

**The admin panel must be used on the Vercel domain** (the secure session cookie is same-origin only). Never commit real secrets. API keys are never shown in the UI.
