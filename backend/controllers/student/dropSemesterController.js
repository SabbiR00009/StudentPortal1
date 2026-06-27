const pool = require('../../db');
const { getActiveSemester } = require('../../helpers/semesterManager');

const getDropRequest = async (req, res) => {
  try {
    const studentId = req.user.dbId;
    const activeSem = await getActiveSemester();

    const [requests] = await pool.query(
      "SELECT * FROM semester_drop_requests WHERE student_id = ? AND semester = ? ORDER BY created_at DESC LIMIT 1",
      [studentId, activeSem]
    );

    if (requests.length > 0) {
      return res.json({ success: true, request: requests[0] });
    }
    
    return res.json({ success: true, request: null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const submitDropRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const studentId = req.user.dbId;
    const activeSem = await getActiveSemester();

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, error: "Reason is required." });
    }

    // Check if there is already a pending or approved request
    const [existing] = await pool.query(
      "SELECT status FROM semester_drop_requests WHERE student_id = ? AND semester = ? AND status IN ('pending', 'approved')",
      [studentId, activeSem]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: `You already have a ${existing[0].status} request for this semester.` });
    }

    await pool.query(
      "INSERT INTO semester_drop_requests (student_id, semester, reason) VALUES (?, ?, ?)",
      [studentId, activeSem, reason]
    );

    res.json({ success: true, message: "Drop request submitted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDropRequest,
  submitDropRequest
};
