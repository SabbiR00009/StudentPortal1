import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import HomeView from './views/HomeView';
import ScheduleView from './views/ScheduleView';
import GradesView from './views/GradesView';
import FinancialsView from './views/FinancialsView';
import AdvisingView from './views/AdvisingView';
import ProfileView from './views/ProfileView';
import DropSemesterView from './views/DropSemesterView';
import ContactView from './views/ContactView';
import { getAnnouncements, request } from '../../api';
import { useEffect } from 'react';
import styles from './StudentDashboard.module.scss';

const NAV_ITEMS = [
  { view: 'overview', label: 'Overview', icon: 'fas fa-home' },
  { view: 'grades', label: 'Grades & Schedule', icon: 'fas fa-graduation-cap' },
  { view: 'financials', label: 'Financials', icon: 'fas fa-file-invoice-dollar' },
  { view: 'advising', label: 'Advising', icon: 'fas fa-calendar-alt' },
  { view: 'contact', label: 'Contact', icon: 'fas fa-envelope' },
  { view: 'drop', label: 'Drop Semester', icon: 'fas fa-ban' }
];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [announcements, setAnnouncements] = useState([]);
  const [activeSem, setActiveSem] = useState(null);

  useEffect(() => {
    getAnnouncements().then(setAnnouncements).catch(console.error);
  }, []);

  const handleNavigate = (view) => {
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <HomeView activeSem={activeSem} onNavigate={setActiveView} />;
      case 'grades': return <GradesView activeSem={activeSem} />;
      case 'financials': return <FinancialsView activeSem={activeSem} />;
      case 'advising': return <AdvisingView activeSem={activeSem} />;
      case 'contact': return <ContactView />;
      case 'drop': return <DropSemesterView />;
      default: return <HomeView activeSem={activeSem} />;
    }
  };

  return (
    <div className={styles.dashboard}>
      <Navbar
        title="SAN University"
        onLogoClick={() => setActiveView('home')}
      />

      <div className={styles.content}>
        <div className={styles.mainPanel}>
          <div className={styles.viewSection}>
            {renderView()}
          </div>
        </div>

        <div>
          <Sidebar
            title="Menu"
            items={NAV_ITEMS}
            activeView={activeView}
            onNavigate={handleNavigate}
          >
            <div className={styles.card}>
              <h3>Announcements</h3>
              <div>
                {announcements.length > 0 ? announcements.map((a, i) => (
                  <div key={i} style={{ padding: '15px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontWeight: 700, color: '#374151', marginBottom: '4px' }}>{a.title}</div>
                    <div style={{ fontSize: '0.9em', color: '#6b7280', lineHeight: 1.4 }}>{a.content}</div>
                  </div>
                )) : <p style={{ color: '#666', padding: '10px' }}>No announcements.</p>}
              </div>
            </div>
          </Sidebar>
        </div>
      </div>
    </div>
  );
}
