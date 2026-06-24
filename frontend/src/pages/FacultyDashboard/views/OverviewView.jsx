import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getFacultyCourses } from '../../../api';
import styles from '../FacultyDashboard.module.scss';

export default function OverviewView({ onSelectCourse }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (user?.email) {
      getFacultyCourses(user.email).then(setCourses).catch(console.error);
    }
  }, [user]);

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-book"></i> My Courses</h2></div>
      {courses.length === 0 ? (
        <div className={styles.emptyState}><i className="fas fa-book-open"></i><p>No courses assigned.</p></div>
      ) : courses.map(c => (
        <div key={c.id} className={styles.courseCard} onClick={() => onSelectCourse(c)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#374151' }}>{c.code} — {c.name}</h3>
              <p style={{ margin: '5px 0', color: '#6b7280', fontSize: '0.9em' }}>Section §{c.section} | {c.credits} Credits | {c.theory_days} {c.theory_time}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#d97706' }}>{c.enrolled_count}</div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>students</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
