const pool = require('../../db');
const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD = '123456';

// Public: Student submits a password reset request (no auth required)
// Requires student_id + email + dob for identity verification
const submitRequest = async (req, res) => {
  try {
    const { student_id, email, dob } = req.body;

    if (!student_id || !email || !dob) {
      return res.status(400).json({ error: 'Student ID, registered email, and date of birth are all required for verification.' });
    }

    // Find student by student_id string
    const [students] = await pool.query('SELECT id, email, dob FROM students WHERE student_id = ?', [student_id]);
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found. Please check your Student ID.' });
    }

    const student = students[0];

    // Verify email matches (case-insensitive)
    if (student.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ error: 'Verification failed. The email does not match our records.' });
    }

    // Verify DOB matches (normalize format: compare YYYY-MM-DD)
    const submittedDob = new Date(dob).toISOString().split('T')[0];
    const storedDob = student.dob ? new Date(student.dob).toISOString().split('T')[0] : null;

    if (!storedDob || submittedDob !== storedDob) {
      return res.status(401).json({ error: 'Verification failed. The date of birth does not match our records.' });
    }

    const studentDbId = student.id;

    // Check if there's already a pending request
    const [pending] = await pool.query(
      "SELECT id FROM password_reset_requests WHERE student_id = ? AND status = 'pending'",
      [studentDbId]
    );
    if (pending.length > 0) {
      return res.status(409).json({ error: 'You already have a pending password reset request. Please wait for admin approval.' });
    }

    await pool.query(
      'INSERT INTO password_reset_requests (student_id) VALUES (?)',
      [studentDbId]
    );

    res.json({ success: true, message: 'Identity verified! Your password reset request has been submitted. Please wait for admin approval.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Admin: Get all password reset requests
const getAllRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT prr.*, s.name as student_name, s.student_id as student_code, s.email, s.department
      FROM password_reset_requests prr
      JOIN students s ON prr.student_id = s.id
      ORDER BY prr.status = 'pending' DESC, prr.requested_at DESC
    `);
    res.json({ success: true, requests });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Admin: Approve or reject a request
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const [requests] = await pool.query('SELECT * FROM password_reset_requests WHERE id = ?', [id]);
    if (requests.length === 0) return res.status(404).json({ error: 'Request not found.' });

    const request = requests[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been resolved.' });
    }

    // If approved, reset the student's password to default
    if (status === 'approved') {
      const hashedDefault = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
      await pool.query('UPDATE students SET password = ? WHERE id = ?', [hashedDefault, request.student_id]);
    }

    await pool.query(
      "UPDATE password_reset_requests SET status = ?, admin_note = ?, resolved_at = NOW() WHERE id = ?",
      [status, admin_note || null, id]
    );

    res.json({ success: true, message: `Request ${status} successfully.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { submitRequest, getAllRequests, updateRequestStatus };
