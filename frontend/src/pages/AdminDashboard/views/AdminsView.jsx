import { useState } from 'react';
import { createAdmin } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function AdminsView() {
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await createAdmin(form); alert('Admin added!'); setForm({ email: '', password: '', name: '' }); } catch (e) { alert(e.error || 'Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-shield-alt"></i> Manage Admins</h2></div>
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div className={styles.inputGroup}><label>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} required /></div>
          <div className={styles.inputGroup}><label>Password</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Create Admin Account</button>
        </form>
      </div>
    </>
  );
}
