/* Shared DB layer (Neon serverless Postgres — Vercel's current Postgres).
   Files prefixed with "_" are helpers, not HTTP routes. The `sql` tagged
   template parameterises all interpolated values (safe from SQL injection)
   and, with fullResults, resolves to { rows, rowCount, ... }. */
var neon = require("@neondatabase/serverless").neon;

function dburl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED || "";
}
function dbConfigured() { return !!dburl(); }

var _sql = null;
function sql(strings) {
  if (!_sql) _sql = neon(dburl(), { fullResults: true });
  var vals = Array.prototype.slice.call(arguments, 1);
  return _sql.apply(null, [strings].concat(vals));
}

async function ensureSchema() {
  await sql`CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    pass TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    token_version INTEGER NOT NULL DEFAULT 0,
    must_change BOOLEAN NOT NULL DEFAULT FALSE,
    failed INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    country TEXT,
    region TEXT,
    nights INTEGER DEFAULT 0,
    days INTEGER DEFAULT 0,
    price TEXT,
    currency TEXT DEFAULT 'INR',
    summary TEXT,
    overview TEXT,
    image TEXT,
    highlights JSONB DEFAULT '[]'::jsonb,
    itinerary JSONB DEFAULT '[]'::jsonb,
    inclusions JSONB DEFAULT '[]'::jsonb,
    exclusions JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    package TEXT,
    travellers TEXT,
    travel_date TEXT,
    message TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    email_status TEXT NOT NULL DEFAULT 'pending',
    ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    admin_email TEXT,
    action TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published',
    sort INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  // Idempotent migrations for databases created before these columns/indexes existed.
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'pending'`;
  await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'`;
  await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pkg_pub ON packages (status, deleted, sort)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inq_created ON inquiries (created_at DESC)`;
}

async function audit(email, action, detail) {
  try { await sql`INSERT INTO audit_log (admin_email, action, detail) VALUES (${email}, ${action}, ${detail || null})`; } catch (e) {}
}

module.exports = { sql, dbConfigured, ensureSchema, audit };
