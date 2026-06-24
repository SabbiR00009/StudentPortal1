import { useState, useEffect } from 'react';
import { getAdminFaculty, createFaculty, deleteFaculty } from '../../../api';
import Modal from '../../../components/Modal/Modal';
import styles from '../AdminDashboard.module.scss';

export default function FacultyView() {
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ faculty_id: '', name: '', email: '', department: 'CSE', designation: 'Lecturer', password: '123456' });

  useEffect(() => { load(); }, []);
  const load = () => getAdminFaculty().then(setFaculty).catch(console.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await createFaculty(form); alert('Faculty added!'); setShowModal(false); load(); } catch (err) { alert(err.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this faculty member?')) return;
    try { await deleteFaculty(id); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <>
      <div className={styles.pageTitle}>
        <h2><i className="fas fa-chalkboard-teacher"></i> Faculty Members</h2>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}><i className="fas fa-plus"></i> Add Faculty</button>
      </div>
      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th>Actions</th></tr></thead>
          <tbody>
            {faculty.map(f => (
              <tr key={f.id}><td>{f.faculty_id}</td><td>{f.name}</td><td>{f.email}</td><td>{f.department}</td><td>{f.designation}</td>
                <td><button className={styles.btnDanger} onClick={() => handleDelete(f.id)}><i className="fas fa-trash"></i></button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Faculty Member">
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}><label>Faculty ID</label><input value={form.faculty_id} onChange={e => set('faculty_id', e.target.value)} required /></div>
          <div className={styles.inputGroup}><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div className={styles.inputGroup}><label>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} required /></div>
          <div className={styles.inputGroup}><label>Department</label>
            <select value={form.department} onChange={e => set('department', e.target.value)}>
              <option>CSE</option><option>EEE</option><option>BBA</option><option>ENG</option>
            </select>
          </div>
          <div className={styles.inputGroup}><label>Designation</label>
            <select value={form.designation} onChange={e => set('designation', e.target.value)}>
              <option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option><option>Senior Lecturer</option><option>Lecturer</option>
            </select>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Add Faculty</button>
        </form>
      </Modal>
    </>
  );
}
