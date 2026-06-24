const pool = require('../../db');

const getSchedules = async (req, res) => {
  try {
    const [rules] = await pool.query("SELECT * FROM schedule_rules");
    res.json(rules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query("SELECT * FROM courses ORDER BY code");
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const {
      code, name, department, credits, instructor, instructor_email,
      theory_days, theory_time, lab_day, lab_time,
      room_number, section, semester
    } = req.body;

    const [exists] = await pool.query(
      "SELECT id FROM courses WHERE code = ? AND section = ? AND semester = ?",
      [code, section, semester]
    );

    if (exists.length > 0) {
      return res.json({ success: false, error: `Duplicate: ${code} Section ${section} already exists.` });
    }

    await pool.query(
      `INSERT INTO courses (
          code, name, department, credits, instructor, instructor_email, 
          theory_days, theory_time, lab_day, lab_time,
          room_number, section, semester, max_students, enrolled_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 0)`,
      [
        code, name, department, credits, instructor, instructor_email,
        theory_days, theory_time, lab_day, lab_time,
        room_number, section, semester
      ]
    );

    res.json({ success: true, message: "Course Created Successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateCapacity = async (req, res) => {
  try {
    const { max_students } = req.body;
    await pool.query("UPDATE courses SET max_students = ? WHERE id = ?", [max_students, req.params.id]);
    res.json({ success: true, message: "Capacity Updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getSchedules,
  getCourses,
  createCourse,
  updateCapacity,
  deleteCourse
};
