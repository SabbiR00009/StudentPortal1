import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import BRAND from '../../brand';
import { NAV } from './data';
import s from './public.module.scss';

function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerGrid}>
          <div>
            <div className={s.footerBrand}>
              <img src="/logo.png" alt="BIU" />
              <span>{BRAND.short}</span>
            </div>
            <p className={s.footerAbout}>
              {BRAND.name} is a leading private university dedicated to academic
              excellence, research, and producing graduates who lead with
              integrity and purpose.
            </p>
            <div className={s.footerSocial}>
              <a href={BRAND.social.facebook} aria-label="Facebook" target="_blank" rel="noreferrer"><i className="fab fa-facebook-f" /></a>
              <a href={BRAND.social.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer"><i className="fab fa-linkedin-in" /></a>
              <a href={BRAND.social.youtube} aria-label="YouTube" target="_blank" rel="noreferrer"><i className="fab fa-youtube" /></a>
              <a href={BRAND.social.x} aria-label="X" target="_blank" rel="noreferrer"><i className="fab fa-x-twitter" /></a>
            </div>
          </div>

          <div className={s.footerCol}>
            <h4>Explore</h4>
            <Link to="/about">About BIU</Link>
            <Link to="/academics">Academics</Link>
            <Link to="/research">Research</Link>
            <Link to="/campus-life">Campus Life</Link>
            <Link to="/news">News & Events</Link>
          </div>

          <div className={s.footerCol}>
            <h4>Admissions</h4>
            <Link to="/admissions">How to Apply</Link>
            <Link to="/admissions">Tuition & Fees</Link>
            <Link to="/admissions">Scholarships</Link>
            <Link to="/login/student">Student Portal</Link>
            <Link to="/contact">Contact Us</Link>
          </div>

          <div className={s.footerCol}>
            <h4>Get in Touch</h4>
            <p><i className="fas fa-location-dot" /> &nbsp;{BRAND.address}</p>
            <p><i className="fas fa-phone" /> &nbsp;{BRAND.phone}</p>
            <p><i className="fas fa-envelope" /> &nbsp;{BRAND.email}</p>
          </div>
        </div>
        <div className={s.footerBottom}>
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved. &nbsp;·&nbsp; Privacy Policy &nbsp;·&nbsp; Terms of Use
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={s.page}>
      {/* Top utility bar */}
      <div className={s.topbar}>
        <div className={s.topbarInner}>
          <div className={s.topbarLinks}>
            <span><i className="fas fa-phone" /> &nbsp;{BRAND.phone}</span>
            <a href={`mailto:${BRAND.email}`}><i className="fas fa-envelope" /> &nbsp;{BRAND.email}</a>
          </div>
          <div className={s.topbarLinks}>
            <Link to="/admissions">Apply Now</Link>
            <Link to="/login/faculty">Faculty & Staff</Link>
            <Link to="/login/student">Student Portal</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link to="/" className={s.brand}>
            <img src="/logo.png" alt="BIU logo" className={s.brandLogo} />
            <span className={s.brandText}>
              <span className={s.brandName}>{BRAND.name}</span>
              <span className={s.brandTag}>{BRAND.tagline}</span>
            </span>
          </Link>

          <nav className={open ? s.navOpen : s.nav}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive ? `${s.navLink} ${s.navLinkActive}` : s.navLink
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={s.headerActions}>
            <button className={s.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <i className="fas fa-sun" /> : <i className="fas fa-moon" />}
            </button>
            <button className={s.portalBtn} onClick={() => navigate('/login/student')}>
              Student Login
            </button>
            <button
              className={`${s.iconBtn} ${s.menuToggle}`}
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <i className={open ? 'fas fa-xmark' : 'fas fa-bars'} />
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
      <Footer />
    </div>
  );
}
