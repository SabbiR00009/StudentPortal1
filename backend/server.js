const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============= AUTHENTICATION =============

// Student Login
app.post("/api/login", (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res
        .status(400)
        .json({ error: "Student ID and password are required" });
    }

    const student = db
      .prepare("SELECT * FROM students WHERE student_id = ? AND password = ?")
      .get(studentId, password);

    if (student) {
      const { password, ...studentData } = student;
      res.json({ success: true, student: studentData, userType: "student" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
app.post("/api/admin/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const admin = db
      .prepare("SELECT * FROM admins WHERE email = ? AND password = ?")
      .get(email, password);

    if (admin) {
      const { password, ...adminData } = admin;
      res.json({ success: true, admin: adminData, userType: "admin" });
    } else {
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= STUDENT ROUTES =============

// Get student profile
app.get("/api/students/:id", (req, res) => {
  try {
    const student = db
      .prepare("SELECT * FROM students WHERE id = ?")
      .get(req.params.id);
    if (student) {
      const { password, ...studentData } = student;
      res.json(studentData);
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's enrolled courses
app.get("/api/students/:id/courses", (req, res) => {
  try {
    const courses = db
      .prepare(
        `
      SELECT 
        c.*, 
        sc.status, 
        sc.enrolled_at, 
        g.semester as completed_semester 
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      LEFT JOIN grades g ON sc.student_id = g.student_id AND sc.course_id = g.course_id 
      WHERE sc.student_id = ? 
      ORDER BY CASE WHEN sc.status = 'enrolled' THEN 0 ELSE 1 END, g.semester DESC
    `
      )
      .all(req.params.id);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student grades
app.get("/api/students/:id/grades", (req, res) => {
  try {
    const grades = db
      .prepare(
        `
      SELECT c.name as course_name, c.code, c.credits, g.grade, g.semester
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      WHERE g.student_id = ?
      ORDER BY g.semester DESC
    `
      )
      .all(req.params.id);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADVISING ROUTES =============

// Get all available courses for advising (UPDATED for Real-Time Seats)
app.get("/api/advising/courses", (req, res) => {
  try {
    const { semester } = req.query;
    // MODIFIED: Added (max_students - enrolled_count) logic
    const courses = db
      .prepare(
        `
      SELECT *, (max_students - enrolled_count) as seats_available 
      FROM courses 
      WHERE semester = ?
      ORDER BY code, section
    `
      )
      .all(semester || "Fall-2025");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active advising period
app.get("/api/advising/period", (req, res) => {
  try {
    const period = db
      .prepare("SELECT * FROM advising_periods WHERE is_active = 1")
      .get();
    res.json(period || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit advising request (Individual request)
app.post("/api/advising/request", (req, res) => {
  try {
    const { studentId, courseId, semester } = req.body;

    const existing = db
      .prepare(
        `SELECT * FROM advising_requests WHERE student_id = ? AND course_id = ? AND semester = ?`
      )
      .get(studentId, courseId, semester);

    if (existing) {
      return res.status(400).json({ error: "Course already requested" });
    }

    const enrolled = db
      .prepare(
        `SELECT * FROM student_courses WHERE student_id = ? AND course_id = ?`
      )
      .get(studentId, courseId);

    if (enrolled) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    const result = db
      .prepare(
        `INSERT INTO advising_requests (student_id, course_id, semester, status) VALUES (?, ?, ?, 'pending')`
      )
      .run(studentId, courseId, semester);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CONFIRM ADVISING SLIP (Real-Time Transaction) ---
app.post("/api/advising/confirm", (req, res) => {
  const { studentId, courseIds } = req.body;

  // Use a transaction to ensure atomic registration
  const registerTransaction = db.transaction((ids) => {
    for (const courseId of ids) {
      // 1. Check if already enrolled
      const existing = db
        .prepare(
          "SELECT id FROM student_courses WHERE student_id = ? AND course_id = ?"
        )
        .get(studentId, courseId);
      if (existing) continue;

      // 2. Real-time Seat Check
      const course = db
        .prepare(
          "SELECT enrolled_count, max_students, code FROM courses WHERE id = ?"
        )
        .get(courseId);

      if (course.enrolled_count >= course.max_students) {
        throw new Error(`Course ${course.code} is FULL. Registration failed.`);
      }

      // 3. Register & Update Count
      db.prepare(
        "INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')"
      ).run(studentId, courseId);

      db.prepare(
        "UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?"
      ).run(courseId);
    }
  });

  try {
    registerTransaction(courseIds);
    res.json({ success: true, message: "Registration Successful!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get student's advising requests
app.get("/api/students/:id/advising-requests", (req, res) => {
  try {
    const requests = db
      .prepare(
        `
      SELECT ar.*, c.code, c.name, c.credits, c.instructor, c.schedule, c.section
      FROM advising_requests ar
      JOIN courses c ON ar.course_id = c.id
      WHERE ar.student_id = ?
      ORDER BY ar.requested_at DESC
    `
      )
      .all(req.params.id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove advising request
app.delete("/api/advising/request/:id", (req, res) => {
  try {
    const result = db
      .prepare("DELETE FROM advising_requests WHERE id = ?")
      .run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN ROUTES =============

// Get all students
app.get("/api/admin/students", (req, res) => {
  try {
    const students = db
      .prepare(
        "SELECT id, student_id, name, email, department, year, semester, gpa FROM students"
      )
      .all();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all advising requests
app.get("/api/admin/advising-requests", (req, res) => {
  try {
    const requests = db
      .prepare(
        `
      SELECT ar.*, s.name as student_name, s.student_id, s.department,
             c.code, c.name as course_name, c.section
      FROM advising_requests ar
      JOIN students s ON ar.student_id = s.id
      JOIN courses c ON ar.course_id = c.id
      ORDER BY ar.requested_at DESC
    `
      )
      .all();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload/Update Grades
app.post("/api/admin/grades", (req, res) => {
  try {
    const { studentId, courseCode, grade, semester } = req.body;

    // 1. Find Student
    const student = db
      .prepare("SELECT id FROM students WHERE student_id = ?")
      .get(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    // 2. Find Course
    const course = db
      .prepare("SELECT id FROM courses WHERE code = ?")
      .get(courseCode);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // 3. Upsert Grade
    const existingGrade = db
      .prepare("SELECT id FROM grades WHERE student_id = ? AND course_id = ?")
      .get(student.id, course.id);

    if (existingGrade) {
      db.prepare("UPDATE grades SET grade = ?, semester = ? WHERE id = ?").run(
        grade,
        semester,
        existingGrade.id
      );
    } else {
      db.prepare(
        "INSERT INTO grades (student_id, course_id, grade, semester) VALUES (?, ?, ?, ?)"
      ).run(student.id, course.id, grade, semester);
    }

    res.json({ success: true, message: "Grade updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/advising/approve/:id", (req, res) => {
  try {
    const request = db
      .prepare("SELECT * FROM advising_requests WHERE id = ?")
      .get(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    db.prepare(
      `INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')`
    ).run(request.student_id, request.course_id);
    db.prepare("UPDATE advising_requests SET status = ? WHERE id = ?").run(
      "approved",
      req.params.id
    );
    db.prepare(
      "UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?"
    ).run(request.course_id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/advising/reject/:id", (req, res) => {
  try {
    const result = db
      .prepare("UPDATE advising_requests SET status = ? WHERE id = ?")
      .run("rejected", req.params.id);
    if (result.changes === 0)
      return res.status(404).json({ error: "Request not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/courses", (req, res) => {
  try {
    const {
      code,
      name,
      credits,
      instructor,
      instructor_email,
      schedule,
      room_number,
      section,
      semester,
    } = req.body;
    const result = db
      .prepare(
        `
      INSERT INTO courses (code, name, credits, instructor, instructor_email, schedule, room_number, section, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        code,
        name,
        credits,
        instructor,
        instructor_email,
        schedule,
        room_number,
        section,
        semester
      );
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/courses/:id", (req, res) => {
  try {
    const result = db
      .prepare("DELETE FROM courses WHERE id = ?")
      .run(req.params.id);
    if (result.changes === 0)
      return res.status(404).json({ error: "Course not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FEATURE: DROP INDIVIDUAL COURSE (UPDATED RULE: Min 9 Credits) ---
app.post("/api/students/drop-course", (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    // 1. Calculate Current Credits
    const courses = db
      .prepare(
        "SELECT c.credits FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = ? AND sc.status = 'enrolled'"
      )
      .all(studentId);

    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

    // 2. Get credits of the course to be dropped
    const courseToDrop = db
      .prepare("SELECT credits FROM courses WHERE id = ?")
      .get(courseId);

    if (!courseToDrop)
      return res.status(404).json({ error: "Course not found." });

    // 3. Validate Rule: Cannot drop if remaining credits < 9
    if (totalCredits - courseToDrop.credits < 9) {
      return res
        .status(400)
        .json({
          error: `Cannot drop. You must maintain at least 9 credits (Current: ${totalCredits}).`,
        });
    }

    // 4. Process Drop
    db.prepare(
      "UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND course_id = ? AND status = 'enrolled'"
    ).run(studentId, courseId);
    db.prepare(
      "UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?"
    ).run(courseId);

    res.json({ success: true, message: "Course dropped successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FEATURE 4.4: DROP SEMESTER ---
app.post("/api/students/drop-semester", (req, res) => {
  try {
    const { studentId } = req.body;
    const result = db
      .prepare(
        `UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND status = 'enrolled'`
      )
      .run(studentId);
    res.json({ success: true, message: `Dropped ${result.changes} courses.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FEATURE 4.6: FINANCIALS / FEES ---
app.get("/api/students/:id/financials", (req, res) => {
  try {
    const result = db
      .prepare(
        `
      SELECT SUM(c.credits) as totalCredits 
      FROM student_courses sc 
      JOIN courses c ON sc.course_id = c.id 
      WHERE sc.student_id = ? AND sc.status = 'enrolled'
    `
      )
      .get(req.params.id);

    const credits = result.totalCredits || 0;
    const costPerCredit = 150;
    const baseFee = 500;
    const totalAmount = credits * costPerCredit + baseFee;

    res.json({
      credits: credits,
      tuition: credits * costPerCredit,
      baseFee: baseFee,
      total: totalAmount,
      status: totalAmount > 0 ? "Pending" : "Paid",
      dueDate: "2025-12-15",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ANNOUNCEMENTS =============

app.get("/api/announcements", (req, res) => {
  try {
    const announcements = db
      .prepare("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10")
      .all();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/announcements", (req, res) => {
  try {
    const { title, content, category } = req.body;
    const result = db
      .prepare(
        `INSERT INTO announcements (title, content, category) VALUES (?, ?, ?)`
      )
      .run(title, content, category);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(
    `🎓 SAN University Portal Server running on http://localhost:${PORT}`
  );
  console.log(`📚 Database: san_university.db`);
  console.log(`🔐 Admin: sabbir.hossain.28678@gmail.com / sabbir009`);
});
