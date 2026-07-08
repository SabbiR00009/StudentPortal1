import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';
import Banner from './Banner';
import BRAND from '../../brand';
import { ADMISSION_STEPS, TUITION } from './data';
import s from './public.module.scss';

const SCHOLARSHIPS = [
  { icon: 'fa-trophy', title: 'Merit Scholarships', text: 'Up to 100% tuition waiver for outstanding SSC/HSC and admission-test results.' },
  { icon: 'fa-hand-holding-heart', title: 'Need-Based Aid', text: 'Financial support for talented students facing economic hardship.' },
  { icon: 'fa-medal', title: 'Sports & Cultural', text: 'Awards for national-level athletes and performing artists.' },
  { icon: 'fa-users', title: 'Sibling & Alumni', text: 'Tuition discounts for siblings and children of BIU alumni.' },
];

export default function Admissions() {
  return (
    <PublicLayout>
      <Banner title="Admissions" crumb="Admissions" />

      {/* Steps */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>How to Apply</span>
            <h2 className={s.sectionTitle}>Four simple steps to enrollment</h2>
            <p className={s.sectionSub}>Fall 2026 applications are open. Deadline: 15 August 2026.</p>
          </div>
          <div className={s.steps}>
            {ADMISSION_STEPS.map((st) => (
              <div key={st.title} className={s.step}>
                <span className={s.stepNum} />
                <div className={s.cardIcon} style={{ margin: '0 auto 1rem' }}><i className={`fas ${st.icon}`} /></div>
                <div className={s.cardTitle}>{st.title}</div>
                <p className={s.cardText}>{st.text}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <a href={`mailto:${BRAND.admissionsEmail}`} className={s.btnPrimary} style={{ color: '#2a2000' }}>
              Apply Now
            </a>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={`${s.grid} ${s.grid2}`}>
            <div className={s.card}>
              <div className={s.cardTitle}>Undergraduate Requirements</div>
              <ul className={s.cardList}>
                <li>Minimum GPA 2.5 in both SSC and HSC (or equivalent)</li>
                <li>Combined GPA of 6.0 across SSC and HSC</li>
                <li>Pass the departmental admission test and interview</li>
                <li>Completed application with certified transcripts</li>
              </ul>
            </div>
            <div className={s.card}>
              <div className={s.cardTitle}>Graduate Requirements</div>
              <ul className={s.cardList}>
                <li>Recognized bachelor's degree in a relevant field</li>
                <li>Minimum CGPA 2.5 (out of 4.0)</li>
                <li>Two letters of recommendation</li>
                <li>Statement of purpose and interview</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tuition */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Tuition & Fees</span>
            <h2 className={s.sectionTitle}>Transparent, affordable pricing</h2>
            <p className={s.sectionSub}>Indicative fees for popular programs. Contact admissions for the full fee schedule.</p>
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Admission Fee</th>
                  <th>Per Credit</th>
                  <th>Est. Total</th>
                </tr>
              </thead>
              <tbody>
                {TUITION.map((t) => (
                  <tr key={t.program}>
                    <td>{t.program}</td>
                    <td>{t.admission}</td>
                    <td>{t.perCredit}</td>
                    <td>{t.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Scholarships */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Financial Support</span>
            <h2 className={s.sectionTitle}>Scholarships & Aid</h2>
          </div>
          <div className={`${s.grid} ${s.grid4}`}>
            {SCHOLARSHIPS.map((sc) => (
              <div key={sc.title} className={s.card}>
                <div className={s.cardIcon}><i className={`fas ${sc.icon}`} /></div>
                <div className={s.cardTitle}>{sc.title}</div>
                <p className={s.cardText}>{sc.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.cta}>
        <h2 className={s.ctaTitle}>Have questions about applying?</h2>
        <p className={s.ctaText}>Our admissions team is here to guide you through every step of the process.</p>
        <div className={s.heroButtons} style={{ justifyContent: 'center' }}>
          <Link to="/contact" className={s.btnPrimary}>Contact Admissions</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
