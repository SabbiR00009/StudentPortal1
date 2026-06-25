const pool = require('../../db');

const getOverviewStats = async (req, res) => {
  try {
    const [[{ unreadMessages }]] = await pool.query(`
      SELECT COUNT(*) as unreadMessages FROM messages 
      WHERE receiver_type = 'admin' AND status = 'unread'
    `);
    
    const [[{ pendingDrops }]] = await pool.query(`
      SELECT COUNT(*) as pendingDrops FROM semester_drop_requests 
      WHERE status = 'pending'
    `);

    res.json({ success: true, unreadMessages, pendingDrops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdminMessages = async (req, res) => {
  try {
    const [messages] = await pool.query(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM message_replies r WHERE r.message_id = m.id) as reply_count
      FROM messages m
      WHERE receiver_type = 'admin'
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Mark as read if it was unread
    await pool.query("UPDATE messages SET status = 'read' WHERE id = ? AND status = 'unread'", [messageId]);

    const [messages] = await pool.query("SELECT * FROM messages WHERE id = ?", [messageId]);
    if (messages.length === 0) return res.status(404).json({ error: "Message not found" });

    const [replies] = await pool.query("SELECT * FROM message_replies WHERE message_id = ? ORDER BY created_at ASC", [messageId]);

    res.json({ success: true, message: messages[0], replies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const replyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { body } = req.body;

    await pool.query(`
      INSERT INTO message_replies (message_id, sender_id, sender_type, body)
      VALUES (?, 'admin', 'admin', ?)
    `, [messageId, body]);

    res.json({ success: true, message: "Reply sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body; // 'read', 'unread', 'resolved'
    
    await pool.query("UPDATE messages SET status = ? WHERE id = ?", [status, messageId]);
    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOverviewStats,
  getAdminMessages,
  getMessageThread,
  replyMessage,
  updateMessageStatus
};
