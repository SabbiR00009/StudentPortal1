import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import OverviewView from './views/OverviewView';
import AdvisingView from './views/AdvisingView';
import ProfileView from './views/ProfileView';
import CourseManager from './views/CourseManager';
import styles from './FacultyDashboard.module.scss';

const NAV_ITEMS = [
  { view: 'overview', label: 'My Courses', icon: 'fas fa-book' },
  { view: 'advising', label: 'Advising', icon: 'fas fa-user-check' },
];

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setActiveView('courseManager');
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <OverviewView onSelectCourse={handleSelectCourse} />;
      case 'courseManager': return <CourseManager course={selectedCourse} onBack={() => setActiveView('overview')} />;
      case 'advising': return <AdvisingView />;
      case 'profile': return <ProfileView />;
      default: return <OverviewView onSelectCourse={handleSelectCourse} />;
    }
  };

  return (
    <div className={styles.dashboard}>
      <Navbar title="Faculty Portal" icon="fas fa-chalkboard-teacher" avatarBg="d97706" onLogoClick={() => setActiveView('overview')} onProfileClick={() => setActiveView('profile')} />
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3>Faculty Menu</h3>
          <div className={styles.navMenu}>
            {NAV_ITEMS.map(item => (
              <button key={item.view} className={`${styles.navBtn} ${activeView === item.view ? styles.active : ''}`} onClick={() => setActiveView(item.view)}>
                <i className={item.icon}></i> {item.label}
              </button>
            ))}
            <button className={`${styles.navBtn} ${styles.danger}`} onClick={() => { logout(); }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
        <div className={styles.mainPanel}>{renderView()}</div>
      </div>
    </div>
  );
}
