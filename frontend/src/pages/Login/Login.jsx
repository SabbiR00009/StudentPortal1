import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api';
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
        if (data.userType === 'admin') {
          loginAdmin(data.user);
          navigate('/admin');
        } else if (data.userType === 'faculty') {
          loginFaculty(data.user);
          navigate('/faculty');
        } else if (data.userType === 'student') {
          loginStudent(data.student);
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
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
        </div>
      </div>
    </div>
  );
}
