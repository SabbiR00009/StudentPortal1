const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============= AUTHENTICATION =============
app.post("/api/login", (req, res) => {
  try {
    const { id, password, role } = req.body;
    if (!id || !password) return res.status(400).json({ error: "Required fields missing" });

    // CASE 1: FACULTY / ADMIN LOGIN
    if (role === 'faculty' || role === 'admin') {
      // A. Check Admin Table
      const admin = db.prepare("SELECT * FROM admins WHERE email = ? AND password = ?").get(id, password);
      if (admin) {
        const { password, ...d } = admin;
        return res.json({ success: true, user: d, userType: "admin" });
      }

      // B. Check Faculty Table
      const faculty = db.prepare("SELECT * FROM faculty WHERE (faculty_id = ? OR email = ?) AND password = ?")
        .get(id, id, password);

      if (faculty) {
        const { password, ...d } = faculty;
        return res.json({ success: true, user: d, userType: "faculty" });
      }
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    // CASE 2: STUDENT LOGIN
    if (role === 'student') {
      const student = db.prepare("SELECT * FROM students WHERE student_id = ? AND password = ?").get(id, password);
      if (student) {
        const { password, ...d } = student;
        return res.json({ success: true, student: d, userType: "student" });
      } else {
        return res.status(401).json({ error: "Invalid Student credentials" });
      }
    }
    return res.status(400).json({ error: "Invalid Login Type" });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============= ADMIN: FACULTY MANAGEMENT =============
app.get("/api/admin/faculty", (req, res) => {
  try {
    const faculty = db.prepare("SELECT * FROM faculty ORDER BY name").all();
    res.json(faculty);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/faculty", (req, res) => {
  try {
    const { name, department, designation } = req.body;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const faculty_id = `F-${department}-${randomNum}`; // Fixed ID format
    const email = `${faculty_id}@san.edu`; // Fixed email domain

    db.prepare(
      "INSERT INTO faculty (faculty_id, name, email, department, designation, password) VALUES (?, ?, ?, ?, ?, '123456')"
    ).run(faculty_id, name, email, department, designation);

    res.json({ success: true, message: `Faculty Added! ID: ${faculty_id}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admin/faculty/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM faculty WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============= ADMIN: STUDENT MANAGEMENT =============
app.get("/api/admin/students", (req, res) => {
  try {
    const { search } = req.query;
    if (search) {
      const query = `SELECT * FROM students WHERE name LIKE ? OR student_id LIKE ? ORDER BY student_id DESC LIMIT 50`;
      const term = `%${search}%`;
      res.json(db.prepare(query).all(term, term));
    } else {
      res.json(db.prepare("SELECT * FROM students ORDER BY student_id DESC LIMIT 50").all());
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/students", (req, res) => {
  try {
    const s = req.body;
    const admittedYear = s.admitted_year || new Date().getFullYear();
    const admittedSem = s.admitted_semester || "Fall";
    const dept = s.department || "General";

    const semMap = { "Spring": 1, "Summer": 2, "Fall": 3 };
    const sCode = semMap[admittedSem] || 3;
    const deptMap = { "CSE": 60, "EEE": 50, "BBA": 40, "ACT": 30, "ENG": 20 };
    const dCode = deptMap[dept] || 99;

    const countQuery = db.prepare("SELECT count(*) as c FROM students WHERE year = ? AND admitted_semester = ? AND department = ?");
    const count = countQuery.get(admittedYear, admittedSem, dept).c;
    const serial = String(count + 1).padStart(3, "0");

    const finalId = `${admittedYear}-${sCode}-${dCode}-${serial}`;
    const finalEmail = `${finalId}@san.edu`;
    const uniqueId = `U-${Math.floor(Math.random() * 1000000)}`;

    const stmt = db.prepare(`
            INSERT INTO students (
                student_id, unique_id, password, name, email, phone, 
                program, department, admitted_semester, year, semester, 
                dob, blood_group, nid, marital_status, 
                present_address, permanent_address, advisor_name, advisor_email,
                payment_status, previous_due
            ) VALUES (?, ?, '123456', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Due', 0)
        `);

    stmt.run(
      finalId, uniqueId, s.name, finalEmail, s.phone,
      s.program || `B.Sc in ${s.department}`, s.department,
      s.admitted_semester, admittedYear, "Fall-2025",
      s.dob, s.blood_group, s.nid, s.marital_status,
      s.present_address, s.permanent_address,
      s.advisor_name, s.advisor_email
    );

    res.json({ success: true, message: `Student Created! ID: ${finalId}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/admin/students/:id", (req, res) => {
  try {
    const s = req.body;
    const stmt = db.prepare(`
            UPDATE students SET 
                name=?, phone=?, program=?, department=?, 
                year=?, semester=?, dob=?, blood_group=?, 
                nid=?, marital_status=?, present_address=?, permanent_address=?, 
                advisor_name=?, advisor_email=?
            WHERE student_id = ?
        `);
    stmt.run(
      s.name, s.phone, s.program, s.department,
      s.year, s.semester, s.dob, s.blood_group,
      s.nid, s.marital_status, s.present_address, s.permanent_address,
      s.advisor_name, s.advisor_email, req.params.id
    );
    res.json({ success: true, message: "Student Profile Updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admin/students/:id", (req, res) => {
  try {
    const student = db.prepare("SELECT id FROM students WHERE student_id = ?").get(req.params.id);
    if (student) {
      db.prepare("DELETE FROM student_courses WHERE student_id = ?").run(student.id);
      db.prepare("DELETE FROM grades WHERE student_id = ?").run(student.id);
      db.prepare("DELETE FROM advising_requests WHERE student_id = ?").run(student.id);
      db.prepare("DELETE FROM students WHERE id = ?").run(student.id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/student/enroll", (req, res) => {
  try {
    const { studentDbId, courseCode } = req.body;

    console.log(`Admin attempting to enroll Student ID: ${studentDbId} into ${courseCode}`);

    if (!studentDbId) return res.status(400).json({ error: "Missing Student ID." });

    // 1. Get New Course
    const course = db.prepare("SELECT * FROM courses WHERE code = ?").get(courseCode);
    if (!course) return res.status(404).json({ error: "Course not found." });

    // 2. Get Student's Active Schedule
    const existingCourses = db.prepare(`
        SELECT c.* FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        WHERE sc.student_id = ? AND sc.status = 'enrolled'
    `).all(studentDbId);

    console.log(`Student has ${existingCourses.length} existing courses.`);

    // --- CHECK 1: DUPLICATE ---
    const duplicate = existingCourses.find(c => c.code === course.code);
    if (duplicate && duplicate.id !== course.id) {
      return res.status(400).json({
        error: `Duplicate: Already enrolled in ${duplicate.code} (Section ${duplicate.section}).`
      });
    }

    // --- CHECK 2: TIME CONFLICT ---
    const check = checkTimeConflict(course, existingCourses);
    if (check.conflict) {
      return res.status(400).json({ error: check.message });
    }

    // 3. Enroll
    const existing = db.prepare("SELECT id, status FROM student_courses WHERE student_id = ? AND course_id = ?").get(studentDbId, course.id);

    if (existing) {
      db.prepare("UPDATE student_courses SET status = 'enrolled', enrolled_at = CURRENT_TIMESTAMP WHERE id = ?").run(existing.id);
    } else {
      db.prepare("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')").run(studentDbId, course.id);
    }

    db.prepare("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?").run(course.id);
    res.json({ success: true, message: "Enrolled Successfully." });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/student/drop", (req, res) => {
  try {
    const { studentDbId, type, targetId } = req.body;
    if (type === "semester") {
      db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND status = 'enrolled'").run(studentDbId);
      return res.json({ success: true, message: "Semester Dropped" });
    } else {
      db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND course_id = ?").run(studentDbId, targetId);
      db.prepare("UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?").run(targetId);
      return res.json({ success: true, message: "Course Dropped" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============= ADMIN: COURSE MANAGEMENT =============
app.get("/api/admin/config/schedules", (req, res) => {
  try {
    const rules = db.prepare("SELECT * FROM schedule_rules").all();
    res.json(rules);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/courses", (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM courses ORDER BY code").all());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/courses", (req, res) => {
  try {
    const {
      code, name, department, credits, instructor, instructor_email,
      theory_days, theory_time, lab_day, lab_time,
      room_number, section, semester
    } = req.body;

    // Check Duplicates (Code + Section + Semester)
    const exists = db.prepare("SELECT id FROM courses WHERE code = ? AND section = ? AND semester = ?").get(code, section, semester);
    if (exists) return res.json({ success: false, error: `Duplicate: ${code} Section ${section} already exists.` });

    db.prepare(`
            INSERT INTO courses (
                code, name, department, credits, instructor, instructor_email, 
                theory_days, theory_time, lab_day, lab_time,
                room_number, section, semester, max_students, enrolled_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 0)
        `).run(
      code, name, department, credits, instructor, instructor_email,
      theory_days, theory_time, lab_day, lab_time,
      room_number, section, semester
    );

    res.json({ success: true, message: "Course Created Successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/admin/courses/:id/capacity", (req, res) => {
  try {
    const { max_students } = req.body;
    db.prepare("UPDATE courses SET max_students = ? WHERE id = ?").run(max_students, req.params.id);
    res.json({ success: true, message: "Capacity Updated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/admin/courses/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============= ADMIN: GRADES MANAGEMENT (SMART UPLOAD) =============

// 1. Search Student
app.get("/api/admin/grades/search-student", (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const term = `%${q}%`;
    res.json(db.prepare("SELECT id, student_id, name, department FROM students WHERE student_id LIKE ? OR name LIKE ? LIMIT 10").all(term, term));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Get Pending Courses
app.get("/api/admin/grades/pending-courses/:studentId", (req, res) => {
  try {
    const { studentId } = req.params;
    const courses = db.prepare(`
            SELECT c.id as course_id, c.code, c.name, c.section, c.credits
            FROM student_courses sc
            JOIN courses c ON sc.course_id = c.id
            WHERE sc.student_id = ? AND sc.status = 'enrolled'
            AND c.id NOT IN (SELECT course_id FROM grades WHERE student_id = ?)
        `).all(studentId, studentId);
    res.json(courses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Batch Save Grades
app.post("/api/admin/grades/batch", (req, res) => {
  try {
    const { studentId, grades } = req.body;
    const insert = db.prepare("INSERT INTO grades (student_id, course_id, marks, grade, point, semester) VALUES (?, ?, ?, ?, ?, ?)");

    const transaction = db.transaction((gradeList) => {
      for (const g of gradeList) {
        insert.run(studentId, g.courseId, g.marks, g.grade, g.point, "Fall-2025");
      }
    });

    transaction(grades);
    res.json({ success: true, message: "Grades Published Successfully!" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============= ADMIN: FINANCIALS =============
app.get("/api/admin/financials", (req, res) => {
  try {
    const report = db.prepare(`
            SELECT s.student_id, s.name, s.payment_status, s.previous_due, SUM(c.credits) as total_credits 
            FROM students s 
            LEFT JOIN student_courses sc ON s.id = sc.student_id AND sc.status = 'enrolled' 
            LEFT JOIN courses c ON sc.course_id = c.id 
            GROUP BY s.id
        `).all();

    const data = report.map((r) => {
      const credits = r.total_credits || 0;
      const currentCharges = (credits * 150) + 500;
      return {
        ...r,
        total_credits: credits,
        current_charges: currentCharges,
        total_payable: currentCharges + (r.previous_due || 0)
      };
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/admin/financials/status", (req, res) => {
  try {
    const { studentId, status } = req.body;
    if (status === 'Paid') {
      db.prepare("UPDATE students SET payment_status = ?, previous_due = 0 WHERE student_id = ?").run(status, studentId);
    } else {
      db.prepare("UPDATE students SET payment_status = ? WHERE student_id = ?").run(status, studentId);
    }
    res.json({ success: true, message: "Status Updated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============= ADMIN: MISC =============
app.post("/api/admin/admins", (req, res) => {
  try {
    const { name, email, password } = req.body;
    db.prepare("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)").run(name, email, password);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/semesters", (req, res) => {
  try {
    const { semester, start_date, end_date } = req.body;
    db.prepare("UPDATE advising_periods SET is_active = 0").run();
    db.prepare("INSERT INTO advising_periods (semester, start_date, end_date, is_active) VALUES (?, ?, ?, 1)").run(semester, start_date, end_date);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/announcements", (req, res) => {
  try {
    db.prepare("INSERT INTO announcements (title, content, category) VALUES (?, ?, ?)").run(req.body.title, req.body.content, req.body.category);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/slots", (req, res) => res.json(db.prepare("SELECT * FROM advising_slots ORDER BY start_time").all()));
app.post("/api/admin/slots", (req, res) => {
  db.prepare("INSERT INTO advising_slots (min_credits, max_credits, start_time, end_time) VALUES (?, ?, ?, ?)").run(req.body.min, req.body.max, req.body.start, req.body.end);
  res.json({ success: true });
});
app.delete("/api/admin/slots/:id", (req, res) => {
  db.prepare("DELETE FROM advising_slots WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ============= STUDENT PORTAL =============
app.get("/api/students/:id", (req, res) => {
  try {
    const s = db.prepare("SELECT * FROM students WHERE id = ? OR student_id = ?").get(req.params.id, req.params.id);
    if (s) {
      const { password, ...d } = s;
      res.json(d);
    } else res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/students/:id/courses", (req, res) => {
  try {
    const courses = db.prepare(
      `SELECT c.*, sc.status, sc.enrolled_at, g.semester as completed_semester 
         FROM student_courses sc 
         JOIN courses c ON sc.course_id = c.id 
         LEFT JOIN grades g ON sc.student_id = g.student_id AND sc.course_id = g.course_id 
         WHERE sc.student_id = ? 
         ORDER BY CASE WHEN sc.status = 'enrolled' THEN 0 ELSE 1 END, g.semester DESC`
    ).all(req.params.id);
    res.json(courses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/students/:id/grades", (req, res) => {
  try {
    // UPDATED: Now returns Marks and Points too
    const grades = db.prepare(
      `SELECT c.name as course_name, c.code, c.credits, g.grade, g.point, g.marks, g.semester 
         FROM grades g 
         JOIN courses c ON g.course_id = c.id 
         WHERE g.student_id = ? 
         ORDER BY g.semester DESC`
    ).all(req.params.id);
    res.json(grades);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/students/:id/financials", (req, res) => {
  try {
    const result = db.prepare(
      `SELECT SUM(c.credits) as totalCredits FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = ? AND sc.status = 'enrolled'`
    ).get(req.params.id);
    const credits = result.totalCredits || 0;
    res.json({
      credits,
      tuition: credits * 150,
      baseFee: 500,
      total: credits * 150 + 500,
      status: credits > 0 ? "Pending" : "Paid",
      dueDate: "2025-12-15",
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Student Actions (Drop)
app.post("/api/students/drop-course", (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const courses = db.prepare("SELECT c.credits FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = ? AND sc.status = 'enrolled'").all(studentId);
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const courseToDrop = db.prepare("SELECT credits FROM courses WHERE id = ?").get(courseId);

    if (!courseToDrop) return res.status(404).json({ error: "Course not found." });
    if (totalCredits - courseToDrop.credits < 9) return res.status(400).json({ error: `Min 9 credits required.` });

    db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND course_id = ? AND status = 'enrolled'").run(studentId, courseId);
    db.prepare("UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?").run(courseId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/students/drop-semester", (req, res) => {
  try {
    db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND status = 'enrolled'").run(req.body.studentId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Advising Logic
app.get("/api/advising/check-access/:studentId", (req, res) => {
  try {
    const studentId = req.params.studentId;
    const creditResult = db.prepare("SELECT SUM(c.credits) as total FROM grades g JOIN courses c ON g.course_id = c.id WHERE g.student_id = ? AND g.grade != 'F'").get(studentId);
    const completedCredits = creditResult.total || 0;
    const now = new Date();
    const slots = db.prepare("SELECT * FROM advising_slots").all();

    const activeSlot = slots.find(s => completedCredits >= s.min_credits && completedCredits <= s.max_credits && now >= new Date(s.start_time) && now <= new Date(s.end_time));

    if (activeSlot) return res.json({ allowed: true, credits: completedCredits });
    res.json({ allowed: false, message: "No active advising slot for your credits.", credits: completedCredits });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/advising/courses", (req, res) => {
  try {
    const { dept, semester } = req.query;
    let sql = "SELECT *, (max_students - enrolled_count) as seats_available FROM courses";
    const params = [];
    const conditions = [];

    if (dept && dept !== 'All') { conditions.push("department = ?"); params.push(dept); }
    if (semester) { conditions.push("semester = ?"); params.push(semester); }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY code";

    res.json(db.prepare(sql).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/advising/confirm", (req, res) => {
  const { studentId, courseIds } = req.body;

  try {
    const newCourses = courseIds.map(id => db.prepare("SELECT * FROM courses WHERE id = ?").get(id));
    const alreadyEnrolled = db.prepare(`
        SELECT c.* FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        WHERE sc.student_id = ? AND sc.status = 'enrolled'
    `).all(studentId);

    // Virtual Schedule starts with existing courses
    let virtualSchedule = [...alreadyEnrolled];

    for (const newCourse of newCourses) {
      // A. Capacity Check
      if (newCourse.enrolled_count >= newCourse.max_students) {
        return res.status(400).json({ success: false, message: `Course ${newCourse.code} is FULL.` });
      }

      // B. Duplicate Code Check
      const duplicate = virtualSchedule.find(c => c.code === newCourse.code);
      if (duplicate && duplicate.id !== newCourse.id) {
        return res.status(400).json({
          success: false,
          message: `Duplicate: You cannot take ${newCourse.code} twice (Sec ${duplicate.section} vs Sec ${newCourse.section}).`
        });
      }

      // C. Time Conflict Check
      const check = checkTimeConflict(newCourse, virtualSchedule);
      if (check.conflict) {
        return res.status(400).json({ success: false, message: check.message });
      }

      // Add to virtual schedule for next iteration
      virtualSchedule.push(newCourse);
    }

    // D. Transaction
    const tx = db.transaction((ids) => {
      for (const courseId of ids) {
        const existing = db.prepare("SELECT id, status FROM student_courses WHERE student_id = ? AND course_id = ?").get(studentId, courseId);
        if (existing && existing.status === "enrolled") continue;

        if (existing) db.prepare("UPDATE student_courses SET status = 'enrolled' WHERE id = ?").run(existing.id);
        else db.prepare("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')").run(studentId, courseId);

        db.prepare("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?").run(courseId);
      }
    });

    tx(courseIds);
    res.json({ success: true });

  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

app.get("/api/announcements", (req, res) => res.json(db.prepare("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10").all()));

// ============= FACULTY PORTAL (FIXED FOR NEW SCHEMA) =============

app.get("/api/faculty/:email/courses", (req, res) => {
  try {
    const courses = db.prepare("SELECT * FROM courses WHERE instructor_email = ?").all(req.params.email);
    res.json(courses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/faculty/course/:courseId/students", (req, res) => {
  try {
    const students = db.prepare(`
        SELECT s.id, s.student_id, s.name, s.email, g.grade, g.marks 
        FROM student_courses sc
        JOIN students s ON sc.student_id = s.id
        LEFT JOIN grades g ON s.id = g.student_id AND sc.course_id = g.course_id
        WHERE sc.course_id = ? AND sc.status = 'enrolled'
    `).all(req.params.courseId);
    res.json(students);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// FIXED FACULTY GRADE SUBMIT (Calculates Point/Marks to satisfy DB)
app.post("/api/faculty/grade", (req, res) => {
  try {
    const { studentDbId, courseId, grade, semester } = req.body;

    // Helper: Map Letter Grade to approximate Point & Mark (since Faculty portal UI isn't sending them yet)
    const gradeMap = {
      "A+": { p: 4.00, m: 90 }, "A": { p: 3.75, m: 75 }, "A-": { p: 3.50, m: 70 },
      "B+": { p: 3.25, m: 65 }, "B": { p: 3.00, m: 60 }, "B-": { p: 2.75, m: 55 },
      "C+": { p: 2.50, m: 50 }, "C": { p: 2.25, m: 45 }, "D": { p: 2.00, m: 40 }, "F": { p: 0.00, m: 0 }
    };
    const { p, m } = gradeMap[grade] || { p: 0.0, m: 0 };

    const exists = db.prepare("SELECT id FROM grades WHERE student_id = ? AND course_id = ?").get(studentDbId, courseId);

    if (exists) {
      db.prepare("UPDATE grades SET grade = ?, point = ?, marks = ? WHERE id = ?").run(grade, p, m, exists.id);
    } else {
      db.prepare("INSERT INTO grades (student_id, course_id, grade, point, marks, semester) VALUES (?, ?, ?, ?, ?, ?)").run(studentDbId, courseId, grade, p, m, semester);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =========================================================
// HELPER: DEBUGGABLE CONFLICT CHECKER
// =========================================================
function checkTimeConflict(newCourse, existingCourses) {
  console.log(`\n--- START CONFLICT CHECK FOR ${newCourse.code} ---`);

  // 1. Time Parser
  // REPLACE your current parseTime with this one to fix the "AM vs PM" math
  const parseTime = (str) => {
    if (!str) return null;
    const clean = str.replace(/Slot \d+:/i, "").trim();
    const parts = clean.split("-");
    if (parts.length !== 2) return null;

    const [s, e] = parts.map(t => t.trim());

    const toMin = (t) => {
      let [h, m] = t.split(":").map(Number);

      // 12-HOUR FIX: If hour is 01-07, assume it's PM (Afternoon)
      if (h < 8) h += 12;
      if (h === 12 && t.toLowerCase().includes("am")) h = 0;

      return (h * 60) + (m || 0);
    };

    return { start: toMin(s), end: toMin(e) };
  };

  // 2. Day Normalizer
  const normalizeDays = (input) => {
    if (!input) return [];
    const str = input.toString().trim();
    const map = {
      "M": "Mon", "Mon": "Mon", "Monday": "Mon",
      "T": "Tue", "Tue": "Tue", "Tuesday": "Tue",
      "W": "Wed", "Wed": "Wed", "Wednesday": "Wed",
      "R": "Thu", "Thu": "Thu", "Thursday": "Thu",
      "F": "Fri", "Fri": "Fri", "Friday": "Fri",
      "S": "Sat", "Sat": "Sat", "Saturday": "Sat",
      "U": "Sun", "Sun": "Sun", "Sunday": "Sun",
      "MW": ["Mon", "Wed"], "ST": ["Sun", "Tue"],
      "SR": ["Sun", "Thu"], "TR": ["Tue", "Thu"]
    };

    // Return mapped value or fallback to list split (e.g. "Mon,Wed")
    if (map[str]) return Array.isArray(map[str]) ? map[str] : [map[str]];
    if (str.includes(",")) return str.split(",").map(d => d.trim().substring(0, 3));
    return [str.substring(0, 3)];
  };

  // 3. Get Segments
  const getSegments = (c) => {
    const segments = [];

    // Theory
    if (c.theory_days && c.theory_time) {
      const days = normalizeDays(c.theory_days);
      const time = parseTime(c.theory_time);
      if (time) days.forEach(d => segments.push({ day: d, start: time.start, end: time.end, type: 'Theory' }));
    } else {
      console.log(`[WARN] Course ${c.code} has missing Theory info: Days=${c.theory_days}, Time=${c.theory_time}`);
    }

    // Lab
    if (c.lab_day && c.lab_time) {
      const days = normalizeDays(c.lab_day);
      const time = parseTime(c.lab_time);
      if (time) days.forEach(d => segments.push({ day: d, start: time.start, end: time.end, type: 'Lab' }));
    }
    return segments;
  };

  const newSegments = getSegments(newCourse);
  console.log(`New Course Segments:`, newSegments);

  // 4. Compare
  for (const oldCourse of existingCourses) {
    if (oldCourse.id === newCourse.id) continue;

    const oldSegments = getSegments(oldCourse);
    console.log(`Checking vs Existing ${oldCourse.code}:`, oldSegments);

    for (const newSeg of newSegments) {
      for (const oldSeg of oldSegments) {
        // Check Day
        if (newSeg.day === oldSeg.day) {
          // Check Time
          if ((newSeg.start === oldSeg.start && newSeg.end === oldSeg.end) ||
            (newSeg.start < oldSeg.end && newSeg.end > oldSeg.start)
          ) {
            const msg = `CONFLICT: ${newCourse.code} (${newSeg.type} ${newSeg.start}-${newSeg.end}) hits ${oldCourse.code} (${oldSeg.type} ${oldSeg.start}-${oldSeg.end}) on ${newSeg.day}`;
            console.log("!!! " + msg);
            return { conflict: true, message: msg };
          }
        }
      }
    }
  }

  console.log("--- NO CONFLICT FOUND ---\n");
  return { conflict: false };
}
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));