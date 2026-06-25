const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_portal'
  });

  const [tables] = await connection.query("SHOW TABLES");
  console.log("Tables:");
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    console.log("- " + tableName);
    if (tableName.includes('payment') || tableName.includes('transaction') || tableName.includes('invoice')) {
        const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
        console.log(columns.map(c => `  ${c.Field} (${c.Type})`).join('\n'));
    }
  }
  await connection.end();
}
run();
