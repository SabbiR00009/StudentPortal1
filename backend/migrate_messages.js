const pool = require('./db');

async function migrate() {
  try {
    console.log('Creating messages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id VARCHAR(50) NOT NULL,
        sender_type ENUM('student', 'faculty', 'admin') NOT NULL,
        receiver_id VARCHAR(50) NOT NULL,
        receiver_type ENUM('student', 'faculty', 'admin') NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        status ENUM('unread', 'read', 'resolved') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Also create a replies table for the chat threading
    console.log('Creating message_replies table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        sender_id VARCHAR(50) NOT NULL,
        sender_type ENUM('student', 'faculty', 'admin') NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      );
    `);

    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
