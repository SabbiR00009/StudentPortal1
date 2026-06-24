import { useState, useEffect } from 'react';
import { getAdminSlots, createSlot, deleteSlot } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function SlotsView() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ min_credits: 0, max_credits: 140, start_time: '', end_time: '' });

  useEffect(() => { load(); }, []);
  const load = () => getAdminSlots().then(setSlots).catch(console.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await createSlot(form); alert('Slot created!'); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try { await deleteSlot(id); load(); } catch (e) { alert('Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-clock"></i> Advising Slots</h2></div>
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Min Credits</label><input type="number" value={form.min_credits} onChange={e => set('min_credits', e.target.value)} /></div>
            <div className={styles.inputGroup}><label>Max Credits</label><input type="number" value={form.max_credits} onChange={e => set('max_credits', e.target.value)} /></div>
            <div className={styles.inputGroup}><label>Start Time</label><input type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>End Time</label><input type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} required /></div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Create Slot</button>
        </form>
      </div>
      {slots.length > 0 && (
        <div className={styles.card}>
          <h3>Active Slots</h3>
          <table className={styles.dataTable}>
            <thead><tr><th>Credits Range</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
            <tbody>{slots.map(s => (
              <tr key={s.id}><td>{s.min_credits}-{s.max_credits}</td><td>{new Date(s.start_time).toLocaleString()}</td><td>{new Date(s.end_time).toLocaleString()}</td>
                <td><button className={styles.btnDanger} onClick={() => handleDelete(s.id)}><i className="fas fa-trash"></i></button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
