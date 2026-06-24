import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getStudentFinancials } from '../../../api';
import styles from '../StudentDashboard.module.scss';

export default function FinancialsView() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    getStudentFinancials(user.dbId).then(setData).catch(console.error);
  }, []);

  if (!data) return <div className={styles.card}><h3>Financial Status</h3><p>Loading...</p></div>;

  const isPaid = data.status === 'Paid';
  const statusColor = isPaid ? 'green' : (data.status === 'Refunded' ? 'gray' : '#dc2626');

  return (
    <div className={styles.card}>
      <h3>Financial Status</h3>
      <div className={`${styles.financialBox} ${isPaid ? styles.paid : styles.due}`}>
        <div className={styles.financialHeader}>
          <div>
            <h2 style={{ margin: 0, color: '#374151' }}>Financial Overview</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9em' }}>Semester: Fall-2025</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={styles.paymentBadge} style={{ background: statusColor }}>{data.status}</span>
            <div style={{ marginTop: '5px', fontSize: '0.8em', color: '#666' }}>Due: {data.dueDate}</div>
          </div>
        </div>
        <table style={{ width: '100%', fontSize: '0.95em' }}>
          <tbody>
            <tr><td style={{ padding: '8px 0', color: '#4b5563' }}>Previous Dues:</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>${data.previous_due}</td></tr>
            <tr><td style={{ padding: '8px 0', color: '#4b5563' }}>Current Tuition ({data.credits} Cr):</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>${data.current_charges}</td></tr>
            <tr style={{ borderTop: '2px solid rgba(0,0,0,0.1)' }}><td style={{ padding: '15px 0', fontSize: '1.1em', fontWeight: 'bold' }}>Total Payable:</td><td style={{ padding: '15px 0', textAlign: 'right', fontSize: '1.4em', fontWeight: 900, color: '#1f2937' }}>${data.total_payable}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
