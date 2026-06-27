import { useState, useEffect } from 'react';
import { getAdminPasswordResetRequests, updatePasswordResetRequestStatus } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function PasswordResetRequestsView() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  const load = async () => {
    try {
      const res = await getAdminPasswordResetRequests();
      if (res.success) setRequests(res.requests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async (id, status) => {
    const action = status === 'approved' ? 'APPROVE (this will reset the password to 123456)' : 'REJECT';
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

    setProcessing(id);
    try {
      const res = await updatePasswordResetRequestStatus(id, status, adminNotes[id] || '');
      if (res.success) {
        alert(res.message);
        await load();
      } else {
        alert(res.error || 'Failed to update request');
      }
    } catch (e) {
      alert(e.error || 'Error processing request');
    } finally {
      setProcessing(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  const statusBadge = (status) => {
    const colors = {
      pending: { bg: 'rgba(234,179,8,0.1)', color: '#b45309' },
      approved: { bg: 'rgba(34,197,94,0.1)', color: '#15803d' },
      rejected: { bg: 'rgba(239,68,68,0.1)', color: '#b91c1c' },
    };
    const style = colors[status] || {};
    return (
      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.8em', fontWeight: 'bold', background: style.bg, color: style.color }}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) return <div className={styles.card}><p>Loading...</p></div>;

  return (
    <>
      <div className={styles.pageTitle}><h2><i className="fas fa-key"></i> Password Reset Requests</h2></div>

      <div className={styles.card}>
        <h3>Pending Requests ({pending.length})</h3>
        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px 0' }}>No pending password reset requests.</p>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Requested At</th>
                <th>Admin Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.student_code}</strong></td>
                  <td>{r.student_name}</td>
                  <td>{r.department}</td>
                  <td>{r.email}</td>
                  <td>{new Date(r.requested_at).toLocaleString()}</td>
                  <td>
                    <input
                      type="text"
                      placeholder="Optional note..."
                      value={adminNotes[r.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                      style={{ padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--border-light, #ddd)', width: '150px', fontSize: '0.85em', background: 'transparent', color: 'inherit' }}
                    />
                  </td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleUpdate(r.id, 'approved')}
                      disabled={processing === r.id}
                      title="Approve – resets password to 123456"
                      style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' }}
                    >
                      <i className="fas fa-check"></i> Approve
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleUpdate(r.id, 'rejected')}
                      disabled={processing === r.id}
                    >
                      <i className="fas fa-times"></i> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {resolved.length > 0 && (
        <div className={styles.card} style={{ marginTop: '30px' }}>
          <h3>Resolved Requests</h3>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Resolved At</th>
                <th>Admin Note</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.student_code}</strong></td>
                  <td>{r.student_name}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{new Date(r.requested_at).toLocaleString()}</td>
                  <td>{r.resolved_at ? new Date(r.resolved_at).toLocaleString() : '-'}</td>
                  <td>{r.admin_note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
