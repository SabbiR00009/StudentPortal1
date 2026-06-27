const pool = require('../../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const generateTokenAndSetCookie = (res, payload) => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

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
        generateTokenAndSetCookie(res, { dbId: d.id, role: 'admin', email: d.email });
        return res.json({ success: true, user: d, userType: "admin" });
      }

      // B. Check Faculty Table
      const [facultyRows] = await pool.query("SELECT * FROM faculty WHERE (faculty_id = ? OR email = ?) AND password = ?", [id, id, password]);
      if (facultyRows.length > 0) {
        const { password: _, ...d } = facultyRows[0];
        generateTokenAndSetCookie(res, { dbId: d.id, role: 'faculty', email: d.email });
        return res.json({ success: true, user: d, userType: "faculty" });
      }
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    // CASE 2: STUDENT LOGIN
    if (role === 'student') {
      const [studentRows] = await pool.query("SELECT * FROM students WHERE student_id = ? AND password = ?", [id, password]);
      if (studentRows.length > 0) {
        const { password: _, ...d } = studentRows[0];
        generateTokenAndSetCookie(res, { dbId: d.id, role: 'student', email: d.email });
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

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
};

const me = async (req, res) => {
  try {
    const { dbId, role } = req.user;
    
    if (role === 'student') {
      const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [dbId]);
      if (rows.length > 0) {
        const { password: _, ...d } = rows[0];
        return res.json({ success: true, user: d, userType: 'student' });
      }
    } else if (role === 'faculty') {
      const [rows] = await pool.query("SELECT * FROM faculty WHERE id = ?", [dbId]);
      if (rows.length > 0) {
        const { password: _, ...d } = rows[0];
        return res.json({ success: true, user: d, userType: 'faculty' });
      }
    } else if (role === 'admin') {
      const [rows] = await pool.query("SELECT * FROM admins WHERE id = ?", [dbId]);
      if (rows.length > 0) {
        const { password: _, ...d } = rows[0];
        return res.json({ success: true, user: d, userType: 'admin' });
      }
    }
    
    return res.status(404).json({ error: "User not found" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  login,
  logout,
  me
};
