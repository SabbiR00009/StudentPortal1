const pool = require('../../db');

const login = async (req, res) => {
  try {
    const { id, password, role } = req.body;
    if (!id || !password) return res.status(400).json({ error: "Required fields missing" });

    // CASE 1: FACULTY / ADMIN LOGIN
    if (role === 'faculty' || role === 'admin') {
      // A. Check Admin Table
      const [adminRows] = await pool.query("SELECT * FROM admins WHERE email = ? AND password = ?", [id, password]);
      if (adminRows.length > 0) {
        const { password: _, ...d } = adminRows[0];
        return res.json({ success: true, user: d, userType: "admin" });
      }

      // B. Check Faculty Table
      const [facultyRows] = await pool.query("SELECT * FROM faculty WHERE (faculty_id = ? OR email = ?) AND password = ?", [id, id, password]);
      if (facultyRows.length > 0) {
        const { password: _, ...d } = facultyRows[0];
        return res.json({ success: true, user: d, userType: "faculty" });
      }
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    // CASE 2: STUDENT LOGIN
    if (role === 'student') {
      const [studentRows] = await pool.query("SELECT * FROM students WHERE student_id = ? AND password = ?", [id, password]);
      if (studentRows.length > 0) {
        const { password: _, ...d } = studentRows[0];
        return res.json({ success: true, student: d, userType: "student" });
      } else {
        return res.status(401).json({ error: "Invalid Student credentials" });
      }
    }
    
    return res.status(400).json({ error: "Invalid Login Type" });
  } catch (e) {
    console.error("Login Error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  login
};
