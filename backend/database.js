const Database = require('better-sqlite3');
const db = new Database('san_university.db');

// Create tables
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

// Insert sample data (only if tables are empty)
const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get();

if (studentCount.count === 0) {
  // Insert admin account
  db.prepare(`
    INSERT INTO admins (email, password, name) VALUES
    ('sabbir.hossain.28678@gmail.com', 'sabbir009', 'Admin Sabbir')
  `).run();

  // Sample students
  db.prepare(`
    INSERT INTO students (student_id, password, name, email, department, year, semester, gpa) VALUES
    ('SAN2024001', 'password123', 'John Doe', 'john.doe@san.edu', 'Computer Science', 2, 'Fall-2025', 3.8),
    ('SAN2024002', 'password123', 'Jane Smith', 'jane.smith@san.edu', 'Computer Science', 3, 'Fall-2025', 3.9),
    ('SAN2024003', 'password123', 'Mike Johnson', 'mike.j@san.edu', 'Computer Science', 1, 'Fall-2025', 3.5),
    ('SAN2024004', 'password123', 'Sarah Williams', 'sarah.w@san.edu', 'Computer Science', 2, 'Fall-2025', 3.7)
  `).run();

  // Sample courses (similar to your image)
  db.prepare(`
    INSERT INTO courses (code, name, credits, instructor, instructor_email, schedule, room_number, section, semester) VALUES
    ('CSE360', 'Software Engineering', 3, 'Ms. Fouzie Risdin', 'fouzie.risdin@ewubd.edu', 'MW 3:10PM-4:40PM', 'AB3-401', 4, 'Fall-2025'),
    ('CSE405', 'Computer Security', 4, 'Dr. Anisur Rahman', 'anis@ewubd.edu', 'ST 8:30AM-10:00AM', '221', 1, 'Fall-2025'),
    ('CSE405L', 'Computer Security Lab', 4, 'Dr. Anisur Rahman', 'anis@ewubd.edu', 'R 8:00AM-10:00AM', '450 (Networking Lab)', 1, 'Fall-2025'),
    ('CSE412', 'Software Engineering Project', 4, 'Nishat Tasnim Niloy', 'nishat.niloy@ewubd.edu', 'S 11:50AM-1:20PM', 'AB2-402', 3, 'Fall-2025'),
    ('CSE412L', 'Software Engineering Lab', 4, 'Nishat Tasnim Niloy', 'nishat.niloy@ewubd.edu', 'W 10:10AM-12:10PM', '630 (Software Engineering Lab)', 3, 'Fall-2025'),
    ('CSE495', 'Thesis/Project', 3, 'Ahmed Adnan', 'ahmed.adnan@ewubd.edu', 'S 4:50PM-6:20PM', 'AB3-1002', 4, 'Fall-2025'),
    ('CSE350', 'Digital System Design', 4, 'Nahid Hasan', 'nahid.hasan@ewubd.edu', 'ST 4:50PM-6:20PM', 'FUB-302', 3, 'Fall-2025'),
    ('CSE350L', 'Digital System Design Lab', 4, 'Nahid Hasan', 'nahid.hasan@ewubd.edu', 'W 1:30PM-3:00PM', '372 (SEIP Lab)', 3, 'Fall-2025'),
    ('CSE201', 'Data Structures', 4, 'Dr. James Lee', 'james.lee@san.edu', 'TTh 11:00AM-12:30PM', 'AB2-301', 2, 'Fall-2025'),
    ('MATH301', 'Numerical Methods', 3, 'Dr. Emily Chen', 'emily.chen@san.edu', 'MWF 2:00PM-3:00PM', 'AB1-201', 1, 'Fall-2025'),
    ('CSE320', 'Database Systems', 3, 'Dr. Robert Brown', 'robert.brown@san.edu', 'MW 1:00PM-2:30PM', 'AB3-501', 2, 'Fall-2025'),
    ('CSE401', 'Artificial Intelligence', 3, 'Dr. Sarah Wilson', 'sarah.wilson@san.edu', 'TTh 3:00PM-4:30PM', 'AB2-601', 1, 'Fall-2025')
  `).run();

  // Enroll students in some courses
  db.prepare(`
    INSERT INTO student_courses (student_id, course_id, status) VALUES
    (1, 1, 'enrolled'), (1, 2, 'enrolled'), (1, 3, 'enrolled'),
    (2, 4, 'enrolled'), (2, 5, 'enrolled'),
    (3, 6, 'enrolled'), (3, 7, 'enrolled')
  `).run();

  // Sample grades
  db.prepare(`
    INSERT INTO grades (student_id, course_id, grade, semester) VALUES
    (1, 1, 'A', 'Spring-2025'),
    (1, 2, 'A-', 'Spring-2025'),
    (2, 4, 'B+', 'Spring-2025'),
    (3, 6, 'B', 'Spring-2025')
  `).run();

  // Sample announcements
  db.prepare(`
    INSERT INTO announcements (title, content, category) VALUES
    ('Advising Period Opens', 'Course advising for Fall-2025 semester is now open. Please complete your course selection by December 15th.', 'Academic'),
    ('Final Exam Schedule Released', 'The final exam schedule has been posted. Check your student portal for details.', 'Academic'),
    ('Career Fair - February 20th', 'Join us for the annual career fair. Over 100 companies will be attending!', 'Events'),
    ('Library Extended Hours', 'The library will be open 24/7 during exam week.', 'Facilities'),
    ('New Lab Equipment', 'Software Engineering Lab has been upgraded with new workstations.', 'Technology')
  `).run();

  // Create active advising period
  db.prepare(`
    INSERT INTO advising_periods (semester, start_date, end_date, is_active) VALUES
    ('Fall-2025', '2025-11-20', '2025-12-15', 1)
  `).run();

  console.log('Sample data inserted successfully!');
}

module.exports = db;