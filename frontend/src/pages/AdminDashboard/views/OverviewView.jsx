import { useState, useEffect } from 'react';
import { getAdminStudents, getAdminFaculty, getAdminCourses } from '../../../api';
import StatCard from '../../../components/StatCard/StatCard';
import styles from '../AdminDashboard.module.scss';

export default function OverviewView({ onNavigate }) {
  const [stats, setStats] = useState({ students: 0, faculty: 0, courses: 0 });

  useEffect(() => {
    Promise.all([getAdminStudents(), getAdminFaculty(), getAdminCourses()])
      .then(([s, f, c]) => setStats({ students: s.length, faculty: f.length, courses: c.length }))
      .catch(console.error);
  }, []);

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-chart-pie"></i> Dashboard Overview</h2></div>
      <div className={styles.statsGrid}>
        <StatCard value={stats.students} label="Total Students" onClick={() => onNavigate('students')} />
        <StatCard value={stats.faculty} label="Faculty Members" onClick={() => onNavigate('faculty')} />
        <StatCard value={stats.courses} label="Active Courses" onClick={() => onNavigate('courses')} />
      </div>
    </>
  );
}
