const Database = require("better-sqlite3");
const db = new Database("san_university.db");

// --- 1. CREATE TABLES ---
db.exec(`
  -- STUDENTS (Enhanced for Profile & Admin Management)
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL, -- Format: 2025-3-60-001
    unique_id TEXT UNIQUE, 
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    program TEXT,
    department TEXT NOT NULL, -- CSE, EEE, etc.
    admitted_semester TEXT, -- Spring, Summer, Fall
    year INTEGER NOT NULL, -- Admitted Year
    semester TEXT NOT NULL, -- Current Enrolled Semester (e.g. Fall-2025)
    dob TEXT,
    blood_group TEXT,
    nid TEXT,
    marital_status TEXT,
    present_address TEXT,
    permanent_address TEXT,
    advisor_name TEXT,
    advisor_email TEXT,
    gpa REAL DEFAULT 0.0,
    avatar TEXT DEFAULT 'https://ui-avatars.com/api/?name=Student&background=4F46E5&color=fff',
    advising_status TEXT DEFAULT 'pending'
  );

  -- FACULTY
  CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT,
    designation TEXT
  );

  -- ADMINS
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
  );

  -- COURSES (Added Department Column)
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL, -- CSE, EEE, BBA, etc.
    credits INTEGER NOT NULL,
    instructor TEXT NOT NULL,
    instructor_email TEXT NOT NULL,
    schedule TEXT NOT NULL,
    room_number TEXT NOT NULL,
    section INTEGER NOT NULL,
    semester TEXT NOT NULL,
    max_students INTEGER DEFAULT 40,
    enrolled_count INTEGER DEFAULT 0
  );

  -- ENROLLMENTS
  CREATE TABLE IF NOT EXISTS student_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    status TEXT DEFAULT 'enrolled',
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  -- GRADES
  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT NOT NULL,
    semester TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  -- ANNOUNCEMENTS
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ADVISING PERIODS & REQUESTS
  CREATE TABLE IF NOT EXISTS advising_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semester TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS advising_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  -- ADVISING TIME SLOTS (Gatekeeper)
  CREATE TABLE IF NOT EXISTS advising_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    min_credits INTEGER NOT NULL,
    max_credits INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL
  );
`);

// --- 2. SEED DATA ---
const studentCount = db.prepare("SELECT COUNT(*) as count FROM students").get();

if (studentCount.count === 0) {
  console.log("Seeding database with Departmental Logic & ID Structure...");

  // A. Insert Admin
  db.prepare(
    `INSERT INTO admins (email, password, name) VALUES ('sabbir.hossain.28678@gmail.com', 'sabbir009', 'Super Admin')`
  ).run();

  // B. Insert Faculty
  const facultyList = [
    ["F001", "Dr. Ada Lovelace", "ada@san.edu", "CSE", "Professor"],
    ["F002", "Dr. Tesla", "tesla@san.edu", "EEE", "Professor"],
    ["F003", "Prof. Ledger", "ledger@san.edu", "BBA", "Lecturer"],
  ];
  const insertFaculty = db.prepare(
    "INSERT INTO faculty (faculty_id, name, email, department, designation) VALUES (?, ?, ?, ?, ?)"
  );
  facultyList.forEach((f) => insertFaculty.run(f[0], f[1], f[2], f[3], f[4]));

  // C. Insert Courses (Department Wise)
  const insertCourse = db.prepare(`
    INSERT INTO courses (code, name, department, credits, instructor, instructor_email, schedule, room_number, section, semester, max_students, enrolled_count) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 0)
  `);

  const courses = [
    // CSE (Code 60)
    ["CSE101", "Intro to Computer Science", "CSE", 3, "Dr. Ada Lovelace"],
    ["CSE201", "Object Oriented Programming", "CSE", 3, "Dr. Grace Hopper"],
    ["CSE301", "Database Systems", "CSE", 3, "Dr. Robert Brown"],
    // EEE (Code 50)
    ["EEE101", "Electrical Circuits I", "EEE", 3, "Dr. Tesla"],
    ["EEE201", "Electronics I", "EEE", 3, "Dr. Edison"],
    // BBA (Code 40)
    ["ACT201", "Financial Accounting", "BBA", 3, "Prof. Ledger"],
    ["MGT301", "Principles of Management", "BBA", 3, "Dr. Drucker"],
    // ENG (Code 20)
    ["ENG101", "English Composition", "ENG", 3, "Prof. Shakespeare"],
  ];

  const allCourseIds = [];
  courses.forEach((c) => {
    const res = insertCourse.run(
      c[0],
      c[1],
      c[2],
      c[3],
      c[4],
      "faculty@san.edu",
      "MW 10:00",
      "AB1-101",
      1,
      "Fall-2025"
    );
    allCourseIds.push({ id: res.lastInsertRowid, credits: c[3] });
  });

  // D. Students with Specific ID Structure (Year-Sem-Dept-Serial)
  const insertStudent = db.prepare(`
    INSERT INTO students (
      student_id, unique_id, password, name, email, department, 
      program, year, semester, admitted_semester, phone, dob
    ) VALUES (?, ?, 'password123', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const generateId = (year, semName, deptName, serial) => {
    // Spring=1, Summer=2, Fall=3
    const sCode = semName === "Spring" ? 1 : semName === "Summer" ? 2 : 3;
    // CSE=60, EEE=50, BBA=40, ACT=30, ENG=20
    const dMap = { CSE: 60, EEE: 50, BBA: 40, ENG: 20, ACT: 30 };
    const dCode = dMap[deptName] || 99;
    return `${year}-${sCode}-${dCode}-${String(serial).padStart(3, "0")}`;
  };

  // Seed 10 CSE Students (Admitted Fall 2022) -> 2022-3-60-00X
  for (let i = 1; i <= 10; i++) {
    const id = generateId(2022, "Fall", "CSE", i);
    insertStudent.run(
      id,
      `U-${10000 + i}`,
      `CSE Student ${i}`,
      `cse${i}@san.edu`,
      "CSE",
      "B.Sc in CSE",
      2022,
      "Fall-2025",
      "Fall",
      "01700000000",
      "2002-01-01"
    );
  }

  // Seed 5 EEE Students (Admitted Spring 2023) -> 2023-1-50-00X
  for (let i = 1; i <= 5; i++) {
    const id = generateId(2023, "Spring", "EEE", i);
    insertStudent.run(
      id,
      `U-${20000 + i}`,
      `EEE Student ${i}`,
      `eee${i}@san.edu`,
      "EEE",
      "B.Sc in EEE",
      2023,
      "Fall-2025",
      "Spring",
      "01800000000",
      "2003-01-01"
    );
  }

  // E. Create Default Advising Slot (Active Now for testing)
  // This ensures you are not locked out immediately upon testing.
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(now.getHours() + 48); // Valid for 48 hours

  db.prepare(
    `INSERT INTO advising_slots (min_credits, max_credits, start_time, end_time) VALUES (?, ?, ?, ?)`
  ).run(0, 200, now.toISOString(), endTime.toISOString());

  // F. Announcements
  db.prepare(
    `INSERT INTO announcements (title, content, category) VALUES ('Advising Open', 'Advising for Fall 2025 is now open based on credit slots.', 'Academic')`
  ).run();

  console.log("Database seeded successfully.");
}

module.exports = db;