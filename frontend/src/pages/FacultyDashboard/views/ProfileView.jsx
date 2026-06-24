import { useAuth } from '../../../context/AuthContext';
import styles from '../FacultyDashboard.module.scss';

export default function ProfileView() {
  const { user } = useAuth();

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
    </>
  );
}
