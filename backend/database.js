const Database = require("better-sqlite3");
const db = new Database("san_university.db");

// --- 1. CREATE TABLES ---
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL,
    semester TEXT NOT NULL,
    gpa REAL DEFAULT 0.0,
    avatar TEXT DEFAULT 'https://ui-avatars.com/api/?name=Student&background=4F46E5&color=fff',
    advising_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
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

  CREATE TABLE IF NOT EXISTS student_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    status TEXT DEFAULT 'enrolled',
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT NOT NULL,
    semester TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
`);

// --- 2. SEED DATA ---
const studentCount = db.prepare("SELECT COUNT(*) as count FROM students").get();

if (studentCount.count === 0) {
  console.log(
    "Seeding database with expanded dataset (50 students + full catalog)..."
  );

  // A. Insert Admin
  db.prepare(
    `INSERT INTO admins (email, password, name) VALUES ('sabbir.hossain.28678@gmail.com', 'sabbir009', 'Admin Sabbir')`
  ).run();

  // B. Generate Expanded Course Catalog
  const baseCourses = [
    // Computer Science Core
    ["CSE101", "Intro to Computer Science", 3, "Dr. Ada Lovelace"],
    ["CSE102", "Programming Language I", 3, "Dr. Grace Hopper"],
    ["CSE203", "Data Structures", 3, "Dr. James Lee"],
    ["CSE204", "Algorithms", 3, "Dr. Alan Turing"],
    ["CSE305", "Database Systems", 3, "Dr. Edgar Codd"],
    ["CSE306", "Operating Systems", 3, "Dr. Linus Torvalds"],
    ["CSE307", "Computer Architecture", 3, "Dr. Von Neumann"],
    ["CSE360", "Software Engineering", 3, "Ms. Fouzie Risdin"],
    ["CSE401", "Artificial Intelligence", 3, "Dr. Sarah Wilson"],
    ["CSE405", "Computer Security", 4, "Dr. Anisur Rahman"],
    ["CSE405L", "Computer Security Lab", 4, "Dr. Anisur Rahman"],
    ["CSE412", "SE Project", 4, "Nishat Niloy"],
    ["CSE412L", "SE Lab", 4, "Nishat Niloy"],
    ["CSE420", "Compiler Design", 3, "Dr. Alfred Aho"],
    ["CSE421", "Computer Graphics", 3, "Dr. John Carmack"],
    ["CSE422", "Machine Learning", 3, "Dr. Andrew Ng"],
    ["CSE423", "Cloud Computing", 3, "Dr. Werner Vogels"],
    ["CSE495", "Thesis/Project", 3, "Ahmed Adnan"],
    ["CSE350", "Digital System Design", 4, "Nahid Hasan"],
    ["CSE350L", "DSD Lab", 4, "Nahid Hasan"],

    // Math & Science
    ["MAT101", "Calculus I", 3, "Dr. Euler"],
    ["MAT102", "Calculus II", 3, "Dr. Leibniz"],
    ["MAT203", "Linear Algebra", 3, "Dr. Gauss"],
    ["MAT301", "Numerical Methods", 3, "Dr. Emily Chen"],
    ["PHY101", "Physics I", 3, "Dr. Newton"],
    ["PHY102", "Physics II", 3, "Dr. Einstein"],
    ["CHE101", "Chemistry", 3, "Dr. Curie"],
    ["STA201", "Statistics and Probability", 3, "Dr. Bayes"],

    // Humanities & Business
    ["ENG101", "English Composition", 3, "Prof. Shakespeare"],
    ["ENG102", "Public Speaking", 3, "Prof. King"],
    ["HIS101", "World History", 3, "Prof. Herodotus"],
    ["PHI101", "Intro to Philosophy", 3, "Dr. Socrates"],
    ["PSY101", "Intro to Psychology", 3, "Dr. Freud"],
    ["SOC101", "Intro to Sociology", 3, "Dr. Durkheim"],
    ["ECO101", "Microeconomics", 3, "Dr. Keynes"],
    ["ECO102", "Macroeconomics", 3, "Dr. Smith"],
    ["ACT201", "Financial Accounting", 3, "Prof. Ledger"],
    ["MGT301", "Principles of Management", 3, "Dr. Drucker"],
    ["MKT301", "Principles of Marketing", 3, "Dr. Kotler"],
    ["BIO101", "Intro to Biology", 3, "Dr. Darwin"],
    ["ENV101", "Environmental Science", 3, "Dr. Goodall"],
  ];

  const insertCourse = db.prepare(`
    INSERT INTO courses (code, name, credits, instructor, instructor_email, schedule, room_number, section, semester) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert courses and track IDs
  const allCourseIds = [];
  const rooms = [
    "AB3-401",
    "SCI-202",
    "LB-101",
    "FUB-302",
    "221",
    "450",
    "630",
    "AB1-201",
  ];
  const times = [
    "MW 8:00-9:30",
    "MW 9:30-11:00",
    "MW 11:00-12:30",
    "MW 1:00-2:30",
    "MW 2:30-4:00",
    "ST 8:00-9:30",
    "ST 9:30-11:00",
    "ST 11:00-12:30",
    "ST 1:00-2:30",
    "ST 2:30-4:00",
  ];

  baseCourses.forEach((c, idx) => {
    // Pick random room/time
    const room = rooms[idx % rooms.length];
    const time = times[idx % times.length];

    const result = insertCourse.run(
      c[0],
      c[1],
      c[2],
      c[3],
      "faculty@san.edu",
      time,
      room,
      1,
      "Fall-2025"
    );
    allCourseIds.push({ id: result.lastInsertRowid, credits: c[2] });
  });

  // C. Semesters & Grades
  const semesters = [
    "Fall-2025",
    "Summer-2025",
    "Spring-2025",
    "Fall-2024",
    "Summer-2024",
    "Spring-2024",
    "Fall-2023",
    "Summer-2023",
    "Spring-2023",
    "Fall-2022",
    "Summer-2022",
    "Spring-2022",
  ];
  // Weighted grades to make GPAs realistic (more Bs and As than Ds)
  const gradesList = [
    "A",
    "A",
    "A-",
    "A-",
    "B+",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "D",
  ];

  // D. Insert Students with History
  const insertStudent = db.prepare(`
    INSERT INTO students (student_id, password, name, email, department, year, semester, gpa) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGrade = db.prepare(`
    INSERT INTO grades (student_id, course_id, grade, semester) VALUES (?, ?, ?, ?)
  `);

  const insertEnrollment = db.prepare(`
    INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, ?)
  `);

  // Create 50 Students
  for (let i = 1; i <= 50; i++) {
    const sId = `SAN2025${i.toString().padStart(3, "0")}`;
    // Distribute years: roughly equal distribution
    const year = (i % 4) + 1;

    const result = insertStudent.run(
      sId,
      "password123",
      `Student Name ${i}`,
      `s${i}@san.edu`,
      "CSE",
      year,
      "Fall-2025",
      0.0
    );
    const studentDbId = result.lastInsertRowid;

    // Calculate past semesters
    // Year 1: 0 past. Year 2: 3 past. Year 3: 6 past. Year 4: 9 past.
    const pastSemestersCount = (year - 1) * 3;

    // Shuffle courses for each student so they have different transcripts
    let shuffledCourses = [...allCourseIds].sort(() => 0.5 - Math.random());
    let courseIndex = 0;

    // 1. Insert History (Past Semesters)
    for (let s = 0; s < pastSemestersCount; s++) {
      const semName = semesters[s + 1]; // +1 to skip current Fall-2025

      let currentSemCredits = 0;
      // Min 9 credits, Max 15 credits
      while (currentSemCredits < 9 && courseIndex < shuffledCourses.length) {
        const course = shuffledCourses[courseIndex++];

        const grade = gradesList[Math.floor(Math.random() * gradesList.length)];
        insertGrade.run(studentDbId, course.id, grade, semName);
        insertEnrollment.run(studentDbId, course.id, "completed");

        currentSemCredits += course.credits;

        // Randomly decide to add another course if < 15 credits
        if (
          currentSemCredits < 15 &&
          Math.random() > 0.4 &&
          courseIndex < shuffledCourses.length
        ) {
          // continue loop
        } else if (currentSemCredits >= 9) {
          break; // Stop for this semester
        }
      }
    }

    // 2. Insert Current Semester (Fall-2025)
    // Current courses have no grades yet
    let currentCredits = 0;
    while (currentCredits < 9 && courseIndex < shuffledCourses.length) {
      const course = shuffledCourses[courseIndex++];
      insertEnrollment.run(studentDbId, course.id, "enrolled");
      currentCredits += course.credits;
    }
  }

  // E. Announcements
  db.prepare(
    `INSERT INTO announcements (title, content, category) VALUES ('Welcome Week', 'Welcome back to campus! Check your schedule.', 'General')`
  ).run();
  db.prepare(
    `INSERT INTO announcements (title, content, category) VALUES ('Exam Schedule', 'Midterm schedules are now live.', 'Academic')`
  ).run();
  db.prepare(
    `INSERT INTO announcements (title, content, category) VALUES ('Job Fair', 'Over 50 companies visiting next month.', 'Career')`
  ).run();

  console.log(
    "Database seeded successfully with 50 students, diverse courses, and full history."
  );
}

module.exports = db;
