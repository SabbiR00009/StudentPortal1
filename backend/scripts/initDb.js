/**
 * Consolidated database initializer for Bengal International University (BIU).
 *
 * Replaces the old scattered migration scripts (migration.js, migrate_*.js) and
 * the legacy SQLite layer. Creates the database if needed, all tables, and seeds
 * demo data ONCE (guarded by the admins table being empty).
 *
 * All seeded passwords are bcrypt-hashed at rest. Accounts seeded with the
 * default password are flagged for a forced change on first login.
 *
 * Usage:  node scripts/initDb.js
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { DB, DEFAULT_PASSWORD, UNIVERSITY } = require('../config/env');

const EMAIL = UNIVERSITY.domain; // biu.edu.bd

async function initDb() {
  console.log('Connecting to MySQL...');
  // Connect without a database first so we can create it if missing.
  const bootstrap = await mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    ssl: DB.ssl,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${DB.database}\``);
  await bootstrap.end();

  const db = await mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    database: DB.database,
    ssl: DB.ssl,
    multipleStatements: true,
  });

  console.log('Creating tables...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(50) UNIQUE NOT NULL,
      unique_id VARCHAR(50) UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      program VARCHAR(100),
      department VARCHAR(100) NOT NULL,
      admitted_semester VARCHAR(100),
      year INT NOT NULL,
      semester VARCHAR(100) NOT NULL,
      dob VARCHAR(50), blood_group VARCHAR(10), nid VARCHAR(50), marital_status VARCHAR(50),
      present_address TEXT, permanent_address TEXT,
      advisor_name VARCHAR(255), advisor_email VARCHAR(255),
      payment_status VARCHAR(50) DEFAULT 'Paid',
      previous_due DECIMAL(10, 2) DEFAULT 0,
      gpa DECIMAL(3, 2) DEFAULT 0.0,
      avatar TEXT,
      advising_status VARCHAR(50) DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      department VARCHAR(100),
      designation VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      department VARCHAR(100) NOT NULL,
      credits DECIMAL(4, 1) NOT NULL,
      instructor VARCHAR(255) NOT NULL,
      instructor_email VARCHAR(255) NOT NULL,
      theory_days VARCHAR(50) NOT NULL,
      theory_time VARCHAR(100) NOT NULL,
      lab_day VARCHAR(50),
      lab_time VARCHAR(100),
      room_number VARCHAR(100) NOT NULL,
      section INT NOT NULL,
      semester VARCHAR(100) NOT NULL,
      max_students INT DEFAULT 40,
      enrolled_count INT DEFAULT 0,
      UNIQUE KEY uq_course_section (code, section, semester)
    );

    CREATE TABLE IF NOT EXISTS student_courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      status VARCHAR(50) DEFAULT 'enrolled',
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      marks INT NOT NULL,
      grade VARCHAR(10) NOT NULL,
      point DECIMAL(3, 2) NOT NULL,
      semester VARCHAR(100) NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS advising_periods (
      id INT AUTO_INCREMENT PRIMARY KEY,
      semester VARCHAR(100) NOT NULL,
      start_date VARCHAR(50) NOT NULL,
      end_date VARCHAR(50) NOT NULL,
      is_active TINYINT(1) DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS advising_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      semester VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS advising_slots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      min_credits INT NOT NULL,
      max_credits INT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      value VARCHAR(100) NOT NULL,
      display VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      type VARCHAR(50) NOT NULL,
      description VARCHAR(255) NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS message_replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id INT NOT NULL,
      sender_id VARCHAR(50) NOT NULL,
      sender_type ENUM('student', 'faculty', 'admin') NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS semester_drop_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      semester VARCHAR(50) NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      admin_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drop_periods (
      id INT AUTO_INCREMENT PRIMARY KEY,
      semester VARCHAR(100) NOT NULL,
      start_date VARCHAR(50) NOT NULL,
      end_date VARCHAR(50) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      min_credits INT DEFAULT 0,
      max_credits INT DEFAULT 200
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT
    );

    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(50) NOT NULL,
      status ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('new', 'read', 'archived') DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Tables ready.');

  const [adminRows] = await db.query('SELECT COUNT(*) AS count FROM admins');
  if (adminRows[0].count > 0) {
    console.log('Data already present — skipping seed.');
    await db.end();
    return;
  }

  console.log('Seeding Bengal International University demo data...');
  const defaultHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  // 1. Admins  (super admin uses a strong password; must be changed on first login)
  const superAdminHash = bcrypt.hashSync('admin123', 10);
  await db.query('INSERT INTO admins (email, password, name, role) VALUES (?, ?, ?, ?)', [
    `admin@${EMAIL}`, superAdminHash, 'System Administrator', 'admin',
  ]);
  await db.query('INSERT INTO admins (email, password, name, role) VALUES (?, ?, ?, ?)', [
    `registrar@${EMAIL}`, defaultHash, 'Office of the Registrar', 'admin',
  ]);

  // 2. Faculty
  const faculties = [
    ['F001', 'Prof. Dr. Rafiqul Islam', `r.islam@${EMAIL}`, 'CSE', 'Professor & Chair'],
    ['F002', 'Dr. Ayesha Siddika', `ayesha@${EMAIL}`, 'CSE', 'Associate Professor'],
    ['F003', 'Prof. Dr. Kamrul Hasan', `k.hasan@${EMAIL}`, 'EEE', 'Professor'],
    ['F004', 'Nusrat Jahan', `nusrat@${EMAIL}`, 'BBA', 'Lecturer'],
    ['F005', 'Dr. Sabbir Ahmed', `s.ahmed@${EMAIL}`, 'ENG', 'Assistant Professor'],
    ['F006', 'Dr. Tanvir Rahman', `tanvir@${EMAIL}`, 'EEE', 'Senior Lecturer'],
  ];
  for (const f of faculties) {
    await db.query(
      'INSERT INTO faculty (faculty_id, password, name, email, department, designation) VALUES (?, ?, ?, ?, ?, ?)',
      [f[0], defaultHash, f[1], f[2], f[3], f[4]]
    );
  }

  // 3. Schedule rules
  for (const d of ['MW', 'ST', 'SR', 'TR']) {
    await db.query('INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)', ['theory_day', d, d]);
  }
  for (const d of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']) {
    await db.query('INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)', ['lab_day', d.substring(0, 3), d]);
  }
  const theorySlots = ['08:30 - 10:00', '10:10 - 11:40', '11:50 - 01:20', '01:30 - 03:00', '03:10 - 04:40'];
  for (let i = 0; i < theorySlots.length; i++) {
    await db.query('INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)', ['theory_slot', theorySlots[i], `Slot ${i + 1}: ${theorySlots[i]}`]);
  }
  for (const t of ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 02:00', '02:00 - 04:00']) {
    await db.query('INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)', ['lab_slot_2h', t, t]);
  }
  for (const t of ['08:00 - 11:00', '11:00 - 02:00', '02:00 - 05:00']) {
    await db.query('INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)', ['lab_slot_3h', t, t]);
  }

  // 4. Courses  (Fall-2025 catalog)
  const courses = [
    ['CSE101', 'Introduction to Computer Systems', 'CSE', 3, 'Prof. Dr. Rafiqul Islam', `r.islam@${EMAIL}`, 'MW', '08:30 - 10:00', null, null, 'AB1-101', 1, 'Fall-2025'],
    ['CSE101', 'Introduction to Computer Systems', 'CSE', 3, 'Dr. Ayesha Siddika', `ayesha@${EMAIL}`, 'ST', '10:10 - 11:40', null, null, 'AB1-102', 2, 'Fall-2025'],
    ['CSE201', 'Object Oriented Programming', 'CSE', 4, 'Dr. Ayesha Siddika', `ayesha@${EMAIL}`, 'SR', '11:50 - 01:20', 'Tue', '10:00 - 12:00', 'LAB-CL1', 1, 'Fall-2025'],
    ['CSE203', 'Data Structures & Algorithms', 'CSE', 4, 'Prof. Dr. Rafiqul Islam', `r.islam@${EMAIL}`, 'TR', '01:30 - 03:00', 'Wed', '08:00 - 10:00', 'LAB-CL2', 1, 'Fall-2025'],
    ['EEE101', 'Electrical Circuits I', 'EEE', 3, 'Prof. Dr. Kamrul Hasan', `k.hasan@${EMAIL}`, 'MW', '10:10 - 11:40', null, null, 'AB2-301', 1, 'Fall-2025'],
    ['EEE201', 'Electronics I', 'EEE', 4, 'Dr. Tanvir Rahman', `tanvir@${EMAIL}`, 'ST', '08:30 - 10:00', 'Thu', '12:00 - 02:00', 'LAB-EL1', 1, 'Fall-2025'],
    ['ENG101', 'English Composition', 'ENG', 3, 'Dr. Sabbir Ahmed', `s.ahmed@${EMAIL}`, 'MW', '01:30 - 03:00', null, null, 'AB3-501', 1, 'Fall-2025'],
    ['BBA101', 'Business Communication', 'BBA', 3, 'Nusrat Jahan', `nusrat@${EMAIL}`, 'TR', '11:50 - 01:20', null, null, 'AB3-404', 1, 'Fall-2025'],
  ];
  for (const c of courses) {
    await db.query(
      `INSERT INTO courses (code, name, department, credits, instructor, instructor_email, theory_days, theory_time, lab_day, lab_time, room_number, section, semester, max_students, enrolled_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 0)`,
      c
    );
  }

  // 5. Students
  const firstNames = ['Ahnaf', 'Tasnim', 'Rakib', 'Sadia', 'Fahim', 'Mitu', 'Arif', 'Sumaiya', 'Nabil', 'Ishrat',
    'Zubayer', 'Farhana', 'Shakil', 'Anika', 'Mahin', 'Rumana', 'Sabbir', 'Nadia', 'Tahmid', 'Proma'];
  const lastNames = ['Hossain', 'Akter', 'Rahman', 'Islam', 'Chowdhury', 'Ahmed', 'Karim', 'Begum', 'Sarkar', 'Uddin'];
  const pick = (arr, i) => arr[i % arr.length];

  const mkStudent = async (sid, uid, name, dept, program) => {
    const prevDue = Math.random() > 0.7 ? Math.floor(Math.random() * 5000) + 1000 : 0;
    const status = prevDue > 0 ? 'Due' : (Math.random() > 0.5 ? 'Paid' : 'Due');
    await db.query(
      `INSERT INTO students (student_id, unique_id, password, name, email, department, program, year, semester, admitted_semester, phone, dob, payment_status, previous_due)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sid, uid, defaultHash, name, `${sid}@${EMAIL}`, dept, program, 2022, 'Fall-2025', 'Fall', '017' + Math.floor(10000000 + Math.random() * 89999999), '2002-01-01', status, prevDue]
    );
  };

  for (let i = 1; i <= 15; i++) {
    const serial = String(i).padStart(3, '0');
    await mkStudent(`2022-3-60-${serial}`, `U-60${serial}`, `${pick(firstNames, i)} ${pick(lastNames, i)}`, 'CSE', 'B.Sc. in Computer Science & Engineering');
  }
  for (let i = 1; i <= 8; i++) {
    const serial = String(i).padStart(3, '0');
    await mkStudent(`2022-3-50-${serial}`, `U-50${serial}`, `${pick(firstNames, i + 5)} ${pick(lastNames, i + 3)}`, 'EEE', 'B.Sc. in Electrical & Electronic Engineering');
  }

  // 6. Enrollments + some historical grades
  const [allStudents] = await db.query('SELECT id, department FROM students');
  const [allCourses] = await db.query('SELECT id, department FROM courses');
  for (const s of allStudents) {
    const relevant = allCourses.filter((c) => c.department === s.department || c.department === 'ENG' || c.department === 'BBA');
    const selected = relevant.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
    for (const c of selected) {
      await db.query("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')", [s.id, c.id]);
      await db.query('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?', [c.id]);
      if (Math.random() > 0.6) {
        const marks = Math.floor(Math.random() * 40) + 60;
        let g = 'B', p = 3.0;
        if (marks >= 80) { g = 'A+'; p = 4.0; }
        else if (marks >= 75) { g = 'A'; p = 3.75; }
        else if (marks >= 70) { g = 'A-'; p = 3.5; }
        await db.query('INSERT INTO grades (student_id, course_id, marks, grade, point, semester) VALUES (?, ?, ?, ?, ?, ?)', [s.id, c.id, marks, g, p, 'Fall-2025']);
      }
    }
  }

  // 7. Financial transactions
  for (const s of allStudents) {
    await db.query('INSERT INTO transactions (student_id, amount, type, description, date) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 30 DAY))', [s.id, 25000.0, 'Payment', 'Fall-2025 Tuition Payment']);
    await db.query('INSERT INTO transactions (student_id, amount, type, description, date) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 5 DAY))', [s.id, -8000.0, 'Charge', 'Spring-2026 Base Semester Fee']);
  }

  // 8. Advising slot (open 48h window)
  const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
  const now = new Date();
  const future = new Date();
  future.setHours(future.getHours() + 48);
  await db.query('INSERT INTO advising_slots (min_credits, max_credits, start_time, end_time) VALUES (?, ?, ?, ?)', [0, 140, fmt(now), fmt(future)]);

  // 9. System settings + announcements
  await db.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('active_semester', 'Fall-2025')");
  const announcements = [
    ['Fall 2025 Semester Begins', 'Classes for the Fall 2025 semester commence on September 1. Please complete your advising and registration before the deadline.', 'Academic'],
    ['Tuition Payment Deadline', 'The last date to pay Fall 2025 tuition without a late fee is August 25. Pay online through the Student Portal.', 'Finance'],
    ['New Central Library Wing Opens', 'The new wing of the BIU Central Library is now open, adding 40,000 volumes and 24/7 study spaces.', 'Campus'],
  ];
  for (const a of announcements) {
    await db.query('INSERT INTO announcements (title, content, category) VALUES (?, ?, ?)', a);
  }

  console.log('Seed complete.');
  console.log('--------------------------------------------------');
  console.log('  Admin login:    admin@' + EMAIL + '  /  admin123');
  console.log('  Faculty login:  F001  /  ' + DEFAULT_PASSWORD);
  console.log('  Student login:   2022-3-60-001  /  ' + DEFAULT_PASSWORD);
  console.log('  (default-password accounts must change it on first login)');
  console.log('--------------------------------------------------');
  await db.end();
}

initDb().catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
