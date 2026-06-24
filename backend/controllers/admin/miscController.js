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

const createSemester = async (req, res) => {
  try {
    const { semester, start_date, end_date } = req.body;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("UPDATE advising_periods SET is_active = 0");
      await connection.query(
        "INSERT INTO advising_periods (semester, start_date, end_date, is_active) VALUES (?, ?, ?, 1)",
        [semester, start_date, end_date]
      );
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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

const deleteSlot = async (req, res) => {
  try {
    await pool.query("DELETE FROM advising_slots WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  createAdmin,
  createSemester,
  postAnnouncement,
  getSlots,
  createSlot,
  deleteSlot
};
