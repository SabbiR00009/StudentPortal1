const pool = require('../../db');
const { checkTimeConflict } = require('../../helpers/conflictChecker');
const { getActiveSemester } = require('../../helpers/semesterManager');

const checkAccess = async (req, res) => {
  try {
    const studentId = req.user.dbId;
    const activeSem = await getActiveSemester();

    // Check if the student has an approved drop request for the current semester
    const [drops] = await pool.query(
      "SELECT id FROM semester_drop_requests WHERE student_id = ? AND semester = ? AND status = 'approved'",
      [studentId, activeSem]
    );

    if (drops.length > 0) {
      return res.json({ allowed: false, message: "Advising disabled: You have dropped the current semester.", credits: 0 });
    }

    const [creditResult] = await pool.query(`
        SELECT SUM(c.credits) as total 
        FROM grades g JOIN courses c ON g.course_id = c.id 
        WHERE g.student_id = ? AND g.grade != 'F'
    `, [studentId]);
    
    const completedCredits = creditResult[0].total || 0;
    const now = new Date();
    
    const [slots] = await pool.query("SELECT * FROM advising_slots");

    const activeSlot = slots.find(s => 
      completedCredits >= s.min_credits && 
      completedCredits <= s.max_credits && 
      now >= new Date(s.start_time) && 
      now <= new Date(s.end_time)
    );

    if (activeSlot) return res.json({ allowed: true, credits: completedCredits });
    res.json({ allowed: false, message: "No active advising slot for your credits.", credits: completedCredits });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getCourses = async (req, res) => {
  try {
    const { dept } = req.query;
    const activeSem = await getActiveSemester();
    
    let sql = "SELECT *, (max_students - enrolled_count) as seats_available FROM courses";
    const params = [];
    const conditions = ["semester = ?"];
    params.push(activeSem);

    if (dept && dept !== 'All') { conditions.push("department = ?"); params.push(dept); }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY code";

    const [courses] = await pool.query(sql, params);
    
    // Also return activeSem so frontend can display it!
    res.json({ courses, activeSem });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const validateSlip = async (req, res) => {
  try {
    const { courseId, slipIds } = req.body;
    const studentId = req.user.dbId;
    const activeSem = await getActiveSemester();

    const [newCourses] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
    if (newCourses.length === 0) return res.status(404).json({ success: false, error: "Course not found" });
    const newCourse = newCourses[0];

    // Check if course belongs to active semester
    if (newCourse.semester !== activeSem) {
      return res.json({ success: false, error: "Cannot register for a past or inactive semester course." });
    }

    const [enrolled] = await pool.query(`
        SELECT c.* FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        WHERE sc.student_id = ? AND sc.status = 'enrolled' AND c.semester = ?
    `, [studentId, activeSem]);

    const slipCourses = [];
    for (const id of slipIds) {
      const [sc] = await pool.query("SELECT * FROM courses WHERE id = ?", [id]);
      if (sc.length > 0) slipCourses.push(sc[0]);
    }

    const currentSchedule = [...enrolled, ...slipCourses];

    const duplicate = currentSchedule.find(c => c.code === newCourse.code);
    if (duplicate) {
      if (duplicate.id === newCourse.id) return res.json({ success: false, error: "Already selected/enrolled." });
      return res.json({ success: false, error: `Duplicate: You have ${duplicate.code} (Section ${duplicate.section}) selected.` });
    }

    const [freshCourse] = await pool.query("SELECT enrolled_count, max_students FROM courses WHERE id = ?", [courseId]);
    if (freshCourse[0].enrolled_count >= freshCourse[0].max_students) {
      return res.json({ success: false, error: "Course is Full." });
    }

    const check = checkTimeConflict(newCourse, currentSchedule);
    if (check.conflict) {
      return res.json({ success: false, error: check.message });
    }

    return res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const confirmSlip = async (req, res) => {
  const { courseIds } = req.body;
  const studentId = req.user.dbId;
  const activeSem = await getActiveSemester();

  try {
    const newCourses = [];
    for (const id of courseIds) {
        const [nc] = await pool.query("SELECT * FROM courses WHERE id = ? AND semester = ?", [id, activeSem]);
        if(nc.length > 0) newCourses.push(nc[0]);
    }
    
    if (newCourses.length !== courseIds.length) {
      return res.status(400).json({ success: false, message: "One or more courses are invalid or not from the current semester." });
    }

    const [alreadyEnrolled] = await pool.query(`
        SELECT c.* FROM student_courses sc 
        JOIN courses c ON sc.course_id = c.id 
        WHERE sc.student_id = ? AND sc.status = 'enrolled' AND c.semester = ?
    `, [studentId, activeSem]);

    let virtualSchedule = [...alreadyEnrolled];

    for (const newCourse of newCourses) {
      if (newCourse.enrolled_count >= newCourse.max_students) {
        return res.status(400).json({ success: false, message: `Course ${newCourse.code} is FULL.` });
      }

      const duplicate = virtualSchedule.find(c => c.code === newCourse.code);
      if (duplicate && duplicate.id !== newCourse.id) {
        return res.status(400).json({ success: false, message: `Duplicate: You cannot take ${newCourse.code} twice (Sec ${duplicate.section} vs Sec ${newCourse.section}).` });
      }

      const check = checkTimeConflict(newCourse, virtualSchedule);
      if (check.conflict) {
        return res.status(400).json({ success: false, message: check.message });
      }

      virtualSchedule.push(newCourse);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const courseId of courseIds) {
        const [existing] = await connection.query("SELECT id, status FROM student_courses WHERE student_id = ? AND course_id = ?", [studentId, courseId]);
        
        if (existing.length > 0 && existing[0].status === "enrolled") continue;

        if (existing.length > 0) {
            await connection.query("UPDATE student_courses SET status = 'enrolled' WHERE id = ?", [existing[0].id]);
        } else {
            await connection.query("INSERT INTO student_courses (student_id, course_id, status) VALUES (?, ?, 'enrolled')", [studentId, courseId]);
        }

        await connection.query("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?", [courseId]);
      }
      
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

module.exports = {
  checkAccess,
  getCourses,
  validateSlip,
  confirmSlip
};
