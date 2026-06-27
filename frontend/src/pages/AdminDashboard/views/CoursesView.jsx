import { useState, useEffect } from 'react';
import { getAdminCourses, createCourse, deleteCourse, updateCourse, getScheduleConfig, getAdminFaculty } from '../../../api';
import Modal from '../../../components/Modal/Modal';
import styles from '../AdminDashboard.module.scss';

function validateScheduleConflict(theoryDaysCode, theoryTimeStr, labDay, labTimeStr) {
  if (!theoryDaysCode || !theoryTimeStr || !labDay || !labTimeStr) return true;

  const theoryMap = {
    "MW": ["Mon", "Wed", "Monday", "Wednesday", "M", "W"],
    "ST": ["Sun", "Tue", "Sunday", "Tuesday", "S", "T"],
    "SR": ["Sun", "Thu", "Sunday", "Thursday", "S", "R"],
    "TR": ["Tue", "Thu", "Tuesday", "Thursday", "T", "R"]
  };
  const activeDays = theoryMap[theoryDaysCode] || [theoryDaysCode.substring(0, 3)];
  const cleanLabDay = labDay.trim();
  const isDayMatch = activeDays.some(d => d.startsWith(cleanLabDay) || cleanLabDay.startsWith(d));
  if (!isDayMatch) return true;

  const parseTimeRange = (str) => {
    if (!str) return null;
    const clean = str.replace(/Slot \d+:/i, "").trim();
    const parts = clean.split("-");
    if (parts.length !== 2) return null;
    const toMin = (t) => {
      let [h, m] = t.trim().split(":").map(Number);
      if (h < 8) h += 12;
      if (h === 12 && t.toLowerCase().includes("am")) h = 0;
      return (h * 60) + (m || 0);
    };
    return { start: toMin(parts[0]), end: toMin(parts[1]) };
  };

  const t = parseTimeRange(theoryTimeStr);
  const l = parseTimeRange(labTimeStr);
  if (!t || !l) return true;

  if (t.start < l.end && t.end > l.start) return false;
  return true;
}

export default function CoursesView() {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [config, setConfig] = useState({ theory_day: [], theory_slot: [], lab_day: [], lab_slot_2h: [], lab_slot_3h: [] });
  const [form, setForm] = useState({ code: '', name: '', department: 'CSE', credits: 3, instructor: '', instructor_email: '', theory_days: '', theory_time: '', lab_day: '', lab_time: '', room_number: '', section: 1, semester: 'Fall-2025', max_students: 40 });
  const [editForm, setEditForm] = useState({ id: null, room_number: '', max_students: 40, instructor: '', instructor_email: '' });

  useEffect(() => {
    load();
    getScheduleConfig().then(data => {
      const parsed = { theory_day: [], theory_slot: [], lab_day: [], lab_slot_2h: [], lab_slot_3h: [] };
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (parsed[item.category]) parsed[item.category].push(item);
        });
      }
      setConfig(parsed);
    }).catch(err => console.error("Error fetching config:", err));
    getAdminFaculty().then(setFaculty).catch(console.error);
  }, []);

  const load = () => getAdminCourses().then(setCourses).catch(console.error);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.instructor_email) return alert("Please select a valid instructor.");

    const cr = Number(form.credits);
    if (cr === 4 || cr === 4.5) {
      if (!validateScheduleConflict(form.theory_days, form.theory_time, form.lab_day, form.lab_time)) {
        return alert(`🚫 SCHEDULE CLASH DETECTED! Theory and Lab times overlap on the same day.`);
      }
    }

    const submitData = {
      ...form,
      credits: cr,
      section: parseInt(form.section) || 1,
      lab_day: (cr === 4 || cr === 4.5) ? form.lab_day : null,
      lab_time: (cr === 4 || cr === 4.5) ? form.lab_time : null
    };

    try { await createCourse(submitData); alert('Course created!'); setShowModal(false); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await deleteCourse(id); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const handleEditOpen = (c) => {
    setEditForm({ id: c.id, room_number: c.room_number || '', max_students: c.max_students || 40, instructor_email: c.instructor_email || '', instructor: c.instructor || '' });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.instructor_email) return alert("Please select a valid instructor.");
    try {
      await updateCourse(editForm.id, { room_number: editForm.room_number, max_students: parseInt(editForm.max_students), instructor: editForm.instructor, instructor_email: editForm.instructor_email });
      alert('Course updated!');
      setShowEditModal(false);
      load();
    } catch (e) { alert('Error'); }
  };

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const setEdit = (f, v) => setEditForm(p => ({ ...p, [f]: v }));

  const handleInstructorChange = (e, isEdit = false) => {
    const selectedEmail = e.target.value;
    const fac = faculty.find(f => f.email === selectedEmail);
    if (isEdit) {
      setEditForm(p => ({ ...p, instructor_email: selectedEmail, instructor: fac ? fac.name : '' }));
    } else {
      setForm(p => ({ ...p, instructor_email: selectedEmail, instructor: fac ? fac.name : '' }));
    }
  };

  const showLab = Number(form.credits) === 4 || Number(form.credits) === 4.5;

  return (
    <>
      <div className={styles.pageTitle}>
        <h2><i className="fas fa-book"></i> Courses</h2>
        <button className={styles.btnPrimary} onClick={() => { setForm({ code: '', name: '', department: 'CSE', credits: 3, instructor: '', instructor_email: '', theory_days: '', theory_time: '', lab_day: '', lab_time: '', room_number: '', section: 1, semester: 'Fall-2025', max_students: 40 }); setShowModal(true); }}><i className="fas fa-plus"></i> Add Course</button>
      </div>
      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>Code</th><th>Name</th><th>Dept</th><th>Cr</th><th>Section</th><th>Instructor</th><th>Schedule</th><th>Room</th><th>Capacity</th><th>Actions</th></tr></thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.code}</td><td>{c.name}</td><td>{c.department}</td><td>{c.credits}</td><td>{c.section}</td>
                <td>{c.instructor}</td>
                <td style={{ fontSize: '0.85em' }}>
                  <div><strong>{c.theory_days}</strong> {c.theory_time}</div>
                  {c.lab_day && c.lab_time && <div style={{ color: '#4F46E5', marginTop: '4px' }}>Lab: {c.lab_day} {c.lab_time}</div>}
                </td>
                <td>{c.room_number}</td>
                <td>{c.enrolled_count}/{c.max_students}</td>
                <td>
                  <button className={styles.btnSmall} onClick={() => handleEditOpen(c)} style={{ marginRight: '5px' }}><i className="fas fa-edit"></i></button>
                  <button className={styles.btnDanger} onClick={() => handleDelete(c.id)}><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && <div className={styles.emptyState}><i className="fas fa-book-open"></i><p>No courses found.</p></div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Course" wide>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Code</label><input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required /></div>
            <div className={styles.inputGroup}><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className={styles.inputGroup}><label>Department</label>
              <select value={form.department} onChange={e => set('department', e.target.value)}>
                <option>CSE</option><option>EEE</option><option>BBA</option><option>ENG</option></select></div>
            <div className={styles.inputGroup}><label>Credits</label>
              <select value={form.credits} onChange={e => set('credits', Number(e.target.value))}>
                <option value={1}>1</option><option value={1.5}>1.5</option><option value={3}>3</option><option value={4}>4</option><option value={4.5}>4.5</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}><label>Instructor</label>
              <select value={form.instructor_email} onChange={e => handleInstructorChange(e, false)} required>
                <option value="">-- Select Instructor --</option>
                {faculty.map(f => (
                  <option key={f.email} value={f.email}>{f.name} ({f.department})</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}><label>Section</label><input type="number" min="1" value={form.section} onChange={e => set('section', e.target.value)} /></div>

            <div className={styles.inputGroup}><label>Theory Days</label>
              <select value={form.theory_days} onChange={e => set('theory_days', e.target.value)} required>
                <option value="">Select</option>{config.theory_day?.map(d => <option key={d.value} value={d.value}>{d.display}</option>)}</select></div>
            <div className={styles.inputGroup}><label>Theory Time</label>
              <select value={form.theory_time} onChange={e => set('theory_time', e.target.value)} required>
                <option value="">Select</option>{config.theory_slot?.map(s => <option key={s.value} value={s.value}>{s.display}</option>)}</select></div>
            
            {showLab && (
              <>
                <div className={styles.inputGroup}><label>Lab Day</label>
                  <select value={form.lab_day} onChange={e => set('lab_day', e.target.value)} required>
                    <option value="">Select</option>{config.lab_day?.map(d => <option key={d.value} value={d.value}>{d.display}</option>)}</select></div>
                <div className={styles.inputGroup}><label>Lab Time</label>
                  <select value={form.lab_time} onChange={e => set('lab_time', e.target.value)} required>
                    <option value="">Select</option>{config.lab_slot_2h?.map(s => <option key={s.value} value={s.value}>{s.display} (2h)</option>)}{config.lab_slot_3h?.map(s => <option key={s.value} value={s.value}>{s.display} (3h)</option>)}</select></div>
              </>
            )}
            
            <div className={styles.inputGroup}><label>Room</label><input value={form.room_number} onChange={e => set('room_number', e.target.value)} required /></div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Create Course</button>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Course Details">
        <form onSubmit={handleEditSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Room Number</label>
              <input value={editForm.room_number} onChange={e => setEdit('room_number', e.target.value)} required />
            </div>
            
            <div className={styles.inputGroup}><label>Instructor</label>
              <select value={editForm.instructor_email} onChange={e => handleInstructorChange(e, true)} required>
                <option value="">-- Select Instructor --</option>
                {faculty.map(f => (
                  <option key={f.email} value={f.email}>{f.name} ({f.department})</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}><label>Capacity</label>
              <input type="number" min="1" value={editForm.max_students} onChange={e => setEdit('max_students', e.target.value)} required />
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>Save Changes</button>
        </form>
      </Modal>
    </>
  );
}
