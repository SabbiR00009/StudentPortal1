import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getStudentCourses, dropCourse as apiDropCourse, getActiveSemester } from '../../../api';
import styles from '../StudentDashboard.module.scss';

function formatSchedule(c) {
  let s = `${c.theory_days || ''} ${c.theory_time || ''}`.trim();
  if (c.lab_day) s += ` | Lab: ${c.lab_day} ${c.lab_time}`;
  return s || 'TBA';
}

export default function ScheduleView() {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState([]);
  const [history, setHistory] = useState({});
  const [enrolledCredits, setEnrolledCredits] = useState(0);
  const [activeSem, setActiveSem] = useState('Current');

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    try {
      const { activeSem: active } = await getActiveSemester();
      setActiveSem(active);

      const allCourses = await getStudentCourses(user.dbId);
      const enrolledCourses = allCourses.filter(c => c.status === 'enrolled' && c.semester === active);
      
      const historyCourses = allCourses.filter(c => !(c.status === 'enrolled' && c.semester === active) && c.status !== 'dropped');

      setEnrolled(enrolledCourses);
      setEnrolledCredits(enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0));

      const grouped = {};
      historyCourses.forEach(c => {
        const sem = c.completed_semester || c.semester || 'Unknown';
        if (!grouped[sem]) grouped[sem] = [];
        grouped[sem].push(c);
      });
      setHistory(grouped);
    } catch (e) { console.error(e); }
  };

  const handleDrop = async (courseId) => {
    if (!window.confirm('Are you sure you want to DROP this course?')) return;
    try {
      const data = await apiDropCourse(user.dbId, courseId);
      if (data.success) { alert('Course Dropped.'); loadSchedule(); }
      else alert(data.error);
    } catch (e) { alert(e.error || 'Error'); }
  };

  const getThemeClass = (semStr) => {
    if (!semStr) return '';
    const s = semStr.toLowerCase();
    if (s.includes('fall')) return styles.themeFall;
    if (s.includes('spring')) return styles.themeSpring;
    if (s.includes('summer')) return styles.themeSummer;
    return '';
  };

  return (
    <div className={styles.card}>
      <h3>Class Schedule & History</h3>

      {enrolled.length > 0 && (
        <div className={styles.semesterBlock}>
          <div className={`${styles.semesterHeader} ${getThemeClass(activeSem)}`}>
            <h4>{activeSem} (Current)</h4>
            <span className={styles.sgpaBadge}>Total: {enrolledCredits} Cr</span>
          </div>
          <table className={styles.courseTable}>
            <thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Schedule</th><th>Room</th><th>Action</th></tr></thead>
            <tbody>
              {enrolled.map(c => (
                <tr key={c.id}>
                  <td>{c.code}</td><td>{c.name}</td><td>{c.credits}</td>
                  <td>{formatSchedule(c)}</td><td>{c.room_number || 'TBA'}</td>
                  <td><button className={styles.removeBtn} onClick={() => handleDrop(c.id)}><i className="fas fa-minus-circle"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {enrolled.length === 0 && (
        <div className={styles.semesterBlock}>
          <div className={`${styles.semesterHeader} ${getThemeClass(activeSem)}`}>
            <h4>{activeSem} (Current)</h4>
          </div>
          <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-inset, #f9fafb)' }}>No active courses this semester.</div>
        </div>
      )}

      {Object.keys(history).length > 0 && (
        <>
          <h3 style={{ margin: '30px 0 10px 0', color: 'var(--text-muted, #6b7280)', borderBottom: '1px solid var(--border-light, #eee)', paddingBottom: '10px' }}>Course History</h3>
          {Object.entries(history)
            .sort((a, b) => b[0].localeCompare(a[0])) 
            .map(([sem, courses]) => (
            <div key={sem} className={styles.semesterBlock}>
              <div className={`${styles.semesterHeader} ${getThemeClass(sem)}`}>
                <h4>{sem}</h4>
                <span className={styles.sgpaBadge}>
                  Courses: {courses.length} | Credits: {courses.reduce((sum, c) => sum + (c.credits || 0), 0)} Cr
                </span>
              </div>
              <table className={styles.courseTable}>
                <thead><tr><th>Code</th><th>Name</th><th>Cr</th><th>Schedule</th><th>Room</th></tr></thead>
                <tbody>
                  {courses.map((c, i) => (
                    <tr key={i}>
                      <td>{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.credits}</td>
                      <td>{formatSchedule(c)}</td>
                      <td>{c.room_number || 'TBA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
