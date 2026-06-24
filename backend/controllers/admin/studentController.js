const pool = require('../../db');
const { checkTimeConflict } = require('../../helpers/conflictChecker');

const getStudents = async (req, res) => {
  try {
    const { search } = req.query;
    if (search) {
      const term = `%${search}%`;
      const [students] = await pool.query(
        "SELECT * FROM students WHERE name LIKE ? OR student_id LIKE ? ORDER BY student_id DESC LIMIT 50",
        [term, term]
      );
      res.json(students);
    } else {
      const [students] = await pool.query("SELECT * FROM students ORDER BY student_id DESC LIMIT 50");
      res.json(students);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const s = req.body;

    // 1. Generate Sequential Student ID
    const admittedYear = s.admitted_year || new Date().getFullYear();
    const admittedSem = s.admitted_semester || "Fall";
    const dept = s.department || "General";

    const semMap = { "Spring": 1, "Summer": 2, "Fall": 3 };
    const sCode = semMap[admittedSem] || 3;
    const deptMap = { "CSE": 60, "EEE": 50, "BBA": 40, "ACT": 30, "ENG": 20 };
    const dCode = deptMap[dept] || 99;

    const prefix = `${admittedYear}-${sCode}-${dCode}-`;

    const [lastStudents] = await pool.query(
      "SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY student_id DESC LIMIT 1",
      [`${prefix}%`]
    );

    let serial = 1;
    if (lastStudents.length > 0) {
      const parts = lastStudents[0].student_id.split("-");
      const lastSerial = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSerial)) serial = lastSerial + 1;
    }

    const finalId = `${prefix}${String(serial).padStart(3, "0")}`;
    const finalEmail = `${finalId}@san.edu`;

    // 2. Generate Collision-Proof Unique ID (U-XXXXXX)
    let uniqueId;
    let isUnique = false;

    while (!isUnique) {
      uniqueId = `U-${Math.floor(100000 + Math.random() * 900000)}`;
      const [exists] = await pool.query("SELECT id FROM students WHERE unique_id = ?", [uniqueId]);
      if (exists.length === 0) isUnique = true;
    }

    // 3. Insert into Database
    await pool.query(
      `INSERT INTO students (
          student_id, unique_id, password, name, email, phone, 
          program, department, admitted_semester, year, semester, 
          dob, blood_group, nid, marital_status, 
          present_address, permanent_address, advisor_name, advisor_email,
          payment_status, previous_due
      ) VALUES (?, ?, '123456', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Due', 0)`,
      [
        finalId, uniqueId, s.name, finalEmail, s.phone,
        s.program || `B.Sc in ${s.department}`, s.department, s.admitted_semester, admittedYear, "Fall-2025",
        s.dob, s.blood_group, s.nid, s.marital_status,
        s.present_address, s.permanent_address, s.advisor_name, s.advisor_email
      ]
    );

    res.json({ success: true, message: `Student Created! ID: ${finalId}` });
  } catch (e) {
    console.error("Create Student Error:", e.message);
    res.status(500).json({ error: e.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const s = req.body;
    await pool.query(
      `UPDATE students SET 
          name=?, phone=?, program=?, department=?, 
          year=?, semester=?, dob=?, blood_group=?, 
          nid=?, marital_status=?, present_address=?, permanent_address=?, 
          advisor_name=?, advisor_email=?
      WHERE student_id = ?`,
      [
        s.name, s.phone, s.program, s.department,
        s.year, s.semester, s.dob, s.blood_group,
        s.nid, s.marital_status, s.present_address, s.permanent_address,
        s.advisor_name, s.advisor_email, req.params.id
      ]
    );
    res.json({ success: true, message: "Student Profile Updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const [students] = await pool.query("SELECT id FROM students WHERE student_id = ?", [req.params.id]);
    if (students.length > 0) {
      // Deletions on child tables will happen automatically due to ON DELETE CASCADE
      await pool.query("DELETE FROM students WHERE id = ?", [students[0].id]);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const enrollStudent = async (req, res) => {
  try {
    const { studentDbId, courseCode } = req.body;

    if (!studentDbId) return res.status(400).json({ error: "Missing Student ID." });

    // 1. Get New Course
    const [courses] = await pool.query("SELECT * FROM courses WHERE code = ?", [courseCode]);
    if (courses.length === 0) return res.status(404).json({ error: "Course not found." });
    const course = courses[0];

    // 2. Get Student's Active Schedule
    const [existingCourses] = await pool.query(`
        SELECT c.* FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        WHERE sc.student_id = ? AND sc.status = 'enrolled'
    `, [studentDbId]);

    // --- CHECK 1: DUPLICATE ---
    const duplicate = existingCourses.find(c => c.code === course.code);
    if (duplicate && duplicate.id !== course.id) {
      return res.status(400).json({
        error: `Duplicate: Already enrolled in ${duplicate.code} (Section ${duplicate.section}).`
      });
    }

    // --- CHECK 2: TIME CONFLICT ---
    const check = checkTimeConflict(course, existingCourses);
    if (check.conflict) {
      return res.status(400).json({ error: check.message });
    }

    // 3. Enroll
    const [existing] = await pool.query("SELECT id, status FROM student_courses WHERE student_id = ? AND course_id = ?", [studentDbId, course.id]);

    if (existing.length > 0) {
      await pool.query("UPDATE student_courses SET status = 'enrolled', enrolled_at = CURRENT_TIMESTAMP WHERE id = ?", [existing[0].id]);
    } else {
      await pool.query("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')", [studentDbId, course.id]);
    }

    await pool.query("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?", [course.id]);
    res.json({ success: true, message: "Enrolled Successfully." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

const dropStudent = async (req, res) => {
  try {
    const { studentDbId, type, targetId } = req.body;
    if (type === "semester") {
      await pool.query("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND status = 'enrolled'", [studentDbId]);
      return res.json({ success: true, message: "Semester Dropped" });
    } else {
      await pool.query("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND course_id = ?", [studentDbId, targetId]);
      await pool.query("UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?", [targetId]);
      return res.json({ success: true, message: "Course Dropped" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStudent,
  dropStudent
};
