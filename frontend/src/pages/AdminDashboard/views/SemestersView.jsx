import { useState } from 'react';
import { createSemester } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function SemestersView() {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await createSemester(form); alert('Semester created!'); } catch (e) { alert(e.error || 'Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-calendar"></i> Semester Management</h2></div>
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Semester Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Fall-2025" required /></div>
            <div className={styles.inputGroup}><label>Start Date</label><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>End Date</label><input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} required /></div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Create Semester</button>
        </form>
      </div>
    </>
  );
}
