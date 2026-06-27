import { useState, useEffect } from 'react';
import { getAdminFaculty, createFaculty, updateFaculty, deleteFaculty, getAdminFacultyCourses } from '../../../api';
import Modal from '../../../components/Modal/Modal';
import styles from '../AdminDashboard.module.scss';

const EMPTY_FORM = { db_id: null, faculty_id: '', name: '', email: '', phone: '', dob: '', department: 'CSE', designation: 'Lecturer', password: '123456' };

export default function FacultyView() {
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [courses, setCourses] = useState([]);

  useEffect(() => { load(); }, []);
  const load = () => getAdminFaculty().then(setFaculty).catch(console.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { 
      if (editingId) {
        await updateFaculty(form.db_id, form);
        alert('Faculty updated!');
      } else {
        await createFaculty(form); 
        alert('Faculty registered!'); 
      }
      setShowModal(false); setEditingId(null); setForm(EMPTY_FORM); setCourses([]); load(); 
    } catch (err) { alert(err.error || 'Error'); }
  };

  const handleEdit = async (f) => {
    setEditingId(f.faculty_id);
    setForm({
      db_id: f.id,
      faculty_id: f.faculty_id,
      name: f.name,
      email: f.email,
      phone: f.phone || '',
      dob: f.dob || '',
      department: f.department,
      designation: f.designation
    });
    setShowModal(true);
    
    // Fetch courses
    try {
      const data = await getAdminFacultyCourses(f.id);
      setCourses(data);
    } catch (e) { console.error("Failed to load courses"); }
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
        <button className={styles.btnPrimary} onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setCourses([]); setShowModal(true); }}><i className="fas fa-plus"></i> Add Faculty</button>
      </div>
      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Designation</th><th>Actions</th></tr></thead>
          <tbody>
            {faculty.map(f => (
              <tr key={f.id}><td>{f.faculty_id}</td><td>{f.name}</td><td>{f.email}</td><td>{f.phone || 'N/A'}</td><td>{f.department}</td><td>{f.designation}</td>
                <td>
                  <button className={styles.btnSmall} onClick={() => handleEdit(f)} style={{ marginRight: '5px' }}><i className="fas fa-edit"></i></button>
                  <button className={styles.btnDanger} onClick={() => handleDelete(f.id)}><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {faculty.length === 0 && <div className={styles.emptyState}><i className="fas fa-users-slash"></i><p>No faculty members found.</p></div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Faculty Profile' : 'Register New Faculty'} wide={editingId !== null}>
        <div style={{ display: editingId ? 'flex' : 'block', gap: '20px' }}>
          <div style={{ flex: '1' }}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                {!editingId && (
                  <>
                    <div className={styles.inputGroup}><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                    <div className={styles.inputGroup}><label>Phone Number</label><input value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
                    <div className={styles.inputGroup}><label>Date of Birth</label><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} required /></div>
                    <div className={styles.inputGroup}><label>Department</label>
                      <select value={form.department} onChange={e => set('department', e.target.value)}>
                        <option>CSE</option><option>EEE</option><option>BBA</option><option>ENG</option><option>ACT</option>
                      </select>
                    </div>
                    <div className={styles.inputGroup}><label>Designation</label>
                      <select value={form.designation} onChange={e => set('designation', e.target.value)}>
                        <option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option><option>Senior Lecturer</option><option>Lecturer</option>
                      </select>
                    </div>
                  </>
                )}

                {editingId && (
                  <>
                    <div className={styles.inputGroup}>
                      <label>Faculty ID</label>
                      <input value={form.faculty_id} readOnly style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Email</label>
                      <input value={form.email} readOnly style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                    </div>
                    <div className={styles.inputGroup}><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                    <div className={styles.inputGroup}><label>Phone Number</label><input value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
                    <div className={styles.inputGroup}><label>Date of Birth</label><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} required /></div>
                    <div className={styles.inputGroup}><label>Designation</label>
                      <select value={form.designation} onChange={e => set('designation', e.target.value)}>
                        <option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option><option>Senior Lecturer</option><option>Lecturer</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>
                {editingId ? 'Update Faculty' : 'Generate Registration'}
              </button>
            </form>
          </div>

          {editingId && (
            <div style={{ flex: '1', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
              <h3>Course History</h3>
              <div style={{ marginTop: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                {courses.length > 0 ? (
                  <table className={styles.dataTable} style={{ width: '100%', fontSize: '0.9em' }}>
                    <thead><tr><th>Code</th><th>Name</th><th>Status</th></tr></thead>
                    <tbody>
                      {courses.map(c => (
                        <tr key={c.id}>
                          <td>{c.code}</td>
                          <td>{c.name}</td>
                          <td style={{ fontWeight: 'bold', color: c.status === 'Currently taking' ? 'var(--warning-color, #f59e0b)' : 'var(--success-color, #22c55e)' }}>
                            {c.status === 'Currently taking' ? `Currently taking (Section ${c.section || '1'})` : 'Completed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No courses assigned yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
