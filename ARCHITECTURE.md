# Vandana Travel Experts — Architecture

A static customer website + a secure, database-backed admin panel, deployed as
one project on **Vercel**. The **database is the single source of truth** for
dynamic content (packages, inquiries). The admin panel is the control room; the
customer site reads only *published* data.

```
   CUSTOMER                                   ADMIN
      │                                          │
      ▼                                          ▼
  Static pages (HTML/CSS/JS)              /admin/*.html  (login-gated UI)
      │  fetch                                   │  fetch (HttpOnly cookie)
      ▼                                          ▼
  PUBLIC API                              ADMIN API  (auth + role check on EVERY call)
  /api/packages   (published only)        /api/admin/[action]   ← one function
  /api/inquiry    (create only)           /api/admin/setup      (one-time)
  /api/flight, /api/visa (live info)              │
      │                                          │
      └───────────────┬──────────────────────────┘
                      ▼
              Neon Postgres  (admins, packages, inquiries, audit_log)
                      │
        ┌─────────────┼───────────────┐
        ▼             ▼               ▼
   Vercel Blob   FormSubmit      AeroDataBox / curated
   (images)      (email)         (flight / visa)
```

## Why these choices
- **Hosting: Vercel** — the repo already deploys here; static files + serverless
  functions in one project, zero-config, free tier.
- **Database: Neon Postgres** — Vercel's first-party Postgres option (Storage tab
  injects `DATABASE_URL`). Relational data (packages ↔ inquiries), SQL filtering
  for the admin, managed backups on Neon. Accessed via `@neondatabase/serverless`
  (HTTP driver, ideal for serverless — no connection pool to exhaust).
- **Images: Vercel Blob** — public object storage on the same platform; the admin
  uploads, we store the returned URL in `packages.image`. No local filesystem.
- **Email: FormSubmit** — free, unlimited, server-side (no private keys in the
  browser). Swappable behind `api/_mail.js`.
- **Auth: Node `crypto` only** — no external dependency; scrypt + HMAC.

> Vercel Hobby allows **max 12 serverless functions**, so all admin routes live in
> one catch-all function, `api/admin/[action].js`, dispatched by the URL segment.

## Serverless functions
| Route | Access | Purpose |
|---|---|---|
| `GET /api/packages` | public | Published packages for the customer site. `configured:false` when no DB → site uses bundled fallback. Edge-cached ~15s (stale-while-revalidate). |
| `POST /api/inquiry` | public | Validate → **store inquiry** → email team → record `email_status`. Honeypot + per-IP rate limit. |
| `GET /api/flight`, `GET /api/visa` | public | Live flight status / visa info (kept separate from CMS data). |
| `POST /api/admin/setup` | setup-token | One-time: create schema, seed packages, create first admin. |
| `/api/admin/<action>` | **admin session** | login, logout, me, password, dashboard, packages (list/create), package (get/update/delete), actions (status/featured/duplicate/reorder), inquiries (list/get/status/retry-email/delete), upload, audit. |

## Data model (Neon Postgres)
- **admins** — `id, email, pass (scrypt), role, token_version, must_change, failed, locked_until, last_login, created_at`
- **packages** — `id, slug (unique), title, category ('National'|'International'), country, region, nights, days, price, currency, summary, overview, image, highlights/itinerary/inclusions/exclusions (jsonb), status ('draft'|'published'|'unpublished'), featured, sort, deleted, created_at, updated_at`
- **inquiries** — `id, name, email, phone, package, travellers, travel_date, message, source, status ('new'|'contacted'|'in_progress'|'confirmed'|'closed'), email_status ('pending'|'sent'|'failed'), ip, created_at`
- **audit_log** — `id, admin_email, action, detail, created_at`

Indexes: `idx_pkg_pub (status, deleted, sort)`, `idx_inq_created (created_at desc)`.
`ensureSchema()` is idempotent (`CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`).

## Authentication & authorization
1. Admin posts email+password → server verifies scrypt hash (timing-safe).
2. On success an HMAC-SHA256-signed token (`{id, email, ver, exp}`) is set in an
   **HttpOnly, Secure, SameSite=Strict** cookie (`vte_admin`, 2h).
3. **Every** `/api/admin/*` call runs `requireAdmin()`: verify signature+expiry,
   then re-check the admin row and `token_version` in the DB. Logout and password
   change bump `token_version`, instantly invalidating old cookies.
4. State-changing requests also require a same-origin `Origin`/`Referer` (CSRF).
5. Brute-force: 5 failed logins → 15-minute lockout.

Frontend route guards are **UX only**; the backend is the real gate. A logged-out
user calling `DELETE /api/admin/package?id=1` directly gets `401`.

## Package data flow (the core loop)
- Admin create/edit/publish/unpublish/delete → validated (`_pkg.validate`, whitelist
  + clamps, category/status enums, mass-assignment safe) → written to `packages`.
- Customer site calls `GET /api/packages` (published, non-deleted only) on load and
  uses it as the source of truth — **including an empty result** (unpublishing
  everything clears the site). The static array in `assets/js/packages.js` is used
  **only** when the API is unreachable/unconfigured, so the site survives an outage.
- Propagation: edge cache is ~15s with `stale-while-revalidate`, so changes appear
  within seconds; the admin's own views (`/api/admin/*`) are `no-store` (instant).

## Inquiry flow
Customer submits → `/api/inquiry` validates → **stores the inquiry first** (never
lost) → attempts email → records `email_status`. Admin sees it under *Inquiries*
with search/filter, can change workflow status, **resend** a failed email, or
delete. Retry re-sends via the same server-side mailer and updates `email_status`.

## Security summary
SQL injection (parameterised tagged templates) · XSS (all admin output escaped) ·
CSRF (SameSite=Strict + same-origin check) · IDOR/privilege escalation (server
auth on every admin call) · mass assignment (validator whitelist) · brute force
(lockout) · abuse (per-IP inquiry rate limit) · secrets server-side only, never in
the client or the repo · clean JSON errors (no stack traces / internals leaked).

## Environment variables
See [`.env.example`](.env.example). Required: `DATABASE_URL` (auto from Neon),
`AUTH_SECRET`. For full function: `BLOB_READ_WRITE_TOKEN` (auto from Blob),
`SETUP_TOKEN` + `ADMIN_INITIAL_EMAIL`/`ADMIN_INITIAL_PASSWORD` (first-run only).
Optional: `TEAM_EMAIL`, `AERODATABOX_KEY`.
