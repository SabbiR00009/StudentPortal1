const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Import Routes
const authRoutes = require('./routes/auth/authRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const studentRoutes = require('./routes/student/studentRoutes');
const advisingRoutes = require('./routes/student/advisingRoutes');
const facultyRoutes = require('./routes/faculty/facultyRoutes');
const pool = require('./db');

const cron = require('node-cron');
const { checkAndTransitionSemester } = require('./helpers/semesterManager');

// Run semester check every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily semester check...');
  await checkAndTransitionSemester();
});

// Run once on boot to ensure we're up to date
checkAndTransitionSemester();

// Main Routing
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/advising', advisingRoutes);
app.use('/api/faculty', facultyRoutes);

// Public: Password Reset Request (no auth required)
const { submitRequest: submitPasswordReset } = require('./controllers/admin/passwordResetController');
app.post('/api/password-reset-request', submitPasswordReset);

// Shared Announcement Route
app.get("/api/announcements", async (req, res) => {
  try {
    const [announcements] = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10");
    res.json(announcements);
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));