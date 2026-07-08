import PublicLayout from './PublicLayout';
import Banner from './Banner';
import s from './public.module.scss';

const CENTERS = [
  { icon: 'fa-robot', title: 'AI & Robotics Lab', text: 'Machine learning, computer vision, and autonomous systems research.' },
  { icon: 'fa-solar-panel', title: 'Renewable Energy Center', text: 'Solar, wind, and grid solutions for a sustainable Bangladesh.' },
  { icon: 'fa-heart-pulse', title: 'Public Health Institute', text: 'Community health, epidemiology, and health-policy studies.' },
  { icon: 'fa-database', title: 'Data Science Center', text: 'Big-data analytics for finance, agriculture, and governance.' },
  { icon: 'fa-city', title: 'Urban & Climate Studies', text: 'Resilient cities, water management, and climate adaptation.' },
  { icon: 'fa-briefcase', title: 'Business & Innovation Hub', text: 'Entrepreneurship, fintech, and SME development research.' },
];

const STATS = [
  { value: '320+', label: 'Published papers / year' },
  { value: '৳ 45M', label: 'Annual research funding' },
  { value: '18', label: 'Research centers' },
  { value: '60+', label: 'Industry collaborations' },
];

export default function Research() {
  return (
    <PublicLayout>
      <Banner title="Research & Innovation" crumb="Research" />

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.prose} style={{ textAlign: 'center' }}>
            <span className={s.eyebrow}>Discovery in action</span>
            <h2 className={s.sectionTitle}>Research that matters</h2>
            <p>
              At BIU, research is driven by a commitment to solving real problems
              facing Bangladesh and the world. Our faculty and students collaborate
              across disciplines and with industry partners to turn ideas into impact
              — from clean water and renewable energy to artificial intelligence and
              public health.
            </p>
          </div>
        </div>
      </section>

      <section className={s.stats}>
        <div className={s.statsInner}>
          {STATS.map((st) => (
            <div key={st.label}>
              <div className={s.statValue}>{st.value}</div>
              <div className={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Where we work</span>
            <h2 className={s.sectionTitle}>Research Centers & Labs</h2>
          </div>
          <div className={`${s.grid} ${s.grid3}`}>
            {CENTERS.map((c) => (
              <div key={c.title} className={s.card}>
                <div className={s.cardIcon}><i className={`fas ${c.icon}`} /></div>
                <div className={s.cardTitle}>{c.title}</div>
                <p className={s.cardText}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.split}>
            <img
              className={s.splitImg}
              src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=80"
              alt="Research laboratory"
            />
            <div>
              <span className={s.eyebrow}>For students</span>
              <h2 className={s.splitTitle}>Undergraduate research opportunities</h2>
              <p className={s.splitText}>
                BIU believes research shouldn't wait for graduate school. Through our
                Undergraduate Research Program, students join faculty-led projects,
                co-author publications, and present at national and international
                conferences — building skills that set them apart.
              </p>
              <ul className={s.cardList}>
                <li>Faculty-mentored research assistantships</li>
                <li>Annual BIU Research & Innovation Fair</li>
                <li>Travel grants for conference presentations</li>
                <li>Access to state-of-the-art labs and equipment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
