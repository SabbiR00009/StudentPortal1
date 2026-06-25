import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getStudentFinancials } from '../../../api';
import styles from '../StudentDashboard.module.scss';

export default function FinancialsView() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    getStudentFinancials(user.dbId).then(setData).catch(console.error);
  }, [user.dbId]);

  if (!data) return <div className={styles.card}><h3>Financial Status</h3><p>Loading...</p></div>;

  const isPaid = data.status === 'Paid';
  const statusColor = isPaid ? 'var(--success-color, #22c55e)' : (data.status === 'Refunded' ? 'var(--text-muted, #6b7280)' : 'var(--error-color, #ef4444)');

  return (
    <div className={styles.card}>
      <h3>Financial Status</h3>
      <div className={`${styles.financialBox} ${isPaid ? styles.paid : styles.due}`}>
        <div className={styles.financialHeader}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary, #374151)' }}>Financial Overview</h2>
            <p style={{ margin: 0, color: 'var(--text-muted, #6b7280)', fontSize: '0.9em' }}>Semester: {data.activeSem}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={styles.paymentBadge} style={{ background: statusColor }}>{data.status}</span>
            <div style={{ marginTop: '5px', fontSize: '0.8em', color: 'var(--text-muted, #666)' }}>Due: {data.dueDate}</div>
          </div>
        </div>
        <table style={{ width: '100%', fontSize: '0.95em' }}>
          <tbody>
            <tr><td style={{ padding: '8px 0', color: 'var(--text-secondary, #4b5563)' }}>Previous Dues:</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary, #111)' }}>${data.previous_due}</td></tr>
            <tr><td style={{ padding: '8px 0', color: 'var(--text-secondary, #4b5563)' }}>Current Tuition ({data.credits} Cr):</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary, #111)' }}>${data.current_charges}</td></tr>
            <tr style={{ borderTop: '2px solid var(--border-color, rgba(0,0,0,0.1))' }}><td style={{ padding: '15px 0', fontSize: '1.1em', fontWeight: 'bold', color: 'var(--text-primary, #111)' }}>Total Payable:</td><td style={{ padding: '15px 0', textAlign: 'right', fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary, #1f2937)' }}>${data.total_payable}</td></tr>
          </tbody>
        </table>
      </div>

      {data.transactions && data.transactions.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Transaction History</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.dataTable} style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Description</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t, idx) => {
                  const amtStr = parseFloat(t.amount);
                  const isPayment = t.type.toLowerCase() === 'payment';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{t.description}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.85em', 
                          background: isPayment ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isPayment ? 'var(--success-color, #16a34a)' : 'var(--error-color, #dc2626)'
                        }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 'bold' }}>
                        {isPayment ? '+' : '-'}${Math.abs(amtStr).toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
