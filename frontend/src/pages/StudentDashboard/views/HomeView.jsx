import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getStudentCourses, getActiveSemester } from '../../../api';
import StatCard from '../../../components/StatCard/StatCard';
import styles from '../StudentDashboard.module.scss';

function formatSchedule(c) {
  let s = `${c.theory_days || ''} ${c.theory_time || ''}`.trim();
  if (c.lab_day) s += ` | Lab: ${c.lab_day} ${c.lab_time}`;
  return s || 'TBA';
}

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

export default function HomeView({ onNavigate }) {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState([]);
  const [dropped, setDropped] = useState([]);
  const [cgpa, setCgpa] = useState('0.00');
  const [completedCredits, setCompletedCredits] = useState(0);
  const [semestersDone, setSemestersDone] = useState(0);
  const [enrolledCredits, setEnrolledCredits] = useState(0);
  const [activeSem, setActiveSem] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { activeSem: active } = await getActiveSemester();
      setActiveSem(active);

      const allCourses = await getStudentCourses(user.dbId);

      const enrolledCourses = allCourses.filter(c => c.status === 'enrolled' && c.semester === active);
      const finishedCourses = allCourses.filter(c => c.semester !== active && c.status !== 'dropped');
      const droppedCourses = allCourses.filter(c => c.status === 'dropped' && c.semester === active);

      setEnrolled(enrolledCourses);
      setDropped(droppedCourses);
      setEnrolledCredits(enrolledCourses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0));
      setCompletedCredits(finishedCourses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0));
      setCgpa(calculateCGPA(finishedCourses));
      setSemestersDone(new Set(finishedCourses.map(g => g.semester)).size);
    } catch (e) {
      console.error(e);
    }
  };

  const isDropped = enrolled.length === 0 && dropped.length > 0;

  return (
    <>
      <div className={styles.welcomeSection}>
        <h2>Welcome back, {user.name}!</h2>
        <p>Here is your academic performance overview.</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard value={cgpa} label="Current CGPA" onClick={() => onNavigate('grades')} />
        <StatCard
          value={<>{enrolled.length} <small>({enrolledCredits} Cr)</small></>}
          label="Enrolled Courses"
          onClick={() => onNavigate('schedule')}
        />
        <StatCard value={completedCredits} label="Completed Credits" onClick={() => onNavigate('grades')} />
        <StatCard value={semestersDone} label="Semesters Done" onClick={() => onNavigate('grades')} />
      </div>

      <div className={styles.card}>
        <h3>Current Semester Schedule ({activeSem})</h3>
        {isDropped ? (
          <div className={styles.droppedBanner}>
            <i className="fas fa-ban"></i>
            <h3>You have dropped this semester ({activeSem})</h3>
          </div>
        ) : enrolled.length > 0 ? (
          enrolled.map((c, i) => (
            <div key={i} style={{ padding: '15px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.code} - {c.name}</div>
                <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{formatSchedule(c)}</div>
                <div style={{ fontSize: '0.8em', color: 'var(--indigo-primary)' }}>Room: {c.room_number || 'TBA'}</div>
              </div>
              <span style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8em', fontWeight: 600 }}>
                {c.credits} Cr
              </span>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px' }}>No enrolled courses.</p>
        )}
      </div>
    </>
  );
}
