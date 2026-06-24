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
import { getAnnouncements } from '../../api';
import { useEffect } from 'react';
import styles from './StudentDashboard.module.scss';

const NAV_ITEMS = [
  { view: 'home', label: 'Home', icon: 'fas fa-home' },
  { view: 'schedule', label: 'Class Schedule', icon: 'fas fa-calendar-alt' },
  { view: 'grades', label: 'Grade Report', icon: 'fas fa-graduation-cap' },
  { view: 'advising', label: 'Advising Portal', icon: 'fas fa-edit' },
  { view: 'financials', label: 'Financials', icon: 'fas fa-file-invoice-dollar' },
  { view: 'drop', label: 'Drop Semester', icon: 'fas fa-trash-alt', danger: true },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('home');
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    getAnnouncements().then(setAnnouncements).catch(console.error);
  }, []);

  const handleNavigate = (view) => {
    if (view === 'drop') {
      if (window.confirm('WARNING: Drop ENTIRE Semester? This removes ALL courses.')) {
        import('../../api').then(({ dropSemester }) => {
          dropSemester(user.dbId).then(() => {
            alert('Semester Dropped.');
            setActiveView('home');
          }).catch(() => alert('Error'));
        });
      }
      return;
    }
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'home': return <HomeView onNavigate={setActiveView} />;
      case 'schedule': return <ScheduleView />;
      case 'grades': return <GradesView />;
      case 'financials': return <FinancialsView />;
      case 'advising': return <AdvisingView />;
      case 'profile': return <ProfileView />;
      default: return <HomeView onNavigate={setActiveView} />;
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
