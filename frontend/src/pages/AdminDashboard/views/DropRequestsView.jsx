import { useState, useEffect } from 'react';
import { getAdminDropRequests, updateDropRequestStatus } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function DropRequestsView() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [responseMsg, setResponseMsg] = useState({}); // Track response input per request ID

  const loadRequests = async () => {
    try {
      const res = await getAdminDropRequests();
      if (res.success) {
        setRequests(res.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdate = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toUpperCase()} this request?`)) return;
    
    setProcessing(id);
    try {
      const adminResponse = responseMsg[id] || "";
      const res = await updateDropRequestStatus(id, status, adminResponse);
      if (res.success) {
        alert(res.message);
        await loadRequests();
      } else {
        alert(res.error || 'Failed to update request');
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div>Loading drop requests...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h2>Semester Drop Requests</h2>
      </div>

      <div className={styles.card}>
        {requests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No drop requests found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.dataTable} style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Student</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Semester</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Reason</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{r.student_name}</div>
                      <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{r.student_roll}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{r.semester}</td>
                    <td style={{ padding: '12px', maxWidth: '300px' }}>
                      <p style={{ margin: 0, fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>{r.reason}</p>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 'bold',
                        background: r.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : r.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: r.status === 'approved' ? 'var(--success-color, #16a34a)' : r.status === 'rejected' ? 'var(--error-color, #dc2626)' : 'var(--warning-color, #ca8a04)'
                      }}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          <input 
                            type="text" 
                            placeholder="Optional response..." 
                            value={responseMsg[r.id] || ''}
                            onChange={(e) => setResponseMsg({...responseMsg, [r.id]: e.target.value})}
                            style={{ padding: '6px', fontSize: '0.85em', width: '180px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                            disabled={processing === r.id}
                          />
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button 
                              onClick={() => handleUpdate(r.id, 'approved')}
                              style={{ padding: '6px 12px', background: 'var(--success-color, #22c55e)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              disabled={processing === r.id}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleUpdate(r.id, 'rejected')}
                              style={{ padding: '6px 12px', background: 'var(--error-color, #ef4444)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              disabled={processing === r.id}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                          Processed
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
