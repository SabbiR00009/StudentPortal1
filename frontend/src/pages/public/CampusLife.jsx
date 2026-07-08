import PublicLayout from './PublicLayout';
import Banner from './Banner';
import { CAMPUS_HIGHLIGHTS } from './data';
import s from './public.module.scss';

const GALLERY = [
  'https://images.unsplash.com/photo-1591123720164-de1348028b4a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&w=800&q=80',
];

export default function CampusLife() {
  return (
    <PublicLayout>
      <Banner title="Campus Life" crumb="Campus Life" />

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Life at BIU</span>
            <h2 className={s.sectionTitle}>More than a classroom</h2>
            <p className={s.sectionSub}>
              A safe, inclusive, and energetic campus where lifelong friendships and
              leadership skills are forged.
            </p>
          </div>
          <div className={`${s.grid} ${s.grid3}`}>
            {CAMPUS_HIGHLIGHTS.map((h) => (
              <div key={h.title} className={s.card}>
                <div className={s.cardIcon}><i className={`fas ${h.icon}`} /></div>
                <div className={s.cardTitle}>{h.title}</div>
                <p className={s.cardText}>{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Snapshots</span>
            <h2 className={s.sectionTitle}>Around Campus</h2>
          </div>
          <div className={`${s.grid} ${s.grid3}`}>
            {GALLERY.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Campus ${i + 1}`}
                loading="lazy"
                style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 14 }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.split}>
            <div>
              <span className={s.eyebrow}>Student Support</span>
              <h2 className={s.splitTitle}>We've got your back</h2>
              <p className={s.splitText}>
                From your first day to graduation and beyond, BIU offers the support
                you need to thrive academically, personally, and professionally.
              </p>
              <ul className={s.cardList}>
                <li>Academic advising and peer mentoring</li>
                <li>Career services and job-placement support</li>
                <li>Counseling and wellness services</li>
                <li>Medical center and on-campus pharmacy</li>
                <li>Dedicated support for international students</li>
              </ul>
            </div>
            <img
              className={s.splitImg}
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80"
              alt="Students together"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
