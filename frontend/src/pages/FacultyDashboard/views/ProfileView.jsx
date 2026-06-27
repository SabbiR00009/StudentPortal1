import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getFacultyAdvisees } from '../../../api';
import ChangePassword from '../../../components/ChangePassword/ChangePassword';
import styles from '../FacultyDashboard.module.scss';

export default function ProfileView() {
  const { user } = useAuth();
  const [advisees, setAdvisees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      getFacultyAdvisees(user.email)
        .then(data => setAdvisees(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-id-card"></i> My Profile</h2></div>
      <div className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em', fontWeight: 'bold' }}>
            {user?.name?.charAt(0) || 'F'}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{user?.name}</h2>
            <p style={{ margin: '5px 0', color: '#666' }}>{user?.designation || 'Faculty'}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div><label style={{ display: 'block', fontSize: '0.75em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Faculty ID</label><span>{user?.faculty_id}</span></div>
          <div><label style={{ display: 'block', fontSize: '0.75em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Email</label><span>{user?.email}</span></div>
          <div><label style={{ display: 'block', fontSize: '0.75em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Department</label><span>{user?.department}</span></div>
          <div><label style={{ display: 'block', fontSize: '0.75em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Designation</label><span>{user?.designation || 'N/A'}</span></div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: '20px' }}>
        <h3><i className="fas fa-users"></i> Advisees ({advisees.length})</h3>
        {loading ? <p>Loading advisees...</p> : (
          advisees.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {advisees.map(student => (
                <div key={student.id} style={{ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px', background: '#f9fafb' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{student.name}</div>
                  <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '4px' }}>{student.student_id}</div>
                  <div style={{ fontSize: '0.85em', color: '#6b7280' }}>{student.program}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No students assigned for advising.</p>
          )
        )}
      </div>

      <ChangePassword />
    </>
  );
}
