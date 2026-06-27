const pool = require('../../db');

const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    await pool.query("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)", [name, email, password]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const postAnnouncement = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    await pool.query(
      "INSERT INTO announcements (title, content, category) VALUES (?, ?, ?)",
      [title, content, category]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getSlots = async (req, res) => {
  try {
    const [slots] = await pool.query("SELECT * FROM advising_slots ORDER BY start_time");
    res.json(slots);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createSlot = async (req, res) => {
  try {
    const { min, max, start, end } = req.body;
    // format to mysql datetime string if needed, assuming the req.body strings are valid
    await pool.query(
      "INSERT INTO advising_slots (min_credits, max_credits, start_time, end_time) VALUES (?, ?, ?, ?)",
      [min, max, start.replace('T', ' '), end.replace('T', ' ')]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getDropPeriods = async (req, res) => {
  try {
    const [periods] = await pool.query("SELECT * FROM drop_periods ORDER BY id DESC");
    res.json(periods);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createDropPeriod = async (req, res) => {
  try {
    const { start_date, end_date, min_credits, max_credits } = req.body;
    const { getActiveSemester } = require('../../helpers/semesterManager');
    const activeSem = await getActiveSemester();
    
    await pool.query(
      "INSERT INTO drop_periods (semester, start_date, end_date, is_active, min_credits, max_credits) VALUES (?, ?, ?, 1, ?, ?)",
      [activeSem, start_date.replace('T', ' '), end_date.replace('T', ' '), min_credits || 0, max_credits || 140]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteDropPeriod = async (req, res) => {
  try {
    await pool.query("DELETE FROM drop_periods WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    await pool.query("DELETE FROM advising_slots WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM system_settings");
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    const [exists] = await pool.query("SELECT * FROM system_settings WHERE setting_key = ?", [key]);
    if (exists.length > 0) {
      await pool.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = ?", [value, key]);
    } else {
      await pool.query("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)", [key, value]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  createAdmin,
  postAnnouncement,
  getSlots,
  createSlot,
  deleteSlot,
  getDropPeriods,
  createDropPeriod,
  deleteDropPeriod,
  getSettings,
  updateSettings
};
