import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getFacultyAdvisees, getFacultyStudentProfile } from '../../../api';
import Modal from '../../../components/Modal/Modal';
import styles from '../FacultyDashboard.module.scss';

export default function AdvisingView() {
  const { user } = useAuth();
  const [advisees, setAdvisees] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.email) {
      getFacultyAdvisees(user.email).then(setAdvisees).catch(console.error);
    }
  }, [user]);

  const viewStudent = async (id) => {
    try {
      const data = await getFacultyStudentProfile(id);
      setSelectedProfile(data);
      setShowModal(true);
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-user-check"></i> My Advisees</h2></div>
      <div className={styles.card}>
        {advisees.length === 0 ? (
          <div className={styles.emptyState}><i className="fas fa-user-friends"></i><p>No advisees assigned.</p></div>
        ) : (
          <table className={styles.dataTable}>
            <thead><tr><th>SID</th><th>Name</th><th>Dept</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {advisees.map(a => (
                <tr key={a.id}>
                  <td>{a.student_id}</td><td>{a.name}</td><td>{a.department}</td>
                  <td><span className={`${styles.badge} ${styles.enrolled}`}>{a.advising_status || 'Active'}</span></td>
                  <td><button className={styles.btnSmall} onClick={() => viewStudent(a.student_id)}><i className="fas fa-eye"></i> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Student Profile" wide>
        {selectedProfile && (
          <div>
            <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{selectedProfile.student?.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>{selectedProfile.student?.student_id} — {selectedProfile.student?.department}</p>
            </div>
            {selectedProfile.current?.length > 0 && (
              <>
                <h4>Current Courses</h4>
                <table className={styles.dataTable}>
                  <thead><tr><th>Code</th><th>Name</th><th>Schedule</th></tr></thead>
                  <tbody>{selectedProfile.current.map((c, i) => (
                    <tr key={i}><td>{c.code}</td><td>{c.name}</td><td>{c.schedule}</td></tr>
                  ))}</tbody>
                </table>
              </>
            )}
            {selectedProfile.history?.length > 0 && (
              <>
                <h4 style={{ marginTop: '15px' }}>Grade History</h4>
                <table className={styles.dataTable}>
                  <thead><tr><th>Semester</th><th>Code</th><th>Course</th><th>Grade</th></tr></thead>
                  <tbody>{selectedProfile.history.map((g, i) => (
                    <tr key={i}><td>{g.semester}</td><td>{g.code}</td><td>{g.name}</td><td><strong>{g.grade}</strong></td></tr>
                  ))}</tbody>
                </table>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
