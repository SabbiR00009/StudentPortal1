import { useAuth } from '../../context/AuthContext';
import ChangePassword from '../../components/ChangePassword/ChangePassword';

export default function ForceChangePassword() {
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', background: '#fee2e2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 15px auto' }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 style={{ color: '#1f2937', margin: '0 0 10px 0' }}>Action Required</h2>
          <p style={{ color: '#4b5563', margin: 0 }}>
            Hello {user?.name}, you are currently using the default password. 
            For security reasons, you must change your password before you can access the dashboard.
          </p>
        </div>
        
        <ChangePassword />
      </div>
    </div>
  );
}
