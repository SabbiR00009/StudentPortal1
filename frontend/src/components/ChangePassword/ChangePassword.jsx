import { useState } from 'react';
import { changePassword } from '../../api';
import { useAuth } from '../../context/AuthContext';
import styles from './ChangePassword.module.scss';

export default function ChangePassword() {
  const { setRequiresPasswordChange } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ text: "New passwords don't match.", type: "error" });
    }
    if (newPassword.length < 6) {
      return setMessage({ text: "Password must be at least 6 characters.", type: "error" });
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await changePassword(currentPassword, newPassword);
      setMessage({ text: "Password updated successfully!", type: "success" });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear flag to auto-redirect if they were on the forced change page
      if (setRequiresPasswordChange) {
        setRequiresPasswordChange(false);
      }
    } catch (err) {
      setMessage({ text: err.error || "Failed to update password.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3><i className="fas fa-lock"></i> Change Password</h3>
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
