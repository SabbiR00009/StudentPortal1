import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getStudentCourses, getActiveSemester } from '../../../api';
import StatCard from '../../../components/StatCard/StatCard';
import styles from '../StudentDashboard.module.scss';

function calculateCGPA(courses) {
  let totalPts = 0, totalCr = 0;
  courses.forEach(c => {
    if (c.grade && c.point !== null) {
      const point = parseFloat(c.point) || 0;
      const credits = parseFloat(c.credits) || 0;
      totalPts += (point * credits);
      totalCr += credits;
    }
  });
  return totalCr ? (totalPts / totalCr).toFixed(2) : '0.00';
}

export default function GradesView() {
  const { user } = useAuth();
  const [grouped, setGrouped] = useState({});
  const [cgpa, setCgpa] = useState('0.00');
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { loadGrades(); }, []);

  const loadGrades = async () => {
    try {
      const { activeSem: active } = await getActiveSemester();
      const allCourses = await getStudentCourses(user.dbId);

      // Finished courses: not in active semester, not dropped
      const finishedCourses = allCourses.filter(c => c.semester !== active && c.status !== 'dropped');

      let completed = 0;
      let pending = 0;
      let credits = 0;

      const g = {};
      finishedCourses.forEach(c => {
        const sem = c.semester;
        if (!g[sem]) g[sem] = [];
        g[sem].push(c);

        completed++;
        credits += parseFloat(c.credits) || 0;
        if (!c.grade) pending++;
      });

      setGrouped(g);
      setCgpa(calculateCGPA(finishedCourses));
      setCompletedCount(completed);
      setTotalCredit(credits);
      setPendingCount(pending);

    } catch (e) { console.error(e); }
  };

  const getGradeClass = (grade) => {
    if (!grade) return '';
    if (grade.startsWith('A')) return styles.gradeA;
    if (grade.startsWith('B')) return styles.gradeB;
    if (grade === 'F') return styles.gradeF;
    return styles.gradeC;
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
    <>
      <div className={styles.statsGrid}>
        <StatCard value={completedCount} label="Completed Courses" />
        <StatCard value={`${totalCredit} Cr`} label="Total Credits" />
        <StatCard value={cgpa} label="Current CGPA" />
        <StatCard value={pendingCount} label="Pending Results" />
      </div>

      <div className={styles.card}>
        <h3 style={{ marginBottom: '20px' }}>Academic Grade Report</h3>

        {Object.keys(grouped).length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No completed courses yet.</p>
        ) : (
          Object.entries(grouped)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([sem, semGrades]) => {
              let totalPoints = 0, totalCr = 0;
              semGrades.forEach(g => {
                if (g.grade && g.point !== null) {
                  const pt = parseFloat(g.point) || 0;
                  const cr = parseFloat(g.credits) || 0;
                  totalPoints += (pt * cr); 
                  totalCr += cr; 
                }
              });
              const sgpa = totalCr ? (totalPoints / totalCr).toFixed(2) : '0.00';

              return (
                <div key={sem} className={styles.semesterBlock}>
                  <div className={`${styles.semesterHeader} ${getThemeClass(sem)}`}>
                    <h4>{sem}</h4>
                    <span className={styles.sgpaBadge}>SGPA: {sgpa}</span>
                  </div>
                  <table className={styles.courseTable}>
                    <thead><tr><th>Code</th><th>Course</th><th>Cr</th><th>Marks</th><th>Grade</th><th>Point</th></tr></thead>
                    <tbody>
                      {semGrades.map((g, i) => (
                        <tr key={i}>
                          <td>{g.code}</td>
                          <td>{g.name}</td>
                          <td>{parseFloat(g.credits).toFixed(1)}</td>
                          <td>{g.marks || '-'}</td>
                          <td>
                            {g.grade ? (
                              <span className={`${styles.gradePill} ${getGradeClass(g.grade)}`}>{g.grade}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9em' }}>Pending</span>
                            )}
                          </td>
                          <td><b>{g.point !== null ? parseFloat(g.point).toFixed(2) : '-'}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
        )}
      </div>
    </>
  );
}
