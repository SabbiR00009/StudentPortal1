const mysql = require('mysql2/promise');
const { DB } = require('./config/env');

const pool = mysql.createPool({
  host: DB.host,
  port: DB.port,
  user: DB.user,
  password: DB.password,
  database: DB.database,
  ssl: DB.ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  enableKeepAlive: true,
});

module.exports = pool;
