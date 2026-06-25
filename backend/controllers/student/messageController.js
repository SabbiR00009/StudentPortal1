const pool = require('../../db');

// Get messages for a student (inbox)
const getMessages = async (req, res) => {
  try {
    const studentDbId = req.user.dbId; // Integer ID from Auth Middleware
    
    // Convert to student_id for sender_id/receiver_id
    const [students] = await pool.query("SELECT student_id FROM students WHERE id = ?", [studentDbId]);
    if (students.length === 0) return res.status(404).json({ error: "Student not found" });
    const sId = students[0].student_id;

    // Fetch messages where student is sender or receiver
    const [messages] = await pool.query(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM message_replies r WHERE r.message_id = m.id) as reply_count
      FROM messages m
      WHERE (sender_type = 'student' AND sender_id = ?) 
         OR (receiver_type = 'student' AND receiver_id = ?)
      ORDER BY m.created_at DESC
    `, [sId, sId]);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const studentDbId = req.user.dbId;
    const { receiver_id, receiver_type, subject, body } = req.body;

    const [students] = await pool.query("SELECT student_id FROM students WHERE id = ?", [studentDbId]);
    if (students.length === 0) return res.status(404).json({ error: "Student not found" });
    const sId = students[0].student_id;

    await pool.query(`
      INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, subject, body)
      VALUES (?, 'student', ?, ?, ?, ?)
    `, [sId, receiver_id, receiver_type, subject, body]);

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get allowed faculty contacts (only those currently teaching enrolled courses)
const getFacultyContacts = async (req, res) => {
  try {
    const studentDbId = req.user.dbId;
    
    const [faculty] = await pool.query(`
      SELECT DISTINCT f.faculty_id, f.name, f.designation, f.department, c.name as course_name
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      JOIN faculty f ON c.instructor_email = f.email
      WHERE sc.student_id = ? AND sc.status = 'enrolled'
    `, [studentDbId]);

    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific message and its replies
const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const [messages] = await pool.query("SELECT * FROM messages WHERE id = ?", [messageId]);
    if (messages.length === 0) return res.status(404).json({ error: "Message not found" });

    const [replies] = await pool.query("SELECT * FROM message_replies WHERE message_id = ? ORDER BY created_at ASC", [messageId]);

    res.json({ success: true, message: messages[0], replies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reply to a message thread
const replyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { body } = req.body;
    const studentDbId = req.user.dbId;

    const [students] = await pool.query("SELECT student_id FROM students WHERE id = ?", [studentDbId]);
    if (students.length === 0) return res.status(404).json({ error: "Student not found" });
    const sId = students[0].student_id;

    await pool.query(`
      INSERT INTO message_replies (message_id, sender_id, sender_type, body)
      VALUES (?, ?, 'student', ?)
    `, [messageId, sId, body]);

    res.json({ success: true, message: "Reply sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getFacultyContacts,
  getMessageThread,
  replyMessage
};
