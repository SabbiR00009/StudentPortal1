const Database = require("better-sqlite3");
const db = new Database("san_university.db");

// --- 1. CREATE TABLES ---
db.exec(`
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
    semester TEXT NOT NULL, -- Current Semester
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
  console.log("Seeding database with dynamic semesters and unique advisors...");

  // A. Insert Admin
  db.prepare(
    `INSERT INTO admins (email, password, name) VALUES ('sabbir.hossain.28678@gmail.com', 'sabbir009', 'Admin Sabbir')`
  ).run();

  // B. Generate Course Catalog
  const baseCourses = [
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
    ["MAT101", "Calculus I", 3, "Dr. Euler"],
    ["MAT102", "Calculus II", 3, "Dr. Leibniz"],
    ["MAT203", "Linear Algebra", 3, "Dr. Gauss"],
    ["MAT301", "Numerical Methods", 3, "Dr. Emily Chen"],
    ["PHY101", "Physics I", 3, "Dr. Newton"],
    ["PHY102", "Physics II", 3, "Dr. Einstein"],
    ["CHE101", "Chemistry", 3, "Dr. Curie"],
    ["STA201", "Statistics and Probability", 3, "Dr. Bayes"],
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

  // C. Dynamic Semesters & Advisors

  // Helper to generate semester list from Start Year to Current
  function generateSemesters(startYear, endYear) {
    const seasons = ["Spring", "Summer", "Fall"];
    let sems = [];
    for (let y = startYear; y <= endYear; y++) {
      seasons.forEach((s) => sems.push(`${s}-${y}`));
    }
    return sems;
  }
  const allSemesters = generateSemesters(2021, 2025); // Covers historic range

  // List of Advisors
  const advisors = [
    { name: "Dr. Anisur Rahman", email: "anis@san.edu" },
    { name: "Ms. Fouzie Risdin", email: "fouzie@san.edu" },
    { name: "Dr. James Lee", email: "james@san.edu" },
    { name: "Dr. Sarah Wilson", email: "sarah@san.edu" },
    { name: "Dr. Emily Chen", email: "emily@san.edu" },
    { name: "Prof. Ahmed Adnan", email: "adnan@san.edu" },
    { name: "Dr. Robert Brown", email: "robert@san.edu" },
    { name: "Dr. Alan Turing", email: "alan@san.edu" },
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

    // Distribute years: 1 to 4
    const year = (i % 4) + 1;

    // Calculate Admitted Semester based on year
    // Current is Fall-2025.
    // Year 1 Admitted ~ Spring 2025. Year 4 Admitted ~ Spring 2022.
    // Logic: Go back (Year-1)*3 semesters from end of list
    let admittedIndex = allSemesters.length - 1 - (year - 1) * 3 - 2;
    if (admittedIndex < 0) admittedIndex = 0;
    const admittedSem = allSemesters[admittedIndex];

    // Assign Random Advisor
    const advisor = advisors[Math.floor(Math.random() * advisors.length)];

    const result = insertStudent.run(
      sId,
      uniqueId,
      "password123",
      `Student Name ${i}`,
      `s${i}@san.edu`,
      `+88017000000${i}`,
      "B.Sc. in Computer Science",
      "CSE",
      admittedSem,
      year,
      "Fall-2025",
      "2001-01-01",
      bloodGroups[i % 8],
      `1234567890${i}`,
      "Single",
      "House 123, Road 5, Dhaka",
      "Village Home, District, Division",
      advisor.name,
      advisor.email,
      0.0
    );
    const studentDbId = result.lastInsertRowid;

    // Shuffle courses
    let shuffledCourses = [...allCourseIds].sort(() => 0.5 - Math.random());
    let courseIndex = 0;

    // Loop from Admitted Semester -> Previous Semester (Fall-2025 is current)
    const currentSemIndex = allSemesters.indexOf("Fall-2025");

    for (let s = admittedIndex; s < currentSemIndex; s++) {
      const semName = allSemesters[s];
      let currentSemCredits = 0;

      // Assign 9-15 credits per past semester
      while (currentSemCredits < 9 && courseIndex < shuffledCourses.length) {
        const course = shuffledCourses[courseIndex++];
        const grade = gradesList[Math.floor(Math.random() * gradesList.length)];

        insertGrade.run(studentDbId, course.id, grade, semName);
        insertEnrollment.run(studentDbId, course.id, "completed");
        currentSemCredits += course.credits;

        // Chance for extra course
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

    // Enroll in Current Semester (Fall-2025)
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
    "Database seeded successfully with dynamic semesters, unique advisors, and history."
  );
}

module.exports = db;
