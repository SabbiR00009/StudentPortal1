const pool = require('../../db');

const getFacultyCourses = async (req, res) => {
  try {
    if (req.params.email !== req.user.email) return res.status(403).json({ error: "Forbidden: Unauthorized access" });
    const [courses] = await pool.query("SELECT * FROM courses WHERE instructor_email = ?", [req.params.email]);

    const enriched = await Promise.all(courses.map(async (c) => {
      const [countResult] = await pool.query("SELECT COUNT(*) as count FROM student_courses WHERE course_id = ? AND status='enrolled'", [c.id]);
      return { ...c, enrolled_real: countResult[0].count };
    }));

    res.json(enriched);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

const getAdvisees = async (req, res) => {
  try {
    if (req.params.email !== req.user.email) return res.status(403).json({ error: "Forbidden: Unauthorized access" });
    const [faculty] = await pool.query("SELECT id FROM faculty WHERE email = ?", [req.params.email]);
    if (faculty.length === 0) return res.json([]);

    const [students] = await pool.query("SELECT * FROM students WHERE advisor_email = ?", [req.params.email]);
    res.json(students);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getStudentProfile = async (req, res) => {
  try {
    const idParam = req.params.id;
    const [studentRows] = await pool.query("SELECT * FROM students WHERE id = ? OR student_id = ?", [idParam, idParam]);
    
    if (studentRows.length === 0) return res.json({ student: null, history: [], current: [] });
    const student = studentRows[0];

    const [current] = await pool.query(`
        SELECT c.code, c.name, CONCAT(c.theory_days, ' ', c.theory_time) as schedule 
        FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        WHERE sc.student_id = ? AND sc.status = 'enrolled'
    `, [student.id]);

    const [history] = await pool.query(`
        SELECT g.semester, c.code, c.name, g.grade 
        FROM grades g 
        JOIN courses c ON g.course_id = c.id 
        WHERE g.student_id = ? 
        ORDER BY g.semester DESC
    `, [student.id]);

    res.json({ student, history, current });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getCourseStudents = async (req, res) => {
  try {
    const [students] = await pool.query(`
        SELECT s.id, s.student_id, s.name, s.email, g.grade, g.marks 
        FROM student_courses sc
        JOIN students s ON sc.student_id = s.id
        LEFT JOIN grades g ON s.id = g.student_id AND sc.course_id = g.course_id
        WHERE sc.course_id = ? AND sc.status = 'enrolled'
    `, [req.params.courseId]);
    res.json(students);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const submitGrade = async (req, res) => {
  try {
    const { studentDbId, courseId, marks, semester } = req.body;
    let g = "F", p = 0.0;
    
    if (marks >= 97) { g = "A+"; p = 4.0; }
    else if (marks >= 90) { g = "A"; p = 4.0; }
    else if (marks >= 87) { g = "A-"; p = 3.7; }
    else if (marks >= 83) { g = "B+"; p = 3.3; }
    else if (marks >= 80) { g = "B"; p = 3.0; }
    else if (marks >= 77) { g = "B-"; p = 2.7; }
    else if (marks >= 73) { g = "C+"; p = 2.3; }
    else if (marks >= 70) { g = "C"; p = 2.0; }
    else if (marks >= 67) { g = "C-"; p = 1.7; }
    else if (marks >= 63) { g = "D+"; p = 1.3; }
    else if (marks >= 60) { g = "D"; p = 1.0; }

    const [existing] = await pool.query("SELECT id FROM grades WHERE student_id = ? AND course_id = ?", [studentDbId, courseId]);
    
    if (existing.length > 0) {
      await pool.query("UPDATE grades SET marks=?, grade=?, point=? WHERE id=?", [marks, g, p, existing[0].id]);
    } else {
      await pool.query("INSERT INTO grades (student_id, course_id, marks, grade, point, semester) VALUES (?, ?, ?, ?, ?, ?)", [studentDbId, courseId, marks, g, p, semester]);
    }

    res.json({ success: true, grade: g, point: p });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getFacultyCourses,
  getAdvisees,
  getStudentProfile,
  getCourseStudents,
  submitGrade
};
