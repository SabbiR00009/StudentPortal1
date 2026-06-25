const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_portal'
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // Check if empty
    const [rows] = await connection.execute("SELECT COUNT(*) as cnt FROM transactions");
    if (rows[0].cnt === 0) {
      console.log("Seeding transactions...");
      const [students] = await connection.execute("SELECT id FROM students");
      
      for (const s of students) {
        // Mock a past payment
        await connection.execute(`
          INSERT INTO transactions (student_id, amount, type, description, date) 
          VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 30 DAY))
        `, [s.id, 1500.00, 'Payment', 'Spring-2026 Tuition Payment']);
        
        // Mock a current charge
        await connection.execute(`
          INSERT INTO transactions (student_id, amount, type, description, date) 
          VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 5 DAY))
        `, [s.id, -500.00, 'Charge', 'Summer-2026 Base Semester Fee']);
      }
    }
    console.log("Migration successful.");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
run();
