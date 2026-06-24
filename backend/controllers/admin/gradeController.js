const pool = require('../../db');

const searchStudent = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const term = `%${q}%`;
    const [students] = await pool.query(
      "SELECT id, student_id, name, department FROM students WHERE student_id LIKE ? OR name LIKE ? LIMIT 10",
      [term, term]
    );
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getPendingCourses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [courses] = await pool.query(
      `SELECT c.id as course_id, c.code, c.name, c.section, c.credits
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = ? AND sc.status = 'enrolled'
       AND c.id NOT IN (SELECT course_id FROM grades WHERE student_id = ?)`,
      [studentId, studentId]
    );
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const batchPublishGrades = async (req, res) => {
  try {
    const { studentId, grades } = req.body;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const g of grades) {
        await connection.query(
          "INSERT INTO grades (student_id, course_id, marks, grade, point, semester) VALUES (?, ?, ?, ?, ?, ?)",
          [studentId, g.courseId, g.marks, g.grade, g.point, "Fall-2025"]
        );
      }
      
      await connection.commit();
      res.json({ success: true, message: "Grades Published Successfully!" });
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

module.exports = {
  searchStudent,
  getPendingCourses,
  batchPublishGrades
};
