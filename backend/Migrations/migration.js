const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function runMigration() {
  console.log("Connecting to MySQL...");
  
  // First connect without database selected to create the database if it doesn't exist
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const dbName = process.env.DB_NAME || 'student_portal';
  
  console.log(`Creating database ${dbName} if not exists...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);

  console.log("Creating tables...");

  // Students
  await connection.query(`
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
        dob VARCHAR(50), 
        blood_group VARCHAR(10), 
        nid VARCHAR(50), 
        marital_status VARCHAR(50),
        present_address TEXT, 
        permanent_address TEXT,
        advisor_name VARCHAR(255), 
        advisor_email VARCHAR(255),
        payment_status VARCHAR(50) DEFAULT 'Paid',
        previous_due DECIMAL(10, 2) DEFAULT 500,
        gpa DECIMAL(3, 2) DEFAULT 0.0,
        avatar TEXT,
        advising_status VARCHAR(50) DEFAULT 'pending'
    )
  `);

  // Faculty
  await connection.query(`
    CREATE TABLE IF NOT EXISTS faculty (
        id INT AUTO_INCREMENT PRIMARY KEY,
        faculty_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) DEFAULT '123456',
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        designation VARCHAR(100)
    )
  `);

  // Admins
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin'
    )
  `);

  // Courses
  await connection.query(`
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
    )
  `);

  // Enrollments
  await connection.query(`
    CREATE TABLE IF NOT EXISTS student_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'enrolled',
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Grades
  await connection.query(`
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
    )
  `);

  // Announcements
  await connection.query(`
    CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Advising Periods
  await connection.query(`
    CREATE TABLE IF NOT EXISTS advising_periods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        semester VARCHAR(100) NOT NULL,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        is_active TINYINT(1) DEFAULT 1
    )
  `);

  // Advising Requests
  await connection.query(`
    CREATE TABLE IF NOT EXISTS advising_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        semester VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Advising Slots
  await connection.query(`
    CREATE TABLE IF NOT EXISTS advising_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        min_credits INT NOT NULL,
        max_credits INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL
    )
  `);

  // Schedule Rules
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        value VARCHAR(100) NOT NULL,
        display VARCHAR(255) NOT NULL
    )
  `);

  console.log("Tables created successfully.");

  // Check if admin exists to avoid re-seeding
  const [adminRows] = await connection.query("SELECT COUNT(*) as count FROM admins");
  if (adminRows[0].count === 0) {
    console.log("Seeding vivid data...");

    // 1. Admins
    await connection.query("INSERT INTO admins (email, password, name) VALUES ('sabbir.hossain.28678@gmail.com', 'sabbir009', 'Sabbir Hossain')");
    await connection.query("INSERT INTO admins (email, password, name) VALUES ('nura@gmail.com', '123456', 'Nura Admin')");

    // 2. Faculties
    const faculties = [
      ["F001", "Dr. Ada Lovelace", "ada@san.edu", "CSE", "Professor"],
      ["F002", "Dr. Alan Turing", "alan@san.edu", "CSE", "Associate Professor"],
      ["F003", "Dr. Tesla", "tesla@san.edu", "EEE", "Professor"],
      ["F004", "Prof. Keynes", "keynes@san.edu", "BBA", "Lecturer"],
      ["F005", "Dr. Shakespeare", "will@san.edu", "ENG", "Assistant Professor"],
      ["F006", "Dr. Einstein", "albert@san.edu", "EEE", "Senior Lecturer"]
    ];
    for (const f of faculties) {
      await connection.query("INSERT INTO faculty (faculty_id, password, name, email, department, designation) VALUES (?, ?, ?, ?, ?, ?)", [f[0], "123456", f[1], f[2], f[3], f[4]]);
    }

    // 3. Schedule Rules
    const tDays = ["MW", "ST", "SR", "TR"];
    for (const d of tDays) await connection.query("INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)", ["theory_day", d, d]);
    
    const lDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    for (const d of lDays) await connection.query("INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)", ["lab_day", d.substring(0, 3), d]);

    const theorySlots = ["08:30 - 10:00", "10:10 - 11:40", "11:50 - 01:20", "01:30 - 03:00", "03:10 - 04:40"];
    for (let i = 0; i < theorySlots.length; i++) await connection.query("INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)", ["theory_slot", theorySlots[i], `Slot ${i + 1}: ${theorySlots[i]}`]);

    const lab2h = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 02:00", "02:00 - 04:00"];
    for (const t of lab2h) await connection.query("INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)", ["lab_slot_2h", t, t]);
    
    const lab3h = ["08:00 - 11:00", "11:00 - 02:00", "02:00 - 05:00"];
    for (const t of lab3h) await connection.query("INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)", ["lab_slot_3h", t, t]);

    // 4. Courses
    const coursesData = [
      ["CSE101", "Intro to Computer Systems", "CSE", 3, "Dr. Ada Lovelace", "ada@san.edu", "MW", "08:30 - 10:00", null, null, "AB1-101", 1, "Fall-2025"],
      ["CSE101", "Intro to Computer Systems", "CSE", 3, "Dr. Alan Turing", "alan@san.edu", "ST", "10:10 - 11:40", null, null, "AB1-102", 2, "Fall-2025"],
      ["CSE201", "Object Oriented Programming", "CSE", 4, "Dr. Alan Turing", "alan@san.edu", "SR", "11:50 - 01:20", "Tue", "10:00 - 12:00", "LAB-CL1", 1, "Fall-2025"],
      ["CSE203", "Data Structures", "CSE", 4, "Dr. Ada Lovelace", "ada@san.edu", "TR", "01:30 - 03:00", "Wed", "08:00 - 10:00", "LAB-CL2", 1, "Fall-2025"],
      ["EEE101", "Electrical Circuits I", "EEE", 3, "Dr. Tesla", "tesla@san.edu", "MW", "10:10 - 11:40", null, null, "AB2-301", 1, "Fall-2025"],
      ["EEE201", "Electronics I", "EEE", 4, "Dr. Einstein", "albert@san.edu", "ST", "08:30 - 10:00", "Thu", "12:00 - 02:00", "LAB-EL1", 1, "Fall-2025"],
      ["ENG101", "English Composition", "ENG", 3, "Dr. Shakespeare", "will@san.edu", "MW", "01:30 - 03:00", null, null, "AB3-501", 1, "Fall-2025"],
      ["BBA101", "Business Communication", "BBA", 3, "Prof. Keynes", "keynes@san.edu", "TR", "11:50 - 01:20", null, null, "AB3-404", 1, "Fall-2025"]
    ];

    for (const c of coursesData) {
      await connection.query(`
        INSERT INTO courses (code, name, department, credits, instructor, instructor_email, theory_days, theory_time, lab_day, lab_time, room_number, section, semester, max_students, enrolled_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 0)
      `, c);
    }

    // 5. Students
    // 10 CSE Students for brevity
    for (let i = 1; i <= 10; i++) {
      const serial = String(i).padStart(3, "0");
      const sid = `2022-3-60-00${i}`;
      const prevDue = Math.random() > 0.7 ? Math.floor(Math.random() * 5000) + 1000 : 0;
      const status = prevDue > 0 ? "Due" : (Math.random() > 0.8 ? "Paid" : "Due");

      await connection.query(`
        INSERT INTO students (student_id, unique_id, password, name, email, department, program, year, semester, admitted_semester, phone, dob, payment_status, previous_due) 
        VALUES (?, ?, '123456', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [sid, `U-60${serial}`, `CSE Student ${i}`, `${sid}@san.edu`, "CSE", "B.Sc in CSE", 2022, "Fall-2025", "Fall", "01700000000", "2002-01-01", status, prevDue]);
    }

    // 5 EEE Students
    for (let i = 1; i <= 5; i++) {
      const serial = String(i).padStart(3, "0");
      const sid = `2022-3-50-00${i}`;
      await connection.query(`
        INSERT INTO students (student_id, unique_id, password, name, email, department, program, year, semester, admitted_semester, phone, dob, payment_status, previous_due) 
        VALUES (?, ?, '123456', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [sid, `U-50${serial}`, `EEE Student ${i}`, `${sid}@san.edu`, "EEE", "B.Sc in EEE", 2022, "Fall-2025", "Fall", "01700000000", "2002-01-01", "Due", 0]);
    }

    // 6. Enrollments
    const [allStudents] = await connection.query("SELECT id, department FROM students");
    const [allCourses] = await connection.query("SELECT id, department, credits FROM courses");

    for (const s of allStudents) {
      const relevantCourses = allCourses.filter(c => c.department === s.department || c.department === "ENG" || c.department === "BBA");
      const shuffled = relevantCourses.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.floor(Math.random() * 3) + 2);

      for (const c of selected) {
        await connection.query("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')", [s.id, c.id]);
        await connection.query("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?", [c.id]);

        if (Math.random() > 0.7) {
          const marks = Math.floor(Math.random() * 40) + 60; // 60-100
          let g = "B", p = 3.0;
          if (marks >= 80) { g = "A+"; p = 4.0; }
          else if (marks >= 75) { g = "A"; p = 3.75; }
          else if (marks >= 70) { g = "A-"; p = 3.50; }

          await connection.query("INSERT INTO grades (student_id, course_id, marks, grade, point, semester) VALUES (?, ?, ?, ?, ?, ?)", [s.id, c.id, marks, g, p, "Fall-2025"]);
        }
      }
    }

    // 7. Advising Slot
    const now = new Date(); 
    const future = new Date(); 
    future.setHours(future.getHours() + 48);
    // MySQL expects YYYY-MM-DD HH:MM:SS format
    const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
    await connection.query("INSERT INTO advising_slots (min_credits, max_credits, start_time, end_time) VALUES (?, ?, ?, ?)", [0, 140, formatDateTime(now), formatDateTime(future)]);

    console.log("Database seeded successfully with vivid data.");
  }
  
  await connection.end();
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
