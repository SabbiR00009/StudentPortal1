import PublicLayout from './PublicLayout';
import Banner from './Banner';
import BRAND from '../../brand';
import { FACULTY_LEADERS } from './data';
import s from './public.module.scss';

const initials = (name) => name.replace(/prof\.|dr\.|mr\.|ms\.|mrs\./gi, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');

const VALUES = [
  { icon: 'fa-lightbulb', title: 'Innovation', text: 'We embrace new ideas and technologies to solve real problems.' },
  { icon: 'fa-shield-halved', title: 'Integrity', text: 'We hold ourselves to the highest ethical and academic standards.' },
  { icon: 'fa-hands-holding-circle', title: 'Inclusion', text: 'We welcome students of every background into one community.' },
  { icon: 'fa-seedling', title: 'Impact', text: 'We measure success by the difference our graduates make.' },
];

export default function About() {
  return (
    <PublicLayout>
      <Banner title="About the University" crumb="About" />

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.split}>
            <img
              className={s.splitImg}
              src="https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=1000&q=80"
              alt="BIU building"
            />
            <div>
              <span className={s.eyebrow}>Our Story</span>
              <h2 className={s.splitTitle}>Two decades of academic excellence</h2>
              <p className={s.splitText}>
                Founded in {BRAND.founded}, {BRAND.name} began with a simple but
                bold vision: to make world-class higher education accessible to the
                brightest minds of Bangladesh and beyond. What started with three
                departments has grown into a full-fledged university with six
                schools, hundreds of faculty, and thousands of proud alumni.
              </p>
              <p className={s.splitText}>
                Today, BIU is recognized by the University Grants Commission of
                Bangladesh and continues to lead in teaching quality, research
                output, and graduate employability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={`${s.grid} ${s.grid2}`}>
            <div className={s.card}>
              <div className={s.cardIcon}><i className="fas fa-bullseye" /></div>
              <div className={s.cardTitle}>Our Mission</div>
              <p className={s.cardText}>
                To provide transformative education that nurtures knowledgeable,
                skilled, and ethical citizens; to advance knowledge through impactful
                research; and to serve society with integrity and compassion.
              </p>
            </div>
            <div className={s.card}>
              <div className={s.cardIcon}><i className="fas fa-eye" /></div>
              <div className={s.cardTitle}>Our Vision</div>
              <p className={s.cardText}>
                To be a globally respected university that stands as a beacon of
                academic excellence, innovation, and social responsibility in South
                Asia and the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>What we stand for</span>
            <h2 className={s.sectionTitle}>Our Core Values</h2>
          </div>
          <div className={`${s.grid} ${s.grid4}`}>
            {VALUES.map((v) => (
              <div key={v.title} className={s.card}>
                <div className={s.cardIcon}><i className={`fas ${v.icon}`} /></div>
                <div className={s.cardTitle}>{v.title}</div>
                <p className={s.cardText}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Leadership</span>
            <h2 className={s.sectionTitle}>University Leadership</h2>
          </div>
          <div className={s.leaders}>
            {FACULTY_LEADERS.map((l) => (
              <div key={l.name} className={s.leaderCard}>
                <div className={s.leaderAvatar}>{initials(l.name)}</div>
                <div className={s.leaderName}>{l.name}</div>
                <div className={s.leaderRole}>{l.role}</div>
                <div className={s.leaderDept}>{l.dept}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
