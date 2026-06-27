import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getStudent, getStudentGrades } from '../../../api';
import ChangePassword from '../../../components/ChangePassword/ChangePassword';
import styles from '../StudentDashboard.module.scss';

export default function ProfileView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [creditsDone, setCreditsDone] = useState(0);
  const [cgpa, setCgpa] = useState('0.00');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [s, grades] = await Promise.all([
        getStudent(user.dbId),
        getStudentGrades(user.dbId),
      ]);
      setProfile(s);
      setCreditsDone(grades.reduce((sum, g) => sum + (g.credits || 0), 0));
      let totalPts = 0, totalCr = 0;
      grades.forEach(g => { totalPts += ((g.point || 0) * g.credits); totalCr += g.credits; });
      setCgpa(totalCr ? (totalPts / totalCr).toFixed(2) : '0.00');
    } catch (e) { console.error(e); }
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatarXl}>
          {profile.name?.charAt(0) || 'S'}
        </div>
        <div className={styles.profileTitle}>
          <h2>{profile.name}</h2>
          <p style={{ margin: '5px 0', opacity: 0.8 }}>{profile.program || 'N/A'}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <span className={styles.statusBadge}>{profile.student_id}</span>
            <span className={styles.statusBadge} style={{ background: '#e0e7ff', color: '#4338ca' }}>
              Dept: {profile.department}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.profileBody}>
        <div className={styles.profileSection}>
          <h3><i className="fas fa-graduation-cap"></i> Academic Info</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}><label>Unique ID</label><span>{profile.unique_id || 'N/A'}</span></div>
            <div className={styles.infoItem}><label>Admitted</label><span>{profile.admitted_semester || 'N/A'}</span></div>
            <div className={styles.infoItem}><label>Credits Done</label><span>{creditsDone}</span></div>
            <div className={styles.infoItem}><label>Current CGPA</label><span style={{ color: '#4F46E5', fontWeight: 'bold' }}>{cgpa}</span></div>
          </div>
        </div>

        <div className={styles.profileSection}>
          <h3><i className="fas fa-user"></i> Personal Info</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}><label>Date of Birth</label><span>{profile.dob || 'N/A'}</span></div>
            <div className={styles.infoItem}><label>Blood Group</label><span>{profile.blood_group || 'N/A'}</span></div>
            <div className={styles.infoItem}><label>NID / Passport</label><span>{profile.nid || 'N/A'}</span></div>
            <div className={styles.infoItem}><label>Marital Status</label><span>{profile.marital_status || 'N/A'}</span></div>
          </div>
        </div>

        <div className={`${styles.profileSection} ${styles.fullWidth}`}>
          <h3><i className="fas fa-address-card"></i> Contact Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}><label>Email</label><span>{profile.email}</span></div>
            <div className={styles.infoItem}><label>Phone</label><span>{profile.phone || 'N/A'}</span></div>
            <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}><label>Present Address</label><span>{profile.present_address || 'N/A'}</span></div>
            <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}><label>Permanent Address</label><span>{profile.permanent_address || 'N/A'}</span></div>
          </div>
        </div>

        <div className={`${styles.profileSection} ${styles.fullWidth}`}>
          <h3><i className="fas fa-chalkboard-teacher"></i> Academic Advisor</h3>
          <div className={styles.advisorBox}>
            <div className={styles.advisorIcon}><i className="fas fa-user-tie"></i></div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{profile.advisor_name || 'Not Assigned'}</div>
              <div style={{ color: '#666', fontSize: '0.9em' }}>{profile.advisor_email || ''}</div>
              <div style={{ fontSize: '0.85em', color: '#4F46E5', marginTop: '5px', fontWeight: 600 }}>(Faculty Advisor)</div>
            </div>
          </div>
        </div>
      </div>
      <ChangePassword />
    </div>
  );
}
