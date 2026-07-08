import { useState } from 'react';
import PublicLayout from './PublicLayout';
import Banner from './Banner';
import BRAND from '../../brand';
import { submitContact } from '../../api';
import s from './public.module.scss';

const initial = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState(null); // { ok, msg }
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await submitContact(form);
      setStatus({ ok: true, msg: res.message || 'Message sent successfully.' });
      setForm(initial);
    } catch (err) {
      setStatus({ ok: false, msg: err.error || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <Banner title="Contact Us" crumb="Contact" />

      <section className={s.section}>
        <div className={s.container}>
          <div className={s.split}>
            {/* Info */}
            <div>
              <span className={s.eyebrow}>We'd love to hear from you</span>
              <h2 className={s.splitTitle}>Get in touch</h2>
              <p className={s.splitText}>
                Whether you're a prospective student, parent, partner, or member of
                the media, our team is ready to help. Reach out and we'll respond
                within one business day.
              </p>

              <div className={s.eventRow}>
                <div className={s.eventDate}><i className="fas fa-location-dot" style={{ lineHeight: '2.4' }} /></div>
                <div><div className={s.eventTitle}>Address</div><div className={s.eventPlace}>{BRAND.address}</div></div>
              </div>
              <div className={s.eventRow}>
                <div className={s.eventDate}><i className="fas fa-phone" style={{ lineHeight: '2.4' }} /></div>
                <div><div className={s.eventTitle}>Phone</div><div className={s.eventPlace}>{BRAND.phone}</div></div>
              </div>
              <div className={s.eventRow}>
                <div className={s.eventDate}><i className="fas fa-envelope" style={{ lineHeight: '2.4' }} /></div>
                <div>
                  <div className={s.eventTitle}>Email</div>
                  <div className={s.eventPlace}>{BRAND.email} · {BRAND.admissionsEmail}</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className={s.card}>
              <div className={s.cardTitle}>Send us a message</div>
              <form className={s.form} onSubmit={onSubmit}>
                <div className={s.formRow}>
                  <div className={s.field}>
                    <label htmlFor="name">Full Name</label>
                    <input id="name" name="name" value={form.name} onChange={onChange} required />
                  </div>
                  <div className={s.field}>
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
                  </div>
                </div>
                <div className={s.field}>
                  <label htmlFor="subject">Subject</label>
                  <input id="subject" name="subject" value={form.subject} onChange={onChange} placeholder="How can we help?" />
                </div>
                <div className={s.field}>
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows={5} value={form.message} onChange={onChange} required />
                </div>

                {status && (
                  <div className={`${s.formNote} ${status.ok ? s.formOk : s.formErr}`}>{status.msg}</div>
                )}

                <button type="submit" className={s.portalBtn} disabled={loading} style={{ padding: '0.8rem 1.5rem' }}>
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className={`${s.section} ${s.sectionAlt}`} style={{ paddingTop: 0 }}>
        <div className={s.container}>
          <div className={s.tableWrap} style={{ borderRadius: 16 }}>
            <iframe
              title="BIU location"
              src="https://www.google.com/maps?q=Savar,Dhaka,Bangladesh&output=embed"
              width="100%"
              height="360"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
