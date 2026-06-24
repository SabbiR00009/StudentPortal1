import { useState, useEffect } from 'react';
import { getAdminStudents, createStudent, updateStudent, deleteStudent, adminEnrollStudent, adminDropStudent } from '../../../api';
import Modal from '../../../components/Modal/Modal';
import styles from '../AdminDashboard.module.scss';

const EMPTY_FORM = { student_id: '', unique_id: '', name: '', email: '', department: 'CSE', program: '', year: 2025, semester: 'Fall-2025', admitted_semester: '', phone: '', dob: '', password: '123456' };

export default function StudentsView() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enrollCode, setEnrollCode] = useState('');

  useEffect(() => { load(); }, []);

  const load = () => getAdminStudents(search).then(setStudents).catch(console.error);

  const handleSearch = (e) => {
    e.preventDefault();
    getAdminStudents(search).then(setStudents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateStudent(editingId, formData);
        alert('Student updated!');
      } else {
        await createStudent(formData);
        alert('Student registered!');
      }
      setShowModal(false); setEditingId(null); setFormData(EMPTY_FORM); load();
    } catch (err) { alert(err.error || 'Error'); }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setFormData({ student_id: s.student_id, unique_id: s.unique_id || '', name: s.name, email: s.email, department: s.department, program: s.program || '', year: s.year, semester: s.semester, admitted_semester: s.admitted_semester || '', phone: s.phone || '', dob: s.dob || '', password: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await deleteStudent(id); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleEnroll = async () => {
    if (!enrollCode.trim() || !selectedStudent) return;
    try {
      const data = await adminEnrollStudent(selectedStudent.id, enrollCode);
      if (data.success) { alert('Enrolled!'); setEnrollCode(''); } else { alert(data.error); }
    } catch (e) { alert(e.error || 'Error'); }
  };

  const handleDrop = async (type, targetId) => {
    if (!selectedStudent) return;
    if (!window.confirm(`Drop ${type === 'course' ? 'this course' : 'entire semester'}?`)) return;
    try {
      const data = await adminDropStudent(selectedStudent.id, type, targetId);
      if (data.success) alert('Dropped!');
    } catch (e) { alert(e.error || 'Error'); }
  };

  const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <>
      <div className={styles.pageTitle}>
        <h2><i className="fas fa-user-graduate"></i> Students</h2>
        <button className={styles.btnPrimary} onClick={() => { setEditingId(null); setFormData(EMPTY_FORM); setShowModal(true); }}>
          <i className="fas fa-plus"></i> Register Student
        </button>
      </div>

      <form onSubmit={handleSearch} className={styles.toolbar}>
        <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." />
        <button className={styles.btnPrimary} type="submit"><i className="fas fa-search"></i> Search</button>
      </form>

      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>SID</th><th>Name</th><th>Dept</th><th>Semester</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.student_id}</td><td>{s.name}</td><td>{s.department}</td><td>{s.semester}</td>
                <td><span className={`${styles.badge} ${s.payment_status === 'Paid' ? styles.badgePaid : styles.badgeDue}`}>{s.payment_status}</span></td>
                <td>
                  <button className={styles.btnSmall} onClick={() => handleEdit(s)} style={{ marginRight: '5px' }}><i className="fas fa-edit"></i></button>
                  <button className={styles.btnDanger} onClick={() => handleDelete(s.id)}><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div className={styles.emptyState}><i className="fas fa-users-slash"></i><p>No students found.</p></div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Student' : 'Register New Student'} wide>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Student ID</label><input value={formData.student_id} onChange={e => set('student_id', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Unique ID</label><input value={formData.unique_id} onChange={e => set('unique_id', e.target.value)} /></div>
            <div className={styles.inputGroup}><label>Full Name</label><input value={formData.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Email</label><input value={formData.email} onChange={e => set('email', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Department</label>
              <select value={formData.department} onChange={e => set('department', e.target.value)}>
                <option>CSE</option><option>EEE</option><option>BBA</option><option>ENG</option><option>ACT</option>
              </select>
            </div>
            <div className={styles.inputGroup}><label>Program</label><input value={formData.program} onChange={e => set('program', e.target.value)} /></div>
            <div className={styles.inputGroup}><label>Batch Year</label><input type="number" value={formData.year} onChange={e => set('year', e.target.value)} /></div>
            <div className={styles.inputGroup}><label>Phone</label><input value={formData.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>
            {editingId ? 'Update Student' : 'Register Student'}
          </button>
        </form>
      </Modal>
    </>
  );
}
