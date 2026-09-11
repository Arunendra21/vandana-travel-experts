# Vandana Travel Experts — Website

A modern, fully responsive, animation-rich rebuild of [travelvandana.com](https://www.travelvandana.com/),
built as a **static site** (plain HTML, CSS & vanilla JavaScript) — no PHP, no WordPress, no build step.

> _We Keep it Simple — DMC | Tours | Weddings | Events | Holidays_

## ✨ Features

- **Modern responsive design** — mobile-first, works from 320px phones to large desktops.
- **Rich animations** — hero Ken-Burns slideshow, scroll-reveal sections, animated stat counters,
  hover-zoom destination cards, package tabs, an auto-playing testimonials carousel and a marquee.
- **Same brand identity** — keeps the original blue (`#046BD2`) + cyan + gold theme and the `vte` logo.
- **Real content & pricing** — destinations, international/domestic packages, testimonials and
  office details taken from the live site.
- **Shared header & footer** — injected from one place (`assets/js/site.js`) so the nav is edited once.
- **Extras** — floating WhatsApp button, back-to-top, working mailto contact form, Google-Maps office embed,
  accessible markup and `prefers-reduced-motion` support.

## 📁 Structure

```
vandana-travel-experts/
├── index.html          # Home
├── about.html          # About Us
├── contact.html        # Contact Us
└── assets/
    ├── css/style.css   # All styles + design tokens
    ├── js/site.js      # Header/footer, data, all interactions
    └── img/            # Optimized site images (logo, destinations, packages, avatars)
```

## 🚀 View it

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

### Live (GitHub Pages)

This repo is published with GitHub Pages from the `main` branch — see the repository's
**Settings → Pages** for the live URL.

## ✏️ Editing content

- **Packages / destinations / testimonials:** edit the `VTE_DATA` object near the top of
  `assets/js/site.js`.
- **Navigation menu:** edit `intlMenu` / `domMenu` in the same file.
- **Contact details:** the `PHONE`, `EMAIL`, `WA` constants in `assets/js/site.js`.
- **Colors / fonts:** the CSS variables in `:root` at the top of `assets/css/style.css`.

## 📷 Images & credits

Images were sourced from the original travelvandana.com site. The price/offer text that was
baked into some source photos was removed and rebuilt as clean, responsive HTML.

---

© 2026 Vandana Travel Experts. All rights reserved.
