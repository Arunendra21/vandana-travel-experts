/* Shared DB layer (Vercel Postgres). Files prefixed with "_" are helpers,
   not HTTP routes. All queries use parameterised `sql` template tags. */
var pg = require("@vercel/postgres");
var sql = pg.sql;

function dbConfigured() {
  return !!(process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING);
}

async function ensureSchema() {
  await sql`CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    pass TEXT NOT NULL,
    token_version INTEGER NOT NULL DEFAULT 0,
    must_change BOOLEAN NOT NULL DEFAULT FALSE,
    failed INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
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
}

async function audit(email, action, detail) {
  try { await sql`INSERT INTO audit_log (admin_email, action, detail) VALUES (${email}, ${action}, ${detail || null})`; } catch (e) {}
}

module.exports = { sql, dbConfigured, ensureSchema, audit };
