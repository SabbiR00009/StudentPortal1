const pool = require('../db');

function calculateCurrentSemester(date = new Date()) {
  const month = date.getMonth() + 1; // 1 to 12
  const year = date.getFullYear();

  if (month >= 1 && month <= 4) return `Spring-${year}`;
  if (month >= 5 && month <= 8) return `Summer-${year}`;
  if (month >= 9 && month <= 12) return `Fall-${year}`;
}

async function transitionSemester(oldSem, newSem) {
  console.log(`[SEMESTER TRANSITION] Transitioning from ${oldSem} to ${newSem}...`);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Process Completions & Pendings
    // Get all enrolled courses from the OLD semester
    const [enrolled] = await connection.query(`
      SELECT sc.id, sc.student_id, sc.course_id 
      FROM student_courses sc 
      JOIN courses c ON sc.course_id = c.id 
      WHERE c.semester = ? AND sc.status = 'enrolled'
    `, [oldSem]);

    for (const record of enrolled) {
      // Check if this student has a grade for this course in the grades table
      const [grades] = await connection.query(`
        SELECT id FROM grades WHERE student_id = ? AND course_id = ?
      `, [record.student_id, record.course_id]);

      if (grades.length > 0) {
        // Graded -> completed
        await connection.query("UPDATE student_courses SET status = 'completed' WHERE id = ?", [record.id]);
      } else {
        // Not graded -> pending
        await connection.query("UPDATE student_courses SET status = 'pending' WHERE id = ?", [record.id]);
      }
    }

    // 2. Clone active courses for the NEW semester
    const [oldCourses] = await connection.query("SELECT * FROM courses WHERE semester = ?", [oldSem]);
    
    for (const oc of oldCourses) {
      await connection.query(`
        INSERT IGNORE INTO courses (
          code, name, department, credits, instructor, instructor_email, 
          theory_days, theory_time, lab_day, lab_time, 
          room_number, section, semester, max_students, enrolled_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [
        oc.code, oc.name, oc.department, oc.credits, oc.instructor, oc.instructor_email,
        oc.theory_days, oc.theory_time, oc.lab_day, oc.lab_time,
        oc.room_number, oc.section, newSem, oc.max_students
      ]);
    }

    // 3. Update the System Settings
    await connection.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'active_semester'", [newSem]);

    await connection.commit();
    console.log(`[SEMESTER TRANSITION] Successfully transitioned to ${newSem}!`);
  } catch (err) {
    await connection.rollback();
    console.error("[SEMESTER TRANSITION ERROR]", err);
  } finally {
    connection.release();
  }
}

async function checkAndTransitionSemester(mockDate = null) {
  try {
    // Determine expected semester
    const expectedSem = calculateCurrentSemester(mockDate || new Date());
    
    // Get actual semester from DB
    const [rows] = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'active_semester'");
    
    let activeSem = "Fall-2025"; // Fallback default
    if (rows.length > 0) activeSem = rows[0].setting_value;

    if (activeSem !== expectedSem) {
      // It's time to transition!
      await transitionSemester(activeSem, expectedSem);
      return { transitioned: true, old: activeSem, new: expectedSem };
    }
    
    return { transitioned: false, current: activeSem };
  } catch (e) {
    console.error("[SEMESTER CHECK ERROR]", e);
    return { error: e.message };
  }
}

async function getActiveSemester() {
  const [rows] = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'active_semester'");
  if (rows.length > 0) return rows[0].setting_value;
  return "Fall-2025";
}

module.exports = {
  calculateCurrentSemester,
  transitionSemester,
  checkAndTransitionSemester,
  getActiveSemester
};
