import { useState, useEffect } from 'react';
import { getAdminStudents, getAdminFaculty, getAdminCourses, getAdminOverviewStats } from '../../../api';
import StatCard from '../../../components/StatCard/StatCard';
import styles from '../AdminDashboard.module.scss';

export default function OverviewView({ onNavigate }) {
  const [stats, setStats] = useState({ students: 0, faculty: 0, courses: 0, unreadMessages: 0, pendingDrops: 0 });

  useEffect(() => {
    Promise.all([
      getAdminStudents(), 
      getAdminFaculty(), 
      getAdminCourses(),
      getAdminOverviewStats()
    ])
      .then(([s, f, c, overviewRes]) => {
        setStats({ 
          students: s.length, 
          faculty: f.length, 
          courses: c.length,
          unreadMessages: overviewRes.unreadMessages || 0,
          pendingDrops: overviewRes.pendingDrops || 0
        });
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-chart-pie"></i> Dashboard Overview</h2></div>
      
      <h3 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Action Required</h3>
      <div className={styles.statsGrid}>
        <StatCard 
          value={stats.pendingDrops} 
          label="Pending Drop Requests" 
          onClick={() => onNavigate('drop-requests')} 
          style={stats.pendingDrops > 0 ? { border: '2px solid var(--error-color, #ef4444)' } : {}}
        />
        <StatCard 
          value={stats.unreadMessages} 
          label="Unread Messages" 
          onClick={() => onNavigate('messages')} 
          style={stats.unreadMessages > 0 ? { border: '2px solid var(--error-color, #ef4444)' } : {}}
        />
      </div>

      <h3 style={{ margin: '30px 0 15px 0', color: 'var(--text-main)' }}>Global Records</h3>
      <div className={styles.statsGrid}>
        <StatCard value={stats.students} label="Total Students" onClick={() => onNavigate('students')} />
        <StatCard value={stats.faculty} label="Faculty Members" onClick={() => onNavigate('faculty')} />
        <StatCard value={stats.courses} label="Active Courses" onClick={() => onNavigate('courses')} />
      </div>
    </>
  );
}
