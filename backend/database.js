const Database = require("better-sqlite3");
const db = new Database("san_university.db");

// --- 1. CREATE TABLES ---
db.exec(`
  -- STUDENTS (Enhanced for Profile & Admin Management)
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
    semester TEXT NOT NULL, -- Current Enrolled Semester
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

  -- FACULTY (New Table for Admin Control)
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

  -- COURSES
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
`);

// --- 2. SEED DATA ---
const studentCount = db.prepare("SELECT COUNT(*) as count FROM students").get();

if (studentCount.count === 0) {
  console.log(
    "Seeding database with Admin, Extensive Faculty, and Course Catalog..."
  );

  // A. Insert Admin
  db.prepare(
    `INSERT INTO admins (email, password, name) VALUES ('sabbir.hossain.28678@gmail.com', 'sabbir009', 'Super Admin')`
  ).run();

  // B. Insert Faculty (Expanded List)
  const facultyList = [
    // CSE
    ["F001", "Dr. Ada Lovelace", "ada@san.edu", "CSE", "Professor"],
    ["F002", "Dr. Alan Turing", "alan@san.edu", "CSE", "Professor"],
    ["F003", "Ms. Fouzie Risdin", "fouzie@san.edu", "CSE", "Senior Lecturer"],
    ["F004", "Dr. James Lee", "james@san.edu", "CSE", "Associate Professor"],
    ["F005", "Dr. Sarah Wilson", "sarah@san.edu", "CSE", "Assistant Professor"],
    ["F006", "Dr. Anisur Rahman", "anis@san.edu", "CSE", "Professor"],
    ["F007", "Mr. Nishat Niloy", "nishat@san.edu", "CSE", "Lecturer"],
    ["F008", "Dr. Grace Hopper", "grace@san.edu", "CSE", "Professor"],
    [
      "F009",
      "Dr. Linus Torvalds",
      "linus@san.edu",
      "CSE",
      "Assistant Professor",
    ],
    ["F010", "Mr. Nahid Hasan", "nahid@san.edu", "CSE", "Lecturer"],
    [
      "F011",
      "Prof. Ahmed Adnan",
      "adnan@san.edu",
      "CSE",
      "Associate Professor",
    ],
    ["F012", "Dr. Robert Brown", "robert@san.edu", "CSE", "Professor"],

    // EEE / Engineering
    ["F013", "Dr. Tesla", "tesla@san.edu", "EEE", "Professor"],
    ["F014", "Dr. Edison", "edison@san.edu", "EEE", "Associate Professor"],

    // Math & Sciences
    ["F015", "Dr. Euler", "euler@san.edu", "MAT", "Professor"],
    ["F016", "Dr. Gauss", "gauss@san.edu", "MAT", "Assistant Professor"],
    ["F017", "Dr. Newton", "newton@san.edu", "PHY", "Professor"],
    ["F018", "Dr. Einstein", "einstein@san.edu", "PHY", "Professor"],
    ["F019", "Dr. Curie", "curie@san.edu", "CHE", "Associate Professor"],
    ["F020", "Dr. Darwin", "darwin@san.edu", "BIO", "Professor"],

    // Business & Humanities
    ["F021", "Dr. Keynes", "eco@san.edu", "ECO", "Lecturer"],
    ["F022", "Dr. Smith", "smith@san.edu", "ECO", "Professor"],
    ["F023", "Prof. Shakespeare", "shake@san.edu", "ENG", "Professor"],
    ["F024", "Prof. King", "king@san.edu", "ENG", "Lecturer"],
    ["F025", "Dr. Freud", "freud@san.edu", "PSY", "Professor"],
    ["F026", "Prof. Ledger", "ledger@san.edu", "ACT", "Senior Lecturer"],
    ["F027", "Dr. Drucker", "drucker@san.edu", "MGT", "Professor"],
  ];

  const insertFaculty = db.prepare(
    "INSERT INTO faculty (faculty_id, name, email, department, designation) VALUES (?, ?, ?, ?, ?)"
  );
  facultyList.forEach((f) => insertFaculty.run(f[0], f[1], f[2], f[3], f[4]));

  // C. Insert Courses (Expanded Catalog)
  // Helper to find faculty email by name for realism
  const getFacEmail = (name) => {
    const found = facultyList.find((f) => f[1].includes(name));
    return found ? found[2] : "faculty@san.edu";
  };

  const baseCourses = [
    // CSE Core
    ["CSE101", "Intro to Computer Science", 3, "Dr. Ada Lovelace"],
    ["CSE102", "Programming Language I", 3, "Dr. Grace Hopper"],
    ["CSE103", "Discrete Mathematics", 3, "Dr. Euler"],
    ["CSE201", "Object Oriented Programming", 3, "Dr. James Lee"],
    ["CSE203", "Data Structures", 3, "Dr. James Lee"],
    ["CSE204", "Algorithms", 3, "Dr. Alan Turing"],
    ["CSE205", "Digital Logic Design", 3, "Mr. Nahid Hasan"],
    ["CSE205L", "Digital Logic Design Lab", 1, "Mr. Nahid Hasan"],
    ["CSE301", "Database Systems", 3, "Dr. Robert Brown"],
    ["CSE302", "Database Systems Lab", 1, "Dr. Robert Brown"],
    ["CSE303", "Operating Systems", 3, "Dr. Linus Torvalds"],
    ["CSE304", "Computer Architecture", 3, "Dr. Alan Turing"],
    ["CSE305", "Software Engineering", 3, "Ms. Fouzie Risdin"],
    ["CSE306", "Computer Networks", 3, "Prof. Ahmed Adnan"],
    ["CSE360", "Web Programming", 3, "Ms. Fouzie Risdin"],
    ["CSE401", "Artificial Intelligence", 3, "Dr. Sarah Wilson"],
    ["CSE402", "Machine Learning", 3, "Dr. Sarah Wilson"],
    ["CSE405", "Computer Security", 3, "Dr. Anisur Rahman"],
    ["CSE405L", "Computer Security Lab", 1, "Dr. Anisur Rahman"],
    ["CSE412", "Software Project Management", 3, "Mr. Nishat Niloy"],
    ["CSE420", "Compiler Design", 3, "Dr. Ada Lovelace"],
    ["CSE421", "Computer Graphics", 3, "Dr. Alan Turing"],
    ["CSE425", "Mobile Application Dev", 3, "Prof. Ahmed Adnan"],
    ["CSE499", "Senior Design Project", 4, "Dr. Anisur Rahman"],

    // Math & Science
    ["MAT101", "Calculus I", 3, "Dr. Euler"],
    ["MAT102", "Calculus II", 3, "Dr. Leibniz"], // Assuming generic if not in list
    ["MAT201", "Linear Algebra", 3, "Dr. Gauss"],
    ["MAT202", "Differential Equations", 3, "Dr. Euler"],
    ["PHY101", "Physics I", 3, "Dr. Newton"],
    ["PHY102", "Physics II", 3, "Dr. Einstein"],
    ["CHE101", "Chemistry", 3, "Dr. Curie"],
    ["BIO101", "Biology", 3, "Dr. Darwin"],
    ["STA201", "Statistics", 3, "Dr. Gauss"],

    // Electrical Engineering
    ["EEE101", "Electrical Circuits I", 3, "Dr. Tesla"],
    ["EEE102", "Electrical Circuits II", 3, "Dr. Edison"],
    ["EEE201", "Electronics I", 3, "Dr. Tesla"],

    // Business & Humanities
    ["ENG101", "English Composition", 3, "Prof. Shakespeare"],
    ["ENG102", "Public Speaking", 3, "Prof. King"],
    ["HIS101", "World History", 3, "Prof. Herodotus"], // Generic
    ["PHI101", "Intro to Philosophy", 3, "Dr. Socrates"], // Generic
    ["PSY101", "Intro to Psychology", 3, "Dr. Freud"],
    ["ECO101", "Microeconomics", 3, "Dr. Keynes"],
    ["ECO102", "Macroeconomics", 3, "Dr. Smith"],
    ["ACT201", "Financial Accounting", 3, "Prof. Ledger"],
    ["MGT301", "Principles of Management", 3, "Dr. Drucker"],
    ["MKT301", "Principles of Marketing", 3, "Dr. Kotler"], // Generic
  ];

  const insertCourse = db.prepare(`
    INSERT INTO courses (code, name, credits, instructor, instructor_email, schedule, room_number, section, semester) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert courses
  const allCourseIds = [];
  const rooms = [
    "AB1-201",
    "AB1-305",
    "AB2-401",
    "AB2-505",
    "SCI-101",
    "SCI-202",
    "LB-101",
    "FUB-302",
  ];
  const times = [
    "MW 08:00-09:30",
    "MW 09:40-11:10",
    "MW 11:20-12:50",
    "MW 13:00-14:30",
    "MW 14:40-16:10",
    "ST 08:00-09:30",
    "ST 09:40-11:10",
    "ST 11:20-12:50",
    "ST 13:00-14:30",
    "ST 14:40-16:10",
  ];

  baseCourses.forEach((c, idx) => {
    const room = rooms[idx % rooms.length];
    const time = times[idx % times.length];
    const email = getFacEmail(c[3]);

    const result = insertCourse.run(
      c[0],
      c[1],
      c[2],
      c[3],
      email,
      time,
      room,
      1,
      "Fall-2025"
    );
    allCourseIds.push({ id: result.lastInsertRowid, credits: c[2] });
  });

  // D. Semesters & Grades
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
  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const insertStudent = db.prepare(`
    INSERT INTO students (
      student_id, unique_id, password, name, email, phone, program, department, 
      admitted_semester, year, semester, dob, blood_group, nid, marital_status, 
      present_address, permanent_address, advisor_name, advisor_email, gpa
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGrade = db.prepare(
    `INSERT INTO grades (student_id, course_id, grade, semester) VALUES (?, ?, ?, ?)`
  );
  const insertEnrollment = db.prepare(
    `INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, ?)`
  );

  // Create 50 Students
  for (let i = 1; i <= 50; i++) {
    const sId = `SAN2025${i.toString().padStart(3, "0")}`;
    const uniqueId = `U-${100000 + i}`;
    const year = (i % 4) + 1;

    let admittedIndex = (year - 1) * 3 + 2;
    if (admittedIndex >= semesters.length) admittedIndex = semesters.length - 1;
    const admittedSem = semesters[admittedIndex];

    // Pick random Advisor from Faculty List
    const advisor = facultyList[Math.floor(Math.random() * facultyList.length)];

    const result = insertStudent.run(
      sId,
      uniqueId,
      "password123",
      `Student Name ${i}`,
      `s${i}@san.edu`,
      `017000000${i}`,
      "B.Sc. in Computer Science",
      "CSE",
      admittedSem,
      year,
      "Fall-2025",
      "2001-05-15",
      bloodGroups[i % 8],
      `1234567890${i}`,
      "Single",
      "House 123, Road 5, Dhaka",
      "Village Home, District, Division",
      advisor[1],
      advisor[2],
      0.0
    );
    const studentDbId = result.lastInsertRowid;

    // Calculate past semesters
    const pastSemestersCount = (year - 1) * 3;

    // Shuffle courses
    let shuffledCourses = [...allCourseIds].sort(() => 0.5 - Math.random());
    let courseIndex = 0;

    // 1. Insert History (Past Semesters)
    for (let s = 1; s <= pastSemestersCount; s++) {
      const semName = semesters[s];
      let currentSemCredits = 0;

      while (currentSemCredits < 9 && courseIndex < shuffledCourses.length) {
        const course = shuffledCourses[courseIndex++];
        const grade = gradesList[Math.floor(Math.random() * gradesList.length)];

        insertGrade.run(studentDbId, course.id, grade, semName);
        insertEnrollment.run(studentDbId, course.id, "completed");
        currentSemCredits += course.credits;

        if (
          currentSemCredits < 15 &&
          Math.random() > 0.4 &&
          courseIndex < shuffledCourses.length
        ) {
          // continue
        } else if (currentSemCredits >= 9) {
          break;
        }
      }
    }

    // 2. Insert Current Semester (Fall-2025)
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
    "Database seeded successfully with 40+ courses, 50 students, and faculty."
  );
}

module.exports = db;
