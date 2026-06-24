import { useState, useEffect } from 'react';
import { getAdminCourses, createCourse, deleteCourse, updateCourseCapacity, getScheduleConfig } from '../../../api';
import Modal from '../../../components/Modal/Modal';
import styles from '../AdminDashboard.module.scss';

export default function CoursesView() {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState({ theory_day: [], theory_slot: [], lab_day: [], lab_slot_2h: [], lab_slot_3h: [] });
  const [form, setForm] = useState({ code: '', name: '', department: 'CSE', credits: 3, instructor: '', instructor_email: '', theory_days: '', theory_time: '', lab_day: '', lab_time: '', room_number: '', section: 1, semester: 'Fall-2025', max_students: 40 });

  useEffect(() => {
    load();
    getScheduleConfig().then(setConfig).catch(console.error);
  }, []);

  const load = () => getAdminCourses().then(setCourses).catch(console.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await createCourse(form); alert('Course created!'); setShowModal(false); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await deleteCourse(id); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleCapacity = async (id) => {
    const cap = prompt('Enter new max capacity:');
    if (!cap) return;
    try { await updateCourseCapacity(id, parseInt(cap)); load(); } catch (e) { alert('Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <>
      <div className={styles.pageTitle}>
        <h2><i className="fas fa-book"></i> Courses</h2>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}><i className="fas fa-plus"></i> Add Course</button>
      </div>
      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>Code</th><th>Name</th><th>Dept</th><th>Cr</th><th>Section</th><th>Instructor</th><th>Capacity</th><th>Actions</th></tr></thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}><td>{c.code}</td><td>{c.name}</td><td>{c.department}</td><td>{c.credits}</td><td>§{c.section}</td>
                <td>{c.instructor}</td><td>{c.enrolled_count}/{c.max_students}</td>
                <td>
                  <button className={styles.btnSmall} onClick={() => handleCapacity(c.id)} style={{ marginRight: '5px' }}><i className="fas fa-edit"></i></button>
                  <button className={styles.btnDanger} onClick={() => handleDelete(c.id)}><i className="fas fa-trash"></i></button>
                </td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Course" wide>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Code</label><input value={form.code} onChange={e => set('code', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Department</label>
              <select value={form.department} onChange={e => set('department', e.target.value)}>
                <option>CSE</option><option>EEE</option><option>BBA</option><option>ENG</option></select></div>
            <div className={styles.inputGroup}><label>Credits</label><input type="number" value={form.credits} onChange={e => set('credits', e.target.value)} /></div>
            <div className={styles.inputGroup}><label>Instructor</label><input value={form.instructor} onChange={e => set('instructor', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Instructor Email</label><input value={form.instructor_email} onChange={e => set('instructor_email', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Theory Days</label>
              <select value={form.theory_days} onChange={e => set('theory_days', e.target.value)}>
                <option value="">Select</option>{config.theory_day?.map(d => <option key={d.value} value={d.value}>{d.display}</option>)}</select></div>
            <div className={styles.inputGroup}><label>Theory Time</label>
              <select value={form.theory_time} onChange={e => set('theory_time', e.target.value)}>
                <option value="">Select</option>{config.theory_slot?.map(s => <option key={s.value} value={s.value}>{s.display}</option>)}</select></div>
            <div className={styles.inputGroup}><label>Lab Day</label>
              <select value={form.lab_day} onChange={e => set('lab_day', e.target.value)}>
                <option value="">None</option>{config.lab_day?.map(d => <option key={d.value} value={d.value}>{d.display}</option>)}</select></div>
            <div className={styles.inputGroup}><label>Lab Time</label>
              <select value={form.lab_time} onChange={e => set('lab_time', e.target.value)}>
                <option value="">None</option>{config.lab_slot_2h?.map(s => <option key={s.value} value={s.value}>{s.display} (2h)</option>)}{config.lab_slot_3h?.map(s => <option key={s.value} value={s.value}>{s.display} (3h)</option>)}</select></div>
            <div className={styles.inputGroup}><label>Room</label><input value={form.room_number} onChange={e => set('room_number', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Section</label><input type="number" value={form.section} onChange={e => set('section', e.target.value)} /></div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Create Course</button>
        </form>
      </Modal>
    </>
  );
}
