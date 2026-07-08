import { useState } from 'react';
import PublicLayout from './PublicLayout';
import Banner from './Banner';
import { NEWS, EVENTS } from './data';
import s from './public.module.scss';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const CATEGORIES = ['All', ...Array.from(new Set(NEWS.map((n) => n.category)))];

export default function News() {
  const [filter, setFilter] = useState('All');
  const items = filter === 'All' ? NEWS : NEWS.filter((n) => n.category === filter);

  return (
    <PublicLayout>
      <Banner title="News & Events" crumb="News" />

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Newsroom</span>
            <h2 className={s.sectionTitle}>What's happening at BIU</h2>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={c === filter ? `${s.portalBtn}` : s.iconBtn}
                style={{ width: 'auto', padding: '0.5rem 1rem', borderRadius: 999 }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className={`${s.grid} ${s.grid3}`}>
            {items.map((n) => (
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
        </div>
      </section>

      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Mark your calendar</span>
            <h2 className={s.sectionTitle}>Upcoming Events</h2>
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
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
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
