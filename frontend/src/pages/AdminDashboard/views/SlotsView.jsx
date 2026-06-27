import { useState, useEffect } from 'react';
import { getAdminSlots, createSlot, deleteSlot, getDropPeriods, createDropPeriod, deleteDropPeriod, getSettings, updateSettings } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function SlotsView() {
  const [slots, setSlots] = useState([]);
  const [dropPeriods, setDropPeriods] = useState([]);
  const [form, setForm] = useState({ min_credits: 0, max_credits: 140, start_time: '', end_time: '' });
  const [dropForm, setDropForm] = useState({ start_date: '', end_date: '', min_credits: 0, max_credits: 140 });
  const [paymentDueDate, setPaymentDueDate] = useState('');

  useEffect(() => { load(); }, []);
  const load = () => {
    getAdminSlots().then(setSlots).catch(console.error);
    getDropPeriods().then(setDropPeriods).catch(console.error);
    getSettings().then(res => setPaymentDueDate(res.payment_due_date || '')).catch(console.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await createSlot(form); alert('Slot created!'); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleDropSubmit = async (e) => {
    e.preventDefault();
    try { await createDropPeriod(dropForm); alert('Drop period set!'); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handlePaymentDateSubmit = async (e) => {
    e.preventDefault();
    try { await updateSettings('payment_due_date', paymentDueDate); alert('Payment Due Date updated!'); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try { await deleteSlot(id); load(); } catch (e) { alert('Error'); }
  };

  const handleDeleteDrop = async (id) => {
    if (!window.confirm('Delete this drop period?')) return;
    try { await deleteDropPeriod(id); load(); } catch (e) { alert('Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const setDrop = (f, v) => setDropForm(p => ({ ...p, [f]: v }));

  const getStatus = (start, end) => {
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);
    if (now < s) return <span style={{color: '#d97706'}}>Upcoming</span>;
    if (now >= s && now <= e) return <span style={{color: 'green'}}>Active</span>;
    return <span style={{color: '#dc2626'}}>Ended</span>;
  };

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-clock"></i> System Timeframes</h2></div>
      
      <div className={styles.card}>
        <h3>Global Settings</h3>
        <form onSubmit={handlePaymentDateSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Payment Due Date</label>
              <input type="date" value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Save Settings</button>
        </form>
      </div>

      <div className={styles.card} style={{ marginTop: '30px' }}>
        <h3>Course Drop Window</h3>
        <form onSubmit={handleDropSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Min Credits</label><input type="number" value={dropForm.min_credits} onChange={e => setDrop('min_credits', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Max Credits</label><input type="number" value={dropForm.max_credits} onChange={e => setDrop('max_credits', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Start Date</label><input type="datetime-local" value={dropForm.start_date} onChange={e => setDrop('start_date', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>End Date</label><input type="datetime-local" value={dropForm.end_date} onChange={e => setDrop('end_date', e.target.value)} required /></div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Set Drop Window</button>
        </form>
      </div>
      
      {dropPeriods.length > 0 && (
        <div className={styles.card}>
          <h3>Drop Period History</h3>
          <table className={styles.dataTable}>
            <thead><tr><th>Credits</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{dropPeriods.map(dp => (
              <tr key={dp.id}>
                <td>{dp.min_credits}-{dp.max_credits}</td>
                <td>{new Date(dp.start_date).toLocaleString()}</td>
                <td>{new Date(dp.end_date).toLocaleString()}</td>
                <td>{dp.is_active ? <span style={{color: 'green'}}>Active</span> : 'Inactive'}</td>
                <td><button className={styles.btnDanger} onClick={() => handleDeleteDrop(dp.id)}><i className="fas fa-trash"></i></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <div className={styles.card} style={{ marginTop: '30px' }}>
        <h3>Advising Slots</h3>
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
          <h3>Advising Slot History</h3>
          <table className={styles.dataTable}>
            <thead><tr><th>Credits Range</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{slots.map(s => (
              <tr key={s.id}>
                <td>{s.min_credits}-{s.max_credits}</td>
                <td>{new Date(s.start_time).toLocaleString()}</td>
                <td>{new Date(s.end_time).toLocaleString()}</td>
                <td>{getStatus(s.start_time, s.end_time)}</td>
                <td><button className={styles.btnDanger} onClick={() => handleDelete(s.id)}><i className="fas fa-trash"></i></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
