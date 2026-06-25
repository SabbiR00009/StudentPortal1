const pool = require('../../db');
const { getActiveSemester } = require('../../helpers/semesterManager');

const getAllRequests = async (req, res) => {
  try {
    const activeSem = await getActiveSemester();
    const [requests] = await pool.query(`
      SELECT r.*, s.name as student_name, s.student_id as student_roll
      FROM semester_drop_requests r
      JOIN students s ON r.student_id = s.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status." });
    }

    const [requests] = await pool.query("SELECT * FROM semester_drop_requests WHERE id = ?", [id]);
    if (requests.length === 0) return res.status(404).json({ success: false, error: "Request not found." });
    
    const request = requests[0];
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: "Request is already processed." });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update the request status
      await connection.query(
        "UPDATE semester_drop_requests SET status = ?, admin_response = ? WHERE id = ?",
        [status, adminResponse || null, id]
      );

      // If approved, drop all currently enrolled courses for that student in that semester
      if (status === 'approved') {
        // Find enrolled courses for the student in that semester
        const [coursesToDrop] = await connection.query(`
          SELECT sc.id, c.credits FROM student_courses sc
          JOIN courses c ON sc.course_id = c.id
          WHERE sc.student_id = ? AND sc.status = 'enrolled' AND c.semester = ?
        `, [request.student_id, request.semester]);

        if (coursesToDrop.length > 0) {
          const ids = coursesToDrop.map(c => c.id);
          await connection.query(
            "UPDATE student_courses SET status = 'dropped' WHERE id IN (?)",
            [ids]
          );
          
          // Decrement enrolled_count for those courses
          const courseIds = coursesToDrop.map(c => c.course_id);
          await connection.query(`
            UPDATE courses c 
            JOIN student_courses sc ON c.id = sc.course_id 
            SET c.enrolled_count = GREATEST(c.enrolled_count - 1, 0) 
            WHERE sc.id IN (?)
          `, [ids]);
        }
      }

      await connection.commit();
      res.json({ success: true, message: `Request ${status} successfully.` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllRequests,
  updateRequestStatus
};
