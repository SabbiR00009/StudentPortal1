const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============= AUTHENTICATION (STRICT MODE) =============

app.post("/api/login", (req, res) => {
  try {
    const { id, password, role } = req.body;
    
    if (!id || !password) return res.status(400).json({ error: "Required fields missing" });

    // CASE 1: ADMIN LOGIN
    if (role === 'admin') {
        const admin = db.prepare("SELECT * FROM admins WHERE email = ? AND password = ?").get(id, password);
        
        if (admin) {
            const { password, ...d } = admin;
            return res.json({ success: true, user: d, userType: "admin" });
        } else {
            // Security: If they try to login as admin but are not in admin table, fail.
            return res.status(401).json({ error: "Invalid Admin credentials" });
        }
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

// ============= ADMIN CONTROLLER ROUTES =============

// --- 1. FACULTY MANAGEMENT ---
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
    const { faculty_id, name, email, department, designation } = req.body;
    db.prepare(
      "INSERT INTO faculty (faculty_id, name, email, department, designation) VALUES (?, ?, ?, ?, ?)"
    ).run(faculty_id, name, email, department, designation);
    res.json({ success: true });
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

// --- 2. STUDENT MANAGEMENT (Smart ID Generation) ---
app.get("/api/admin/students", (req, res) => {
  try {
    const { search } = req.query;
    let query = "SELECT * FROM students";
    if (search)
      query += ` WHERE student_id LIKE '%${search}%' OR name LIKE '%${search}%'`;
    query += " ORDER BY student_id DESC LIMIT 50";
    res.json(db.prepare(query).all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/students", (req, res) => {
  try {
    const s = req.body;
    let finalId = s.student_id; // Check if manual ID provided

    // If NO manual ID, generate one: Year-SemCode-DeptCode-Serial
    if (!finalId || finalId.trim() === "") {
        const admittedYear = s.admitted_year || new Date().getFullYear();
        const admittedSem = s.admitted_semester || "Fall";
        const dept = s.department || "General";

        // Map Semester to Code
        const semMap = { "Spring": 1, "Summer": 2, "Fall": 3 };
        const sCode = semMap[admittedSem] || 3; 

        // Map Department to Code
        const deptMap = { "CSE": 60, "EEE": 50, "BBA": 40, "ACT": 30, "ENG": 20 };
        const dCode = deptMap[dept] || 99;

        // Generate Serial (Count existing students in this specific batch)
        const countQuery = db.prepare("SELECT count(*) as c FROM students WHERE year = ? AND admitted_semester = ? AND department = ?");
        const count = countQuery.get(admittedYear, admittedSem, dept).c;
        const serial = String(count + 1).padStart(3, "0");

        finalId = `${admittedYear}-${sCode}-${dCode}-${serial}`;
    }

    const uniqueId = s.unique_id || `U-${Math.floor(Math.random() * 1000000)}`;

    const stmt = db.prepare(`
            INSERT INTO students (
                student_id, unique_id, password, name, email, phone, program, department, 
                admitted_semester, year, semester, dob, blood_group, nid, marital_status, 
                present_address, permanent_address, advisor_name, advisor_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    stmt.run(
      finalId,
      uniqueId,
      "123456", // Default password
      s.name,
      s.email,
      s.phone,
      s.program || `B.Sc in ${s.department}`,
      s.department,
      s.admitted_semester,
      s.admitted_year,
      "Fall-2025", // Current Enrolled Semester
      s.dob,
      s.blood_group,
      s.nid,
      s.marital_status,
      s.present_address,
      s.permanent_address,
      s.advisor_name,
      s.advisor_email
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
            name=?, email=?, phone=?, program=?, department=?, year=?, semester=?, 
            dob=?, blood_group=?, nid=?, marital_status=?, present_address=?, permanent_address=?, 
            advisor_name=?, advisor_email=? 
            WHERE student_id = ?
        `);
    stmt.run(
      s.name, s.email, s.phone, s.program, s.department, s.year, s.semester,
      s.dob, s.blood_group, s.nid, s.marital_status, s.present_address, s.permanent_address,
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

// --- 3. ADMIN STUDENT ACTIONS (Enroll/Drop Override) ---
app.post("/api/admin/student/enroll", (req, res) => {
  try {
    const { studentDbId, courseCode } = req.body;
    const course = db.prepare("SELECT id FROM courses WHERE code = ?").get(courseCode);
    if (!course) return res.status(404).json({ error: "Course code not found." });

    const existing = db.prepare(
        "SELECT id, status FROM student_courses WHERE student_id = ? AND course_id = ?"
      ).get(studentDbId, course.id);

    if (existing) {
      db.prepare("UPDATE student_courses SET status = 'enrolled', enrolled_at = CURRENT_TIMESTAMP WHERE id = ?").run(existing.id);
    } else {
      db.prepare("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')").run(studentDbId, course.id);
    }

    db.prepare("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?").run(course.id);
    res.json({ success: true, message: "Student enrolled successfully." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/student/drop", (req, res) => {
  try {
    const { studentDbId, type, targetId } = req.body; 

    if (type === "semester") {
      db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND status = 'enrolled'").run(studentDbId);
      return res.json({ success: true, message: "Semester Dropped by Admin" });
    } else {
      db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND course_id = ?").run(studentDbId, targetId);
      db.prepare("UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?").run(targetId);
      return res.json({ success: true, message: "Course Dropped by Admin" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- 4. COURSE & GRADE MANAGEMENT (With Dept & Seat Control) ---

// Get All Courses (Admin List)
app.get("/api/admin/courses", (req, res) => {
  try {
    const courses = db.prepare("SELECT * FROM courses ORDER BY code").all();
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Course
app.post("/api/admin/courses", (req, res) => {
  try {
    const { code, name, department, credits, instructor, instructor_email, schedule, room_number, section, semester } = req.body;
    db.prepare(
      `INSERT INTO courses (code, name, department, credits, instructor, instructor_email, schedule, room_number, section, semester, max_students, enrolled_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 0)`
    ).run(code, name, department, credits, instructor, instructor_email, schedule, room_number, section, semester);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update Seat Capacity
app.put("/api/admin/courses/:id/capacity", (req, res) => {
    try {
        const { max_students } = req.body;
        const courseId = req.params.id;

        const course = db.prepare("SELECT enrolled_count, code FROM courses WHERE id = ?").get(courseId);
        
        if (!course) return res.status(404).json({ error: "Course not found" });

        if (max_students < course.enrolled_count) {
            return res.status(400).json({ 
                error: `Cannot reduce capacity to ${max_students}. ${course.enrolled_count} students are already enrolled.` 
            });
        }

        db.prepare("UPDATE courses SET max_students = ? WHERE id = ?").run(max_students, courseId);
        res.json({ success: true, message: `Updated ${course.code} capacity to ${max_students}` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete("/api/admin/courses/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/grades", (req, res) => {
  try {
    const { studentId, courseCode, grade, semester } = req.body;
    const s = db.prepare("SELECT id FROM students WHERE student_id = ?").get(studentId);
    const c = db.prepare("SELECT id FROM courses WHERE code = ?").get(courseCode);
    if (!s || !c) return res.status(404).json({ error: "Not found" });

    const ex = db.prepare("SELECT id FROM grades WHERE student_id = ? AND course_id = ?").get(s.id, c.id);
    if (ex) db.prepare("UPDATE grades SET grade = ?, semester = ? WHERE id = ?").run(grade, semester, ex.id);
    else db.prepare("INSERT INTO grades (student_id, course_id, grade, semester) VALUES (?, ?, ?, ?)").run(s.id, c.id, grade, semester);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- 5. FINANCIALS & ADMINS ---
app.get("/api/admin/financials", (req, res) => {
  try {
    const report = db.prepare(
        `SELECT s.student_id, s.name, SUM(c.credits) as total_credits 
         FROM students s 
         LEFT JOIN student_courses sc ON s.id = sc.student_id AND sc.status = 'enrolled' 
         LEFT JOIN courses c ON sc.course_id = c.id 
         GROUP BY s.id`
      ).all();
    const data = report.map((r) => ({
      ...r,
      amountDue: (r.total_credits || 0) * 150 + 500,
      status: r.total_credits > 0 ? "Pending" : "Paid/Refunded",
    }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/admins", (req, res) => {
  try {
    const { name, email, password } = req.body;
    db.prepare("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)").run(name, email, password);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/semesters", (req, res) => {
  try {
    const { semester, start_date, end_date } = req.body;
    db.prepare("UPDATE advising_periods SET is_active = 0").run();
    db.prepare("INSERT INTO advising_periods (semester, start_date, end_date, is_active) VALUES (?, ?, ?, 1)").run(semester, start_date, end_date);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/announcements", (req, res) => {
  try {
    db.prepare("INSERT INTO announcements (title, content, category) VALUES (?, ?, ?)").run(req.body.title, req.body.content, req.body.category);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- 6. ADMIN: ADVISING SLOTS ---
app.get("/api/admin/slots", (req, res) => {
  try {
    const slots = db.prepare("SELECT * FROM advising_slots ORDER BY start_time").all();
    res.json(slots);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/slots", (req, res) => {
  try {
    const { min, max, start, end } = req.body;
    db.prepare("INSERT INTO advising_slots (min_credits, max_credits, start_time, end_time) VALUES (?, ?, ?, ?)").run(min, max, start, end);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admin/slots/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM advising_slots WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============= STUDENT PORTAL ROUTES =============

app.get("/api/students/:id", (req, res) => {
  try {
    const s = db.prepare("SELECT * FROM students WHERE id = ? OR student_id = ?").get(req.params.id, req.params.id);
    if (s) {
      const { password, ...d } = s;
      res.json(d);
    } else res.status(404).json({ error: "Not found" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/students/:id/grades", (req, res) => {
  try {
    const grades = db.prepare(
        `SELECT c.name as course_name, c.code, c.credits, g.grade, g.semester 
         FROM grades g 
         JOIN courses c ON g.course_id = c.id 
         WHERE g.student_id = ? 
         ORDER BY g.semester DESC`
      ).all(req.params.id);
    res.json(grades);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/students/drop-course", (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    
    // 1. Validate Credits
    const courses = db.prepare(
        "SELECT c.credits FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = ? AND sc.status = 'enrolled'"
      ).all(studentId);
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const courseToDrop = db.prepare("SELECT credits FROM courses WHERE id = ?").get(courseId);
    
    if (!courseToDrop) return res.status(404).json({ error: "Course not found." });
    if (totalCredits - courseToDrop.credits < 9) return res.status(400).json({ error: `Min 9 credits required.` });

    // 2. Update Status
    db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND course_id = ? AND status = 'enrolled'").run(studentId, courseId);
    
    // 3. Decrement Count
    db.prepare("UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?").run(courseId);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/students/drop-semester", (req, res) => {
  try {
    db.prepare("UPDATE student_courses SET status = 'dropped' WHERE student_id = ? AND status = 'enrolled'").run(req.body.studentId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- GATEKEEPER CHECK ---
app.get("/api/advising/check-access/:studentId", (req, res) => {
  try {
    const studentId = req.params.studentId;

    // 1. Get Completed Credits
    const creditResult = db.prepare(
        `SELECT SUM(c.credits) as total FROM grades g JOIN courses c ON g.course_id = c.id WHERE g.student_id = ? AND g.grade != 'F'`
      ).get(studentId);

    const completedCredits = creditResult.total || 0;
    const now = new Date();

    // 2. Find Slot
    const slots = db.prepare("SELECT * FROM advising_slots").all();

    const activeSlot = slots.find((slot) => {
      const start = new Date(slot.start_time);
      const end = new Date(slot.end_time);
      return (completedCredits >= slot.min_credits && completedCredits <= slot.max_credits && now >= start && now <= end);
    });

    const futureSlot = slots.find((slot) => {
      const start = new Date(slot.start_time);
      return (completedCredits >= slot.min_credits && completedCredits <= slot.max_credits && now < start);
    });

    if (activeSlot) {
      return res.json({ allowed: true, credits: completedCredits });
    } else {
      let message = "Advising is closed for your credit range.";
      if (futureSlot) {
        const timeStr = new Date(futureSlot.start_time).toLocaleString();
        message = `You have completed ${completedCredits} credits.\nYour advising window opens at: ${timeStr}`;
      } else {
        message = `You have completed ${completedCredits} credits.\nNo active advising time slot found for this credit range.`;
      }
      return res.json({ allowed: false, message, credits: completedCredits });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- LOAD CATALOG (With Filters) ---
app.get("/api/advising/courses", (req, res) => {
  try {
    const { dept, semester } = req.query; 
    
    let sql = "SELECT *, (max_students - enrolled_count) as seats_available FROM courses";
    const params = [];
    const conditions = [];

    if (dept && dept !== 'All') {
        conditions.push("department = ?");
        params.push(dept);
    }

    if (semester) {
        conditions.push("semester = ?");
        params.push(semester);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY code";

    const courses = db.prepare(sql).all(...params);
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- CONFIRM ADVISING ---
app.post("/api/advising/confirm", (req, res) => {
  const { studentId, courseIds } = req.body;
  const tx = db.transaction((ids) => {
    for (const courseId of ids) {
      const existing = db.prepare("SELECT id, status FROM student_courses WHERE student_id = ? AND course_id = ?").get(studentId, courseId);
      
      if (existing && existing.status === "enrolled") continue;

      const course = db.prepare("SELECT enrolled_count, max_students, code FROM courses WHERE id = ?").get(courseId);
      
      if (course.enrolled_count >= course.max_students) throw new Error(`Course ${course.code} is FULL.`);

      if (existing)
        db.prepare("UPDATE student_courses SET status = 'enrolled' WHERE id = ?").run(existing.id);
      else
        db.prepare("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')").run(studentId, courseId);
      
      db.prepare("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?").run(courseId);
    }
  });
  try {
    tx(courseIds);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

app.get("/api/announcements", (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10").all());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);