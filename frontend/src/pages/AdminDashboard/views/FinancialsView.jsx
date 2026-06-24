import { useState, useEffect } from 'react';
import { getAdminFinancials, updateFinancialStatus } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function FinancialsView() {
  const [data, setData] = useState([]);
  useEffect(() => { load(); }, []);
  const load = () => getAdminFinancials().then(setData).catch(console.error);

  const toggleStatus = async (id, current) => {
    const next = current === 'Paid' ? 'Due' : 'Paid';
    try { await updateFinancialStatus(id, next); load(); } catch (e) { alert('Error'); }
  };

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-dollar-sign"></i> Financial Report</h2></div>
      <div className={styles.card}>
        <table className={styles.dataTable}>
          <thead><tr><th>SID</th><th>Name</th><th>Dept</th><th>Prev Due</th><th>Tuition</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {data.map(s => (
              <tr key={s.id}>
                <td>{s.student_id}</td><td>{s.name}</td><td>{s.department}</td>
                <td>${s.previous_due}</td><td>${s.current_charges}</td><td style={{ fontWeight: 'bold' }}>${s.total_payable}</td>
                <td><span className={`${styles.badge} ${s.payment_status === 'Paid' ? styles.badgePaid : styles.badgeDue}`}>{s.payment_status}</span></td>
                <td><button className={styles.btnSmall} onClick={() => toggleStatus(s.id, s.payment_status)}><i className="fas fa-sync"></i></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
