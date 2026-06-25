const pool = require('../../db');

const getStudentById = async (req, res) => {
  try {
    const [students] = await pool.query("SELECT * FROM students WHERE id = ? OR student_id = ?", [req.params.id, req.params.id]);
    if (students.length > 0) {
      const { password, ...d } = students[0];
      res.json(d);
    } else res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getStudentCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(`
        SELECT c.*, sc.status, sc.enrolled_at, g.semester as completed_semester, g.grade, g.point, g.marks 
        FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        LEFT JOIN grades g ON sc.student_id = g.student_id AND sc.course_id = g.course_id 
        WHERE sc.student_id = ? 
        ORDER BY CASE WHEN sc.status = 'enrolled' THEN 0 ELSE 1 END, c.semester DESC
    `, [req.params.id]);
    res.json(courses);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getStudentGrades = async (req, res) => {
  try {
    const [grades] = await pool.query(`
        SELECT c.name as course_name, c.code, c.credits, g.grade, g.point, g.marks, g.semester 
        FROM grades g 
        JOIN courses c ON g.course_id = c.id 
        WHERE g.student_id = ? 
        ORDER BY g.semester DESC
    `, [req.params.id]);
    res.json(grades);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getStudentFinancials = async (req, res) => {
  try {
    const [studentRows] = await pool.query("SELECT payment_status, previous_due FROM students WHERE id = ?", [req.params.id]);
    if (studentRows.length === 0) return res.status(404).json({ error: "Student not found" });
    const student = studentRows[0];

    const { getActiveSemester } = require('../../helpers/semesterManager');
    const activeSem = await getActiveSemester();

    const [creditsRows] = await pool.query(`
        SELECT SUM(c.credits) as totalCredits 
        FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        WHERE sc.student_id = ? AND sc.status = 'enrolled'
    `, [req.params.id]);

    const credits = creditsRows[0].totalCredits || 0;
    const currentCharges = (credits * 150) + 500;
    const previousDue = parseFloat(student.previous_due || 0);
    const totalPayable = currentCharges + previousDue;
    
    // Fetch transaction history
    const [transactions] = await pool.query(`
        SELECT amount, type, description, date 
        FROM transactions 
        WHERE student_id = ? 
        ORDER BY date DESC
    `, [req.params.id]);

    res.json({
      activeSem,
      credits,
      current_charges: currentCharges,
      previous_due: previousDue,
      total_payable: totalPayable,
      status: student.payment_status,
      dueDate: "2026-08-15",
      transactions
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const dropCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const { getActiveSemester } = require('../../helpers/semesterManager');
    const activeSem = await getActiveSemester();
    
    const [courses] = await pool.query(`
      SELECT c.credits FROM student_courses sc 
      JOIN courses c ON sc.course_id = c.id 
      WHERE sc.student_id = ? AND sc.status = 'enrolled' AND c.semester = ?
    `, [studentId, activeSem]);
    
    const totalCredits = courses.reduce((sum, c) => sum + parseFloat(c.credits), 0);
    
    const [courseToDrop] = await pool.query("SELECT credits FROM courses WHERE id = ? AND semester = ?", [courseId, activeSem]);

    if (courseToDrop.length === 0) return res.status(404).json({ error: "Course not found in active semester." });
    if (totalCredits - parseFloat(courseToDrop[0].credits) < 9) return res.status(400).json({ error: "Min 9 credits required." });

    await pool.query("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND course_id = ? AND status = 'enrolled'", [studentId, courseId]);
    await pool.query("UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?", [courseId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const dropSemester = async (req, res) => {
  try {
    const { getActiveSemester } = require('../../helpers/semesterManager');
    const activeSem = await getActiveSemester();
    
    // Drop all courses for the active semester
    await pool.query(`
      UPDATE student_courses sc
      JOIN courses c ON sc.course_id = c.id
      SET sc.status = 'dropped' 
      WHERE sc.student_id = ? AND sc.status = 'enrolled' AND c.semester = ?
    `, [req.body.studentId, activeSem]);
    
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = {
  getStudentById,
  getStudentCourses,
  getStudentGrades,
  getStudentFinancials,
  dropCourse,
  dropSemester
};
