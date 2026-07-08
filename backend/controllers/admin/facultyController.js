const pool = require('../../db');
const bcrypt = require('bcryptjs');

const getFaculty = async (req, res) => {
  try {
    const [faculty] = await pool.query("SELECT * FROM faculty ORDER BY name");
    res.json(faculty);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, department, designation, phone, dob } = req.body;

    // Validation
    if (name && phone) {
      const [existing] = await pool.query(
        "SELECT id FROM faculty WHERE name = ? AND phone = ?",
        [name, phone]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "A faculty member with this Name and Phone Number is already registered!" });
      }
    }

    const deptMap = { "CSE": 60, "EEE": 50, "BBA": 40, "ACT": 30, "ENG": 20 };
    const dCode = deptMap[department] || 99;
    const nameSlug = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    const prefix = `${nameSlug}-${dCode}-`;
    const [lastFaculty] = await pool.query(
      "SELECT faculty_id FROM faculty WHERE faculty_id LIKE ? ORDER BY faculty_id DESC LIMIT 1",
      [`${prefix}%`]
    );

    let serial = 1;
    if (lastFaculty.length > 0) {
      const parts = lastFaculty[0].faculty_id.split("-");
      const lastSerial = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSerial)) serial = lastSerial + 1;
    }
    const finalId = `${prefix}${String(serial).padStart(3, "0")}`;

    // Email Gen with Collision check
    let baseEmail = `${nameSlug}@biu.edu.bd`;
    let finalEmail = baseEmail;
    let emailIdx = 1;
    while (true) {
      const [emailExists] = await pool.query("SELECT id FROM faculty WHERE email = ?", [finalEmail]);
      if (emailExists.length === 0) break;
      finalEmail = `${nameSlug}${emailIdx}@biu.edu.bd`;
      emailIdx++;
    }

    const hashedPassword = bcrypt.hashSync('123456', 10);
    await pool.query(
      "INSERT INTO faculty (faculty_id, name, email, department, designation, phone, dob, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [finalId, name, finalEmail, department, designation, phone, dob, hashedPassword]
    );

    res.json({ success: true, message: `Faculty Added! ID: ${finalId}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { name, phone, dob, designation } = req.body;
    await pool.query(
      "UPDATE faculty SET name = ?, phone = ?, dob = ?, designation = ? WHERE id = ?",
      [name, phone, dob, designation, req.params.id]
    );
    res.json({ success: true, message: "Faculty updated successfully!" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getFacultyCourses = async (req, res) => {
  try {
    const [facultyRows] = await pool.query("SELECT email FROM faculty WHERE id = ?", [req.params.id]);
    if (facultyRows.length === 0) return res.status(404).json({ error: "Faculty not found" });

    const facultyEmail = facultyRows[0].email;
    const { getActiveSemester } = require('../../helpers/semesterManager');
    const activeSem = await getActiveSemester();

    const [courses] = await pool.query(
      "SELECT id, code, name, semester, credits, theory_days, theory_time, lab_day, lab_time, section FROM courses WHERE instructor_email = ? ORDER BY semester DESC",
      [facultyEmail]
    );

    const formatted = courses.map(c => ({
      ...c,
      status: c.semester === activeSem ? "Currently taking" : "Completed"
    }));

    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    await pool.query("DELETE FROM faculty WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getFaculty,
  createFaculty,
  updateFaculty,
  getFacultyCourses,
  deleteFaculty
};
