import { useState } from 'react';
import { postAnnouncement } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function AnnouncementsView() {
  const [form, setForm] = useState({ title: '', content: '', category: 'General' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await postAnnouncement(form); alert('Announcement posted!'); setForm({ title: '', content: '', category: 'General' }); } catch (e) { alert(e.error || 'Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-bullhorn"></i> Announcements</h2></div>
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}><label>Title</label><input value={form.title} onChange={e => set('title', e.target.value)} required /></div>
          <div className={styles.inputGroup}><label>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              <option>General</option><option>Academic</option><option>Urgent</option><option>Event</option>
            </select>
          </div>
          <div className={styles.inputGroup}><label>Content</label><textarea rows="4" value={form.content} onChange={e => set('content', e.target.value)} required style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontFamily: 'inherit' }} /></div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Post Announcement</button>
        </form>
      </div>
    </>
  );
}
