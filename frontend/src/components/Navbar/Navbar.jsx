import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './Navbar.module.scss';

export default function Navbar({ title, icon, avatarBg, onLogoClick, onProfileClick }) {
  const { user, userType, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const avatarUrl = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=${avatarBg || '4F46E5'}&color=fff`;

  return (
    <div className={styles.navbar}>
      <div className={styles.logoContainer} onClick={onLogoClick}>
        <img src="/logo.png" alt="BIU Logo" className={styles.logo} />
        <h1>{icon && <i className={icon}></i>} {title || 'Bengal International University'}</h1>
      </div>

      <div className={styles.userInfo}>
        <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle Theme">
          {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
        </button>
        <div className={styles.userAvatar} onClick={onProfileClick} style={{ cursor: onProfileClick ? 'pointer' : 'default' }}>
          <img src={avatarUrl} alt="Profile" />
        </div>
        <div className={styles.userMeta} onClick={onProfileClick} style={{ cursor: onProfileClick ? 'pointer' : 'default' }}>
          <span className={styles.userName}>{user?.name || 'User'}</span>
          <span className={styles.userId}>
            {userType === 'student' ? `ID: ${user?.student_id}` :
             userType === 'admin' ? 'System Control' :
             user?.email || 'Faculty'}
          </span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
