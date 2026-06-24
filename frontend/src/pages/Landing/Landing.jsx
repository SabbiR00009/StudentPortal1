import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import styles from './Landing.module.scss';

export default function Landing() {
  const navigate = useNavigate();
  const { user, userType } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (userType === 'student') navigate('/dashboard');
      else if (userType === 'admin') navigate('/admin');
      else if (userType === 'faculty') navigate('/faculty');
    }
  }, [user, userType, navigate]);

  return (
    <div className={styles.landing}>
      <nav className={styles.nav}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Logo" className={styles.logo} />
          <span className={styles.univName}>SAN UNIVERSITY</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#about">About</a>
          <a href="#academics">Academics</a>
          <a href="#admissions">Admissions</a>
          <button
            className={styles.btnLoginTrigger}
            onClick={() => navigate('/login/student')}
          >
            Student Portal
          </button>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1>Scaring the Future,<br />Building Legends.</h1>
          <p>
            Join the elite ranks of the world's most prestigious institution.
            Excellence is not just a goal; it's our tradition.
          </p>
          <div className={styles.heroButtons}>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate('/login/student')}
            >
              Student Login
            </button>
            <button
              className={styles.btnOutline}
              onClick={() => navigate('/login/faculty')}
            >
              Faculty/ Admin Login
            </button>
          </div>
        </div>
      </header>

      <section className={styles.features} id="about">
        <div className={styles.featureCard}>
          <i className="fas fa-graduation-cap"></i>
          <h3>World Class Academics</h3>
          <p>Top-tier programs designed to push your boundaries and expand your horizons.</p>
        </div>
        <div className={styles.featureCard}>
          <i className="fas fa-flask"></i>
          <h3>Cutting Edge Research</h3>
          <p>Leading the way in innovation, discovery, and terrifyingly good science.</p>
        </div>
        <div className={styles.featureCard}>
          <i className="fas fa-users"></i>
          <h3>Vibrant Campus</h3>
          <p>A community that feels like family. Join clubs, sports, and legacy societies.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 SAN University. All Rights Reserved. | <a href="#">Privacy Policy</a></p>
      </footer>
    </div>
  );
}
