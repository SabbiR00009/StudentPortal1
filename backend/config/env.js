/**
 * Centralized environment configuration & validation.
 *
 * All environment access goes through this module so that:
 *  - defaults live in one place
 *  - required secrets are validated on boot (fail fast, not at request time)
 *  - the rest of the codebase never touches `process.env` directly
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// In production a real secret is mandatory. In development we allow a fallback
// so the app boots out-of-the-box, but we warn loudly.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (isProd) {
    console.error('FATAL: JWT_SECRET is not set. Refusing to start in production.');
    process.exit(1);
  }
  JWT_SECRET = 'dev_only_insecure_secret_change_me';
  console.warn('[config] JWT_SECRET not set — using an insecure development fallback.');
}

// Comma-separated list of allowed browser origins for CORS.
// When the frontend is served by this same server (single-service deploy),
// requests are same-origin and this list can stay empty.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = {
  NODE_ENV,
  isProd,
  PORT: parseInt(process.env.PORT, 10) || 3000,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGINS,
  // Cross-site cookies (frontend on a different domain than the API) require
  // SameSite=None + Secure. Same-origin deploys use the safer Lax default.
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || (isProd ? 'lax' : 'lax'),
  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProd,
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'biu_portal',
    // Optional SSL for managed cloud databases (PlanetScale, Aiven, etc.)
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  },
  DEFAULT_PASSWORD: process.env.DEFAULT_PASSWORD || '123456',
  UNIVERSITY: {
    name: 'Bengal International University',
    short: 'BIU',
    domain: 'biu.edu.bd',
  },
};
