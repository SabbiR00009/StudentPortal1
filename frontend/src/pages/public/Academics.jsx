import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';
import Banner from './Banner';
import { SCHOOLS } from './data';
import s from './public.module.scss';

export default function Academics() {
  return (
    <PublicLayout>
      <Banner title="Academics & Programs" crumb="Academics" />

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Schools & Faculties</span>
            <h2 className={s.sectionTitle}>Find your program</h2>
            <p className={s.sectionSub}>
              Explore 38 undergraduate and graduate degrees across six schools,
              each designed with input from industry and academia.
            </p>
          </div>

          <div className={`${s.grid} ${s.grid2}`}>
            {SCHOOLS.map((sc) => (
              <div key={sc.name} className={s.card}>
                <div className={s.cardIcon}><i className={`fas ${sc.icon}`} /></div>
                <div className={s.cardTitle}>{sc.name}</div>
                <p className={s.cardText}>{sc.blurb}</p>
                <ul className={s.cardList}>
                  {sc.programs.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.split}>
            <div>
              <span className={s.eyebrow}>Academic Calendar</span>
              <h2 className={s.splitTitle}>A tri-semester system</h2>
              <p className={s.splitText}>
                BIU operates on three semesters per year — Spring, Summer, and Fall —
                giving students flexibility to accelerate their studies or balance
                work and learning. Each semester includes advising, registration,
                mid-terms, and finals, all managed through the Student Portal.
              </p>
              <ul className={s.cardList}>
                <li>Spring: January – April</li>
                <li>Summer: May – August</li>
                <li>Fall: September – December</li>
              </ul>
              <div style={{ marginTop: '1.5rem' }}>
                <Link to="/login/student" className={s.portalBtn}>Go to Student Portal</Link>
              </div>
            </div>
            <img
              className={s.splitImg}
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"
              alt="Students studying"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
