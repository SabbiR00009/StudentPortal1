import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import OverviewView from './views/OverviewView';
import StudentsView from './views/StudentsView';
import FacultyView from './views/FacultyView';
import CoursesView from './views/CoursesView';
import FinancialsView from './views/FinancialsView';
import SlotsView from './views/SlotsView';
import AdminsView from './views/AdminsView';
import AnnouncementsView from './views/AnnouncementsView';
import DropRequestsView from './views/DropRequestsView';
import MessagesView from './views/MessagesView';
import styles from './AdminDashboard.module.scss';

const NAV_ITEMS = [
  { view: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
  { view: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
  { view: 'drop-requests', label: 'Drop Requests', icon: 'fas fa-file-signature' },
  { view: 'students', label: 'Students', icon: 'fas fa-user-graduate' },
  { view: 'faculty', label: 'Faculty', icon: 'fas fa-chalkboard-teacher' },
  { view: 'courses', label: 'Courses', icon: 'fas fa-book' },
  { view: 'financials', label: 'Financials', icon: 'fas fa-dollar-sign' },
  { view: 'slots', label: 'Advising Slots', icon: 'fas fa-clock' },
  { view: 'admins', label: 'Manage Admins', icon: 'fas fa-shield-alt' },
  { view: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <OverviewView onNavigate={setActiveView} />;
      case 'messages': return <MessagesView />;
      case 'drop-requests': return <DropRequestsView />;
      case 'students': return <StudentsView />;
      case 'faculty': return <FacultyView />;
      case 'courses': return <CoursesView />;
      case 'financials': return <FinancialsView />;
      case 'slots': return <SlotsView />;
      case 'admins': return <AdminsView />;
      case 'announcements': return <AnnouncementsView />;
      default: return <OverviewView onNavigate={setActiveView} />;
    }
  };

  return (
    <div className={styles.dashboard}>
      <Navbar
        title="Admin Panel"
        icon="fas fa-shield-alt"
        avatarBg="dc2626"
        onLogoClick={() => setActiveView('overview')}
      />
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3>Control Panel</h3>
          <div className={styles.navMenu}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.view}
                className={`${styles.navBtn} ${activeView === item.view ? styles.active : ''}`}
                onClick={() => setActiveView(item.view)}
              >
                <i className={item.icon}></i> {item.label}
              </button>
            ))}
            <button
              className={`${styles.navBtn} ${styles.danger}`}
              onClick={() => { logout(); navigate('/'); }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
        <div className={styles.mainPanel}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
