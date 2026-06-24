import { useState, useEffect } from 'react';
import { getCourseStudents, submitFacultyGrade } from '../../../api';
import styles from '../FacultyDashboard.module.scss';

export default function CourseManager({ course, onBack }) {
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});

  useEffect(() => {
    if (course) getCourseStudents(course.id).then(setStudents).catch(console.error);
  }, [course]);

  const handleGrade = async (student) => {
    const m = marks[student.id];
    if (!m || isNaN(m)) return alert('Enter valid marks (0-100).');
    try {
      const data = await submitFacultyGrade({ studentDbId: student.id, courseId: course.id, marks: parseInt(m), semester: course.semester });
      if (data.success) alert(`Grade: ${data.grade} (${data.point})`);
    } catch (e) { alert(e.error || 'Error'); }
  };

  if (!course) return <p>Select a course.</p>;

  return (
    <>
      <div className={styles.pageTitle}>
        <h2><i className="fas fa-users"></i> {course.code} — {course.name}</h2>
        <button className={styles.btnSmall} onClick={onBack}><i className="fas fa-arrow-left"></i> Back</button>
      </div>
      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>SID</th><th>Name</th><th>Marks (0-100)</th><th>Action</th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.student_id}</td><td>{s.name}</td>
                <td><input type="number" min="0" max="100" value={marks[s.id] || ''} onChange={e => setMarks(p => ({ ...p, [s.id]: e.target.value }))} style={{ width: '80px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} /></td>
                <td><button className={styles.btnPrimary} onClick={() => handleGrade(s)} style={{ padding: '6px 12px' }}>Submit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div className={styles.emptyState}><i className="fas fa-user-slash"></i><p>No students enrolled.</p></div>}
      </div>
    </>
  );
}
