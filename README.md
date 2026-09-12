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

The contact form and the Book Now form send real email to **vandanatravelexperts@gmail.com** via
[FormSubmit](https://formsubmit.co) — a service that works on static sites with **no backend and no API
keys in the code**. Because there is no server, this is the production-appropriate mechanism here.

**One-time activation:** the first time any form is submitted, FormSubmit emails a confirmation link to
`vandanatravelexperts@gmail.com`. **Open that email once and click "Activate"** — after that, every
submission is delivered to the inbox automatically. Until it is activated, the form shows the
FormSubmit confirmation message instead of a fake success.

To change the destination address, edit `FORM_ACTION` / `EMAIL` at the top of
[`assets/js/site.js`](assets/js/site.js).

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
