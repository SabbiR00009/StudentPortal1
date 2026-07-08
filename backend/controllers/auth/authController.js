const pool = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config/env');

const JWT_SECRET = config.JWT_SECRET;

const generateTokenAndSetCookie = (res, payload) => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAMESITE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const login = async (req, res) => {
  try {
    const { id, password, role } = req.body;
    if (!id || !password) return res.status(400).json({ error: "Required fields missing" });

    // Helper to check password and handle migration/flags
    const verifyUserPassword = (inputPassword, dbUser) => {
      const isDefaultPlaintext = dbUser.password === '123456';
      
      let isValid = false;
      if (inputPassword === dbUser.password) {
        isValid = true; // Legacy plaintext
      } else {
        try { isValid = bcrypt.compareSync(inputPassword, dbUser.password); } catch (e) {}
      }
      
      const requiresPasswordChange = isDefaultPlaintext || (isValid && inputPassword === '123456');
      return { isValid, requiresPasswordChange };
    };

    // CASE 1: FACULTY / ADMIN LOGIN
    if (role === 'faculty' || role === 'admin') {
      // A. Check Admin Table
      const [adminRows] = await pool.query("SELECT * FROM admins WHERE email = ?", [id]);
      if (adminRows.length > 0) {
        const adminUser = adminRows[0];
        const { isValid, requiresPasswordChange } = verifyUserPassword(password, adminUser);
        
        if (isValid) {
          const { password: _, ...d } = adminUser;
          generateTokenAndSetCookie(res, { dbId: d.id, role: 'admin', email: d.email });
          return res.json({ success: true, user: d, userType: "admin", requiresPasswordChange });
        }
      }

      // B. Check Faculty Table
      const [facultyRows] = await pool.query("SELECT * FROM faculty WHERE (faculty_id = ? OR email = ?)", [id, id]);
      if (facultyRows.length > 0) {
        const facultyUser = facultyRows[0];
        const { isValid, requiresPasswordChange } = verifyUserPassword(password, facultyUser);
        
        if (isValid) {
          const { password: _, ...d } = facultyUser;
          generateTokenAndSetCookie(res, { dbId: d.id, role: 'faculty', email: d.email });
          return res.json({ success: true, user: d, userType: "faculty", requiresPasswordChange });
        }
      }
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    // CASE 2: STUDENT LOGIN
    if (role === 'student') {
      const [studentRows] = await pool.query("SELECT * FROM students WHERE student_id = ?", [id]);
      if (studentRows.length > 0) {
        const studentUser = studentRows[0];
        const { isValid, requiresPasswordChange } = verifyUserPassword(password, studentUser);
        
        if (isValid) {
          const { password: _, ...d } = studentUser;
          generateTokenAndSetCookie(res, { dbId: d.id, role: 'student', email: d.email });
          return res.json({ success: true, student: d, userType: "student", requiresPasswordChange });
        }
      }
      return res.status(401).json({ error: "Invalid Student credentials" });
    }
    
    return res.status(400).json({ error: "Invalid Login Type" });
  } catch (e) {
    console.error("Login Error:", e);
    res.status(500).json({ error: e.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAMESITE,
  });
  res.json({ success: true });
};

const me = async (req, res) => {
  try {
    const { dbId, role } = req.user;
    
    if (role === 'student') {
      const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [dbId]);
      if (rows.length > 0) {
        const { password: _, ...d } = rows[0];
        const isDefault = rows[0].password === '123456' || (rows[0].password !== '123456' && bcrypt.compareSync('123456', rows[0].password || ''));
        return res.json({ success: true, user: d, userType: 'student', requiresPasswordChange: isDefault });
      }
    } else if (role === 'faculty') {
      const [rows] = await pool.query("SELECT * FROM faculty WHERE id = ?", [dbId]);
      if (rows.length > 0) {
        const { password: _, ...d } = rows[0];
        const isDefault = rows[0].password === '123456' || (rows[0].password !== '123456' && bcrypt.compareSync('123456', rows[0].password || ''));
        return res.json({ success: true, user: d, userType: 'faculty', requiresPasswordChange: isDefault });
      }
    } else if (role === 'admin') {
      const [rows] = await pool.query("SELECT * FROM admins WHERE id = ?", [dbId]);
      if (rows.length > 0) {
        const { password: _, ...d } = rows[0];
        const isDefault = rows[0].password === '123456' || (rows[0].password !== '123456' && bcrypt.compareSync('123456', rows[0].password || ''));
        return res.json({ success: true, user: d, userType: 'admin', requiresPasswordChange: isDefault });
      }
    }
    
    return res.status(404).json({ error: "User not found" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { dbId, role } = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required." });
    }

    let table = "";
    if (role === 'student') table = "students";
    else if (role === 'faculty') table = "faculty";
    else if (role === 'admin') table = "admins";
    else return res.status(400).json({ error: "Invalid role." });

    const [rows] = await pool.query(`SELECT password FROM ${table} WHERE id = ?`, [dbId]);
    
    if (rows.length === 0) return res.status(404).json({ error: "User not found." });
    
    let isCurrentValid = false;
    if (rows[0].password === currentPassword) {
      isCurrentValid = true;
    } else {
      try { isCurrentValid = bcrypt.compareSync(currentPassword, rows[0].password); } catch (e) {}
    }

    if (!isCurrentValid) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedNewPassword, dbId]);

    res.json({ success: true, message: "Password updated successfully." });
  } catch (e) {
    console.error("Change Password Error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  login,
  logout,
  me,
  changePassword
};
