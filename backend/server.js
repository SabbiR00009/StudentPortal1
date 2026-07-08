const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const pool = require('./db');

const app = express();

// Trust the first proxy (Render / Railway / Nginx) so secure cookies and
// req.ip work correctly behind a load balancer.
app.set('trust proxy', 1);

// ─── Security & performance middleware ───
app.use(
  helmet({
    // The SPA and its inline styles need a relaxed CSP; API is JSON only.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
if (!config.isProd) app.use(morgan('dev'));

// CORS: when the frontend is served by this same server, requests are
// same-origin and no allowlist is needed. Extra origins can be added via env.
app.use(
  cors({
    origin: config.CORS_ORIGINS.length ? config.CORS_ORIGINS : true,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate-limit the API to blunt brute-force / abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ─── Health check (used by hosting platforms) ───
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

// ─── Routes ───
const authRoutes = require('./routes/auth/authRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const studentRoutes = require('./routes/student/studentRoutes');
const advisingRoutes = require('./routes/student/advisingRoutes');
const facultyRoutes = require('./routes/faculty/facultyRoutes');
const { submitRequest: submitPasswordReset } = require('./controllers/admin/passwordResetController');

// Strict limiter only on the brute-force-prone endpoints (not /me, which the app
// calls on every page load).
app.use('/api/login', authLimiter);
app.use('/api/password-reset-request', authLimiter);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/advising', advisingRoutes);
app.use('/api/faculty', facultyRoutes);
app.post('/api/password-reset-request', submitPasswordReset);

// Public contact form (from the public website)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }
    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || 'General Inquiry', message]
    );
    res.status(201).json({ success: true, message: 'Thank you for reaching out. We will respond shortly.' });
  } catch (e) {
    res.status(500).json({ error: 'Could not submit your message.' });
  }
});

// Public announcements feed
app.get('/api/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Serve the built frontend (single-service deployment) ───
const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.resolve(__dirname, '../frontend/dist');

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  // SPA fallback: any non-API GET returns index.html so client routing works.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  console.log(`[static] Serving frontend from ${staticDir}`);
}

// ─── 404 + error handlers ───
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: config.isProd ? 'Internal server error' : err.message });
});

// ─── Scheduled semester transitions ───
const cron = require('node-cron');
const { checkAndTransitionSemester } = require('./helpers/semesterManager');
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily semester check...');
  try {
    await checkAndTransitionSemester();
  } catch (e) {
    console.error('[CRON] Semester check failed:', e.message);
  }
});
// Run once on boot (non-fatal if the DB is not ready yet).
checkAndTransitionSemester().catch((e) => console.error('[BOOT] Semester check failed:', e.message));

app.listen(config.PORT, () =>
  console.log(`${config.UNIVERSITY.name} server running on http://localhost:${config.PORT} [${config.NODE_ENV}]`)
);
