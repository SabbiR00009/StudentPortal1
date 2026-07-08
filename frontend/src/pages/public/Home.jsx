import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';
import BRAND from '../../brand';
import { SCHOOLS, WHY_BIU, NEWS, EVENTS } from './data';
import s from './public.module.scss';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.heroKicker}>Est. {BRAND.founded} · Dhaka, Bangladesh</span>
          <h1 className={s.heroTitle}>
            Shaping Tomorrow's <span>Leaders & Innovators</span>
          </h1>
          <p className={s.heroText}>
            At {BRAND.name}, world-class teaching meets hands-on research and a
            vibrant campus community — preparing you to make an impact from day one.
          </p>
          <div className={s.heroButtons}>
            <Link to="/admissions" className={s.btnPrimary}>Apply for Admission</Link>
            <Link to="/academics" className={s.btnGhost}>Explore Programs</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={s.stats}>
        <div className={s.statsInner}>
          {BRAND.stats.map((st) => (
            <div key={st.label}>
              <div className={s.statValue}>{st.value}</div>
              <div className={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Welcome / split */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.split}>
            <img
              className={s.splitImg}
              src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1000&q=80"
              alt="BIU campus"
            />
            <div>
              <span className={s.eyebrow}>Welcome to BIU</span>
              <h2 className={s.splitTitle}>A community built on knowledge, integrity, and excellence</h2>
              <p className={s.splitText}>
                For over two decades, {BRAND.name} has been a home for curious minds
                and ambitious dreamers. Our accredited programs, expert faculty, and
                modern facilities empower students to think critically, act ethically,
                and lead confidently.
              </p>
              <p className={s.splitText}>
                From engineering and business to law, pharmacy, and the arts, we offer
                a future-ready education grounded in real-world experience.
              </p>
              <Link to="/about" className={s.portalBtn}>Learn more about us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why BIU */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Why Choose BIU</span>
            <h2 className={s.sectionTitle}>An education that opens doors</h2>
            <p className={s.sectionSub}>Everything you need to learn, grow, and succeed — all in one place.</p>
          </div>
          <div className={`${s.grid} ${s.grid4}`}>
            {WHY_BIU.map((f) => (
              <div key={f.title} className={s.card}>
                <div className={s.cardIcon}><i className={`fas ${f.icon}`} /></div>
                <div className={s.cardTitle}>{f.title}</div>
                <p className={s.cardText}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schools preview */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Academics</span>
            <h2 className={s.sectionTitle}>Schools & Faculties</h2>
            <p className={s.sectionSub}>Choose from 38 undergraduate and graduate programs across six schools.</p>
          </div>
          <div className={`${s.grid} ${s.grid3}`}>
            {SCHOOLS.slice(0, 6).map((sc) => (
              <div key={sc.name} className={s.card}>
                <div className={s.cardIcon}><i className={`fas ${sc.icon}`} /></div>
                <div className={s.cardTitle}>{sc.name}</div>
                <p className={s.cardText}>{sc.blurb}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/academics" className={s.portalBtn}>View all programs</Link>
          </div>
        </div>
      </section>

      {/* News + events */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Latest from campus</span>
            <h2 className={s.sectionTitle}>News & Upcoming Events</h2>
          </div>
          <div className={s.split} style={{ alignItems: 'stretch' }}>
            <div className={`${s.grid} ${s.grid2}`}>
              {NEWS.slice(0, 4).map((n) => (
                <article key={n.id} className={s.newsCard}>
                  <div className={s.newsBody}>
                    <span className={s.badge}>{n.category}</span>
                    <span className={s.newsDate}>{fmtDate(n.date)}</span>
                    <h3 className={s.newsTitle}>{n.title}</h3>
                    <p className={s.newsExcerpt}>{n.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
            <div>
              {EVENTS.map((e) => (
                <div key={e.title} className={s.eventRow}>
                  <div className={s.eventDate}>
                    <div className={s.eventDay}>{e.day}</div>
                    <div className={s.eventMonth}>{e.month}</div>
                  </div>
                  <div>
                    <div className={s.eventTitle}>{e.title}</div>
                    <div className={s.eventPlace}>{e.place}</div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/news" className={s.portalBtn}>All news & events</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <h2 className={s.ctaTitle}>Your future starts at BIU</h2>
        <p className={s.ctaText}>
          Applications for the Fall 2026 intake are now open. Take the first step
          toward a career you'll be proud of.
        </p>
        <div className={s.heroButtons} style={{ justifyContent: 'center' }}>
          <Link to="/admissions" className={s.btnPrimary}>Start your application</Link>
          <Link to="/contact" className={s.btnGhost}>Talk to an advisor</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
