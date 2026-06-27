import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login, submitPasswordResetRequest } from '../../api';
import styles from './Login.module.scss';

export default function Login() {
  const { role } = useParams();
  const loginRole = role || 'student';
  const navigate = useNavigate();
  const { loginStudent, loginAdmin, loginFaculty } = useAuth();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotDob, setForgotDob] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const isFacultyAdmin = loginRole === 'faculty' || loginRole === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id.trim() || !password.trim()) {
      setError('Please enter both ID and Password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await login(id.trim(), password.trim(), loginRole);

      if (data.success) {
        const mustChange = data.requiresPasswordChange;
        
        if (data.userType === 'admin') {
          loginAdmin(data.user, mustChange);
          navigate(mustChange ? '/force-change-password' : '/admin');
        } else if (data.userType === 'faculty') {
          loginFaculty(data.user, mustChange);
          navigate(mustChange ? '/force-change-password' : '/faculty');
        } else if (data.userType === 'student') {
          loginStudent(data.student, mustChange);
          navigate(mustChange ? '/force-change-password' : '/dashboard');
        }
      }
    } catch (err) {
      setError(err.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotId.trim() || !forgotEmail.trim() || !forgotDob) {
      setForgotError('Please fill in all fields for verification.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMsg('');
    try {
      const res = await submitPasswordResetRequest(forgotId.trim(), forgotEmail.trim(), forgotDob);
      setForgotMsg(res.message || 'Request submitted successfully!');
      setForgotId('');
      setForgotEmail('');
      setForgotDob('');
    } catch (err) {
      setForgotError(err.error || 'Failed to submit request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h1>SAN University</h1>
          <p>Welcome to the Next-Gen Student Portal.</p>
          <button className={styles.btnBack} onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back to Home
          </button>
        </div>

        <div className={styles.right}>
          <h2
            className={styles.title}
            style={{ color: isFacultyAdmin ? '#ec282b' : '#1e3a8a' }}
          >
            {isFacultyAdmin ? 'Faculty & Admin Portal' : 'Student Sign In'}
          </h2>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>
                {isFacultyAdmin ? 'Email or Faculty ID' : 'Student ID'}
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={
                  isFacultyAdmin
                    ? 'admin@san.edu / F-CSE-101'
                    : 'e.g., 2025-3-60-001'
                }
                required
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.passwordGroup}`}>
              <label>Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.togglePassword}`}
                onClick={() => setShowPassword(!showPassword)}
                title="Show/Hide Password"
              ></i>
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Secure Login'}
            </button>
          </form>

          {!isFacultyAdmin && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={() => { setShowForgot(true); setForgotMsg(''); setForgotError(''); }}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.9em', textDecoration: 'underline' }}
              >
                <i className="fas fa-key"></i> Forgot Password?
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a' }}><i className="fas fa-key"></i> Password Recovery</h3>
              <button onClick={() => setShowForgot(false)} style={{ background: 'none', border: 'none', fontSize: '1.4em', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.9em', marginBottom: '20px' }}>
              To verify your identity, please enter your <strong>Student ID</strong>, <strong>registered email</strong>, and <strong>date of birth</strong>. Only matching details will be accepted.
            </p>

            {forgotMsg ? (
              <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '1.5em', marginBottom: '8px', display: 'block' }}></i>
                <strong>{forgotMsg}</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85em' }}>Your password will be reset to the default once the admin approves.</p>
                <button onClick={() => setShowForgot(false)} style={{ marginTop: '15px', background: '#10b981', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                {forgotError && <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '0.9em', background: '#fef2f2', padding: '10px', borderRadius: '6px' }}><i className="fas fa-exclamation-triangle"></i> {forgotError}</div>}
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85em' }}>Student ID</label>
                  <input
                    type="text"
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value)}
                    placeholder="e.g., 2025-3-60-001"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.95em', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85em' }}>Registered Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your.email@san.edu"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.95em', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85em' }}>Date of Birth</label>
                  <input
                    type="date"
                    value={forgotDob}
                    onChange={(e) => setForgotDob(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.95em', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{ flex: 1, padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {forgotLoading ? 'Verifying...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
