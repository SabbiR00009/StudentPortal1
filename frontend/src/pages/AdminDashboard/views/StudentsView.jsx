import { useState, useEffect, useRef } from 'react';
import { getAdminStudents, createStudent, updateStudent, deleteStudent, getAdminFaculty, getStudentGrades, getStudentFinancials } from '../../../api';
import Modal from '../../../components/Modal/Modal';
import styles from '../AdminDashboard.module.scss';

const EMPTY_FORM = { student_id: '', unique_id: '', name: '', email: '', department: 'CSE', program: '', year: new Date().getFullYear(), semester: 'Fall-2025', admitted_semester: '', phone: '', dob: '', previous_due: 0, advisor_email: '', advisor_name: '', password: '123456' };

export default function StudentsView() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  
  // Faculty mapping for advisor select
  const [faculties, setFaculties] = useState([]);
  
  // Grade and Financial popups
  const [showGrades, setShowGrades] = useState(false);
  const [gradesData, setGradesData] = useState(null);
  const [showFinancials, setShowFinancials] = useState(false);
  const [financialsData, setFinancialsData] = useState(null);

  const searchTimeoutRef = useRef(null);

  useEffect(() => { 
    load();
    getAdminFaculty().then(setFaculties).catch(console.error);
  }, []);

  const load = (searchTerm = search) => getAdminStudents(searchTerm).then(setStudents).catch(console.error);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      load(val);
    }, 300); // 300ms debounce
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    load(search);
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
    setEditingId(s.student_id);
    setFormData({ 
      db_id: s.id,
      student_id: s.student_id, 
      unique_id: s.unique_id || '', 
      name: s.name, 
      email: s.email, 
      department: s.department, 
      program: s.program || '', 
      year: s.year, 
      semester: s.semester, 
      admitted_semester: s.admitted_semester || '', 
      phone: s.phone || '', 
      dob: s.dob || '',
      previous_due: s.previous_due || 0,
      advisor_email: s.advisor_email || '',
      advisor_name: s.advisor_name || '',
      password: '' 
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await deleteStudent(id); load(); } catch (e) { alert(e.error || 'Error'); }
  };

  const openGrades = async () => {
    if (!formData.db_id) return;
    try {
      const { getStudentCourses } = await import('../../../api');
      const data = await getStudentCourses(formData.db_id);
      setGradesData(data); // This is now an array of courses
      setShowGrades(true);
    } catch(e) {
      alert("Failed to load grades");
    }
  };

  const openFinancials = async () => {
    if (!formData.db_id) return;
    try {
      const data = await getStudentFinancials(formData.db_id);
      setFinancialsData(data);
      setShowFinancials(true);
    } catch(e) {
      alert("Failed to load financials");
    }
  };

  const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  const handleAdvisorChange = (e) => {
    const selectedEmail = e.target.value;
    const selectedFac = faculties.find(f => f.email === selectedEmail);
    setFormData(prev => ({
      ...prev,
      advisor_email: selectedEmail,
      advisor_name: selectedFac ? selectedFac.name : ''
    }));
  };

  const deptFaculties = faculties.filter(f => f.department === formData.department);

  return (
    <>
      <div className={styles.pageTitle}>
        <h2><i className="fas fa-user-graduate"></i> Students</h2>
        <button className={styles.btnPrimary} onClick={() => { setEditingId(null); setFormData(EMPTY_FORM); setShowModal(true); }}>
          <i className="fas fa-plus"></i> Register Student
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className={styles.toolbar}>
        <input 
          className={styles.searchInput} 
          value={search} 
          onChange={handleSearchChange} 
          placeholder="Type to search by name or ID..." 
        />
        <button className={styles.btnPrimary} type="submit"><i className="fas fa-search"></i> Search</button>
      </form>

      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>SID</th><th>Name</th><th>Dept</th><th>Advisor</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.student_id}</td><td>{s.name}</td><td>{s.department}</td><td>{s.advisor_name || 'N/A'}</td>
                <td><span className={`${styles.badge} ${s.payment_status === 'Paid' ? styles.badgePaid : styles.badgeDue}`}>{s.payment_status}</span></td>
                <td>
                  <button className={styles.btnSmall} onClick={() => handleEdit(s)} style={{ marginRight: '5px' }}><i className="fas fa-edit"></i></button>
                  <button className={styles.btnDanger} onClick={() => handleDelete(s.student_id)}><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div className={styles.emptyState}><i className="fas fa-users-slash"></i><p>No students found.</p></div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Student Profile' : 'Register New Student'} wide>
        {editingId && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button type="button" onClick={openGrades} className={styles.btnSmall} style={{ background: 'var(--indigo-primary)', color: 'white' }}>
              <i className="fas fa-file-alt"></i> View Grade Report
            </button>
            <button type="button" onClick={openFinancials} className={styles.btnSmall} style={{ background: 'var(--success-color, #22c55e)', color: 'white' }}>
              <i className="fas fa-dollar-sign"></i> View Financial History
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            {!editingId && (
              <>
                <div className={styles.inputGroup}><label>Full Name</label><input value={formData.name} onChange={e => set('name', e.target.value)} required /></div>
                <div className={styles.inputGroup}><label>Phone</label><input value={formData.phone} onChange={e => set('phone', e.target.value)} /></div>
                <div className={styles.inputGroup}><label>Date of Birth</label><input type="date" value={formData.dob} onChange={e => set('dob', e.target.value)} /></div>
                
                <div className={styles.inputGroup}><label>Admitted Semester</label>
                  <select value={formData.admitted_semester} onChange={e => set('admitted_semester', e.target.value)} required>
                    <option value="">Select Semester...</option><option>Spring</option><option>Summer</option><option>Fall</option>
                  </select>
                </div>

                <div className={styles.inputGroup}><label>Department</label>
                  <select value={formData.department} onChange={e => set('department', e.target.value)}>
                    <option>CSE</option><option>EEE</option><option>BBA</option><option>ENG</option><option>ACT</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Faculty Advisor</label>
                  <select value={formData.advisor_email} onChange={handleAdvisorChange}>
                    <option value="">-- Unassigned --</option>
                    {deptFaculties.map(f => (
                      <option key={f.email} value={f.email}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}><label>Program</label>
                  <select value={formData.program} onChange={e => set('program', e.target.value)} required>
                    <option value="">Select Program...</option>
                    <option>B.Sc in CSE</option>
                    <option>B.Sc in EEE</option>
                    <option>BBA</option>
                    <option>BA in English</option>
                    <option>B.Sc in Architecture</option>
                    <option>M.Sc in CSE</option>
                    <option>MBA</option>
                  </select>
                </div>
              </>
            )}

            {editingId && (
              <>
                <div className={styles.inputGroup}>
                  <label>Student ID</label>
                  <input value={formData.student_id} readOnly style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Email</label>
                  <input value={formData.email} readOnly style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Department</label>
                  <input value={formData.department} readOnly style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Batch Year</label>
                  <input type="number" value={formData.year} readOnly style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                </div>

                <div className={styles.inputGroup}><label>Full Name</label><input value={formData.name} onChange={e => set('name', e.target.value)} required /></div>
                <div className={styles.inputGroup}><label>Phone</label><input value={formData.phone} onChange={e => set('phone', e.target.value)} /></div>
                <div className={styles.inputGroup}><label>Date of Birth</label><input type="date" value={formData.dob} onChange={e => set('dob', e.target.value)} /></div>
                
                <div className={styles.inputGroup}><label>Program</label>
                  <select value={formData.program} onChange={e => set('program', e.target.value)} required>
                    <option value="">Select Program...</option>
                    <option>B.Sc in CSE</option>
                    <option>B.Sc in EEE</option>
                    <option>BBA</option>
                    <option>BA in English</option>
                    <option>B.Sc in Architecture</option>
                    <option>M.Sc in CSE</option>
                    <option>MBA</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Account Due ($)</label>
                  <input type="number" step="0.01" value={formData.previous_due} onChange={e => set('previous_due', parseFloat(e.target.value))} />
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Faculty Advisor</label>
                  <select value={formData.advisor_email} onChange={handleAdvisorChange}>
                    <option value="">-- Unassigned --</option>
                    {deptFaculties.map(f => (
                      <option key={f.email} value={f.email}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <button type="submit" className={styles.btnPrimary} style={{ marginTop: '15px' }}>
            {editingId ? 'Update Profile' : 'Generate Registration'}
          </button>
        </form>
      </Modal>

      {/* Grades Modal */}
      {showGrades && gradesData && (
        <Modal isOpen={true} onClose={() => setShowGrades(false)} title={`Grade Report & Schedule: ${formData.name}`} wide>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', overflowX: 'auto' }}>
            <h4 style={{ marginBottom: '15px' }}>CGPA: {
              (() => {
                let totalPts = 0, totalCr = 0;
                gradesData.forEach(c => {
                  if (c.grade && c.point !== null) {
                    const point = parseFloat(c.point) || 0;
                    const credits = parseFloat(c.credits) || 0;
                    totalPts += (point * credits);
                    totalCr += credits;
                  }
                });
                return totalCr ? (totalPts / totalCr).toFixed(2) : '0.00';
              })()
            }</h4>
            <table className={styles.dataTable} style={{ width: '100%', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Semester</th>
                  <th>Schedule</th>
                  <th>Room</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {gradesData.length > 0 ? gradesData.map(g => {
                  let scheduleStr = `${g.theory_days || ''} ${g.theory_time || ''}`.trim();
                  if (g.lab_day) scheduleStr += ` | Lab: ${g.lab_day} ${g.lab_time}`;
                  scheduleStr = scheduleStr || 'TBA';
                  
                  return (
                    <tr key={g.id}>
                      <td>{g.code}</td>
                      <td>{g.name}</td>
                      <td>{g.semester}</td>
                      <td style={{ fontSize: '0.9em' }}>{scheduleStr}</td>
                      <td>{g.room_number || 'TBA'}</td>
                      <td style={{ fontWeight: 'bold', color: g.status === 'enrolled' ? 'var(--warning-color, #f59e0b)' : 'var(--indigo-primary)' }}>
                        {g.status === 'enrolled' ? 'Pending' : (g.grade || 'N/A')}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>No courses found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Financials Modal */}
      {showFinancials && financialsData && (
        <Modal isOpen={true} onClose={() => setShowFinancials(false)} title={`Financial History: ${formData.name}`} wide>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px' }}>
            <h4>Total Outstanding Due: ${financialsData.total_payable || 0}</h4>
            <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
              {financialsData.transactions?.length > 0 ? financialsData.transactions.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <strong>{l.type.toUpperCase()}</strong> - {l.description}
                    <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{new Date(l.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: l.type === 'charge' ? 'var(--error-color, #ef4444)' : 'var(--success-color, #22c55e)' }}>
                    {l.type === 'charge' ? '-' : '+'}${l.amount}
                  </div>
                </div>
              )) : <p>No transactions found.</p>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
