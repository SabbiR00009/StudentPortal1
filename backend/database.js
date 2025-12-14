const Database = require("better-sqlite3");
const db = new Database("san_university.db");

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log("Initializing Database...");

try {
  // --- 1. DEFINE TABLES ---

  // Students
  db.prepare(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            unique_id TEXT UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            program TEXT,
            department TEXT NOT NULL,
            admitted_semester TEXT,
            year INTEGER NOT NULL,
            semester TEXT NOT NULL,
            dob TEXT, blood_group TEXT, nid TEXT, marital_status TEXT,
            present_address TEXT, permanent_address TEXT,
            advisor_name TEXT, advisor_email TEXT,
            payment_status TEXT DEFAULT 'Paid', -- 'Due', 'Paid', 'Refunded'
            previous_due REAL DEFAULT 500,       -- Carried over balance
            gpa REAL DEFAULT 0.0,
            avatar TEXT DEFAULT 'https://ui-avatars.com/api/?name=Student&background=4F46E5&color=fff',
            advising_status TEXT DEFAULT 'pending'
        )
    `).run();

  // Faculty
  db.prepare(`
        CREATE TABLE IF NOT EXISTS faculty (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_id TEXT UNIQUE NOT NULL,
            password TEXT DEFAULT '123456',
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            department TEXT,
            designation TEXT
        )
    `).run();

  // Admins
  db.prepare(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'admin'
        )
    `).run();

  // COURSES (FIXED: Added 'section' column & removed UNIQUE from 'code')
  db.prepare(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,          -- Code is NOT unique (allows multiple sections)
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            credits REAL NOT NULL,
            instructor TEXT NOT NULL,
            instructor_email TEXT NOT NULL,
            
            -- Schedule Columns
            theory_days TEXT NOT NULL,
            theory_time TEXT NOT NULL,
            lab_day TEXT,
            lab_time TEXT,
            
            room_number TEXT NOT NULL,
            section INTEGER NOT NULL,    -- NEW: Section Number
            semester TEXT NOT NULL,
            max_students INTEGER DEFAULT 40,
            enrolled_count INTEGER DEFAULT 0,

            -- Constraint: Prevent duplicate sections for same course/semester
            UNIQUE(code, section, semester)
        )
    `).run();

  // Enrollments
  db.prepare(`
        CREATE TABLE IF NOT EXISTS student_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            status TEXT DEFAULT 'enrolled',
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    `).run();

  // Grades
  db.prepare(`
        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            grade TEXT NOT NULL,
            semester TEXT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    `).run();

  // Announcements
  db.prepare(`
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

  // Advising Periods
  db.prepare(`
        CREATE TABLE IF NOT EXISTS advising_periods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            semester TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            is_active INTEGER DEFAULT 1
        )
    `).run();

  // Advising Requests
  db.prepare(`
        CREATE TABLE IF NOT EXISTS advising_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            semester TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    `).run();

  // Advising Slots
  db.prepare(`
        CREATE TABLE IF NOT EXISTS advising_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            min_credits INTEGER NOT NULL,
            max_credits INTEGER NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL
        )
    `).run();

  // Schedule Rules
  db.prepare(`
        CREATE TABLE IF NOT EXISTS schedule_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            value TEXT NOT NULL,
            display TEXT NOT NULL
        )
    `).run();

  console.log("Tables created successfully.");

} catch (err) {
  console.error("CRITICAL DATABASE ERROR during table creation:", err.message);
  process.exit(1);
}

// --- 2. SEED DATA ---
try {
  const adminCheck = db.prepare("SELECT COUNT(*) as count FROM admins").get();

  if (adminCheck.count === 0) {
    console.log("Seeding data...");

    // 1. Admin
    db.prepare("INSERT INTO admins (email, password, name) VALUES (?, ?, ?)").run('sabbir.hossain.28678@gmail.com', 'sabbir009', 'Super Admin');
    db.prepare("INSERT INTO admins (email, password, name) VALUES (?, ?, ?)").run('nura@gmail.com', '123456', 'Super Admin');

    // 2. Faculty
    const insertFaculty = db.prepare("INSERT INTO faculty (faculty_id, password, name, email, department, designation) VALUES (?, ?, ?, ?, ?, ?)");
    insertFaculty.run("F001", "123456", "Dr. Ada Lovelace", "ada@san.edu", "CSE", "Professor");
    insertFaculty.run("F002", "123456", "Dr. Tesla", "tesla@san.edu", "EEE", "Professor");
    insertFaculty.run("F003", "123456", "Prof. Ledger", "ledger@san.edu", "BBA", "Lecturer");

    // 3. Schedule Rules
    const insertRule = db.prepare("INSERT INTO schedule_rules (category, value, display) VALUES (?, ?, ?)");
    ["MW", "ST", "SR", "TR"].forEach(d => insertRule.run("theory_day", d, d));
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].forEach(d => insertRule.run("lab_day", d.substring(0, 3), d));

    const theorySlots = ["08:30 - 10:00", "10:10 - 11:40", "11:50 - 01:20", "01:30 - 03:00", "03:10 - 04:40", "04:50 - 06:20"];
    theorySlots.forEach((t, i) => insertRule.run("theory_slot", t, `Slot ${i + 1}: ${t}`));

    const lab2h = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 02:00", "02:00 - 04:00"];
    lab2h.forEach(t => insertRule.run("lab_slot_2h", t, t));

    const lab3h = ["08:00 - 11:00", "11:00 - 02:00", "02:00 - 05:00"];
    lab3h.forEach(t => insertRule.run("lab_slot_3h", t, t));

    // 4. Courses (With Sections)
    const insertCourse = db.prepare(`
            INSERT INTO courses (code, name, department, credits, instructor, instructor_email, theory_days, theory_time, lab_day, lab_time, room_number, section, semester, max_students, enrolled_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 0)
        `);

    // CSE101 Section 1
    insertCourse.run("CSE101", "Intro to CS", "CSE", 3, "Dr. Ada Lovelace", "ada@san.edu", "MW", "08:30 - 10:00", null, null, "AB1-101", 1, "Fall-2025");

    // CSE101 Section 2 (Same Code, Different Section & Time)
    insertCourse.run("CSE101", "Intro to CS", "CSE", 3, "Dr. Ada Lovelace", "ada@san.edu", "ST", "10:10 - 11:40", null, null, "AB1-102", 2, "Fall-2025");

    // 5. Students
    const insertStudent = db.prepare(`
            INSERT INTO students (student_id, unique_id, password, name, email, department, program, year, semester, admitted_semester, phone, dob) 
            VALUES (?, ?, '123456', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    for (let i = 1; i <= 30; i++) {
      const serial = String(i).padStart(3, "0");
      const sid = `2022-3-60-00${i}`;
      insertStudent.run(
        sid, `U-100${i}`, `Student ${i}`, `${sid}@san.edu`,
        "CSE", "B.Sc in CSE", 2022, "Fall-2025", "Fall",
        "01700000000", "2002-01-01"
      );
    }
    for (let i = 1; i <= 20; i++) {
      const serial = String(i).padStart(3, "0");
      const sid = `2022-3-50-00${i}`;
      insertStudent.run(
        sid, `U-100${i}`, `Student ${i}`, `${sid}@san.edu`,
        "CSE", "B.Sc in EEE", 2022, "Fall-2025", "Fall",
        "01700000000", "2002-01-01"
      );
    }


    // 6. Advising Slot
    const now = new Date();
    const future = new Date();
    future.setHours(future.getHours() + 48);
    db.prepare("INSERT INTO advising_slots (min_credits, max_credits, start_time, end_time) VALUES (?, ?, ?, ?)").run(0, 200, now.toISOString(), future.toISOString());

    console.log("Database seeded successfully.");
  }
} catch (err) {
  console.error("CRITICAL SEEDING ERROR:", err.message);
}
module.exports = db;