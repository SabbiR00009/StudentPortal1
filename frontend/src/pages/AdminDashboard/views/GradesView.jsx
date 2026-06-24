import { useState } from 'react';
import { searchStudentForGrades, getPendingCourses, submitBatchGrades } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function GradesView() {
  const [query, setQuery] = useState('');
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [marks, setMarks] = useState({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const data = await searchStudentForGrades(query);
      if (data && data.id) {
        setStudent(data);
        const pending = await getPendingCourses(data.id);
        setCourses(pending);
        setMarks({});
      } else { alert('Student not found.'); }
    } catch (e) { alert('Not found.'); }
  };

  const handleSubmit = async () => {
    if (!student) return;
    const grades = Object.entries(marks).map(([courseId, m]) => ({ courseId: parseInt(courseId), marks: parseInt(m) })).filter(g => !isNaN(g.marks));
    if (grades.length === 0) return alert('Enter at least one grade.');
    try {
      await submitBatchGrades(student.id, grades);
      alert('Grades submitted!');
      setCourses([]); setStudent(null); setQuery('');
    } catch (e) { alert(e.error || 'Error'); }
  };

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-star-half-alt"></i> Grade Management</h2></div>
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <input className={styles.searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search student by ID or name..." />
          <button className={styles.btnPrimary} onClick={handleSearch}><i className="fas fa-search"></i> Find</button>
        </div>
        {student && (
          <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '20px' }}>
            <strong>{student.name}</strong> — {student.student_id} ({student.department})
          </div>
        )}
        {courses.length > 0 && (
          <>
            <table className={styles.dataTable}>
              <thead><tr><th>Code</th><th>Course</th><th>Cr</th><th>Marks (0-100)</th></tr></thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>{c.code}</td><td>{c.name}</td><td>{c.credits}</td>
                    <td><input type="number" min="0" max="100" value={marks[c.id] || ''} onChange={e => setMarks(p => ({ ...p, [c.id]: e.target.value }))} style={{ width: '80px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className={styles.btnPrimary} onClick={handleSubmit} style={{ marginTop: '15px' }}>Submit Grades</button>
          </>
        )}
      </div>
    </>
  );
}
