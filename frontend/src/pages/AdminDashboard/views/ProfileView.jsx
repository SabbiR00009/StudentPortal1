import { useAuth } from '../../../context/AuthContext';
import ChangePassword from '../../../components/ChangePassword/ChangePassword';
import styles from '../AdminDashboard.module.scss';

export default function ProfileView() {
  const { user } = useAuth();

  return (
    <>
      <div className={styles.header}>
        <h1><i className="fas fa-user-shield"></i> Admin Profile</h1>
      </div>

      <div className={styles.card} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em', fontWeight: 'bold' }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{user?.name || 'Administrator'}</h2>
            <p style={{ margin: '5px 0', color: '#666' }}>System Administrator</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Email / Login ID</label>
            <span>{user?.email}</span>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Role</label>
            <span style={{ textTransform: 'capitalize' }}>{user?.role || 'Admin'}</span>
          </div>
        </div>
      </div>

      <ChangePassword />
    </>
  );
}
