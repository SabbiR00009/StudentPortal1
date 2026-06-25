import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getDropRequest, submitDropRequest } from '../../../api';
import styles from '../StudentDashboard.module.scss';

export default function DropSemesterView() {
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadRequest = async () => {
    try {
      const res = await getDropRequest(user.dbId);
      if (res.success) {
        setRequest(res.request);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [user.dbId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for dropping the semester.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await submitDropRequest(user.dbId, reason);
      if (res.success) {
        setReason("");
        await loadRequest();
      } else {
        setError(res.error || "Failed to submit request.");
      }
    } catch (err) {
      setError("An error occurred while submitting the request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.card}><p>Loading...</p></div>;

  return (
    <div className={styles.card}>
      <h3>Drop Semester</h3>
      
      {request ? (
        <div style={{ background: 'var(--bg-hover, rgba(128,128,128,0.1))', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color, rgba(128,128,128,0.2))' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Current Request Status</h4>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}><strong>Semester:</strong> {request.semester}</p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
            <strong>Status:</strong> 
            <span style={{ 
              marginLeft: '8px',
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '0.9em',
              fontWeight: 'bold',
              background: request.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : request.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
              color: request.status === 'approved' ? 'var(--success-color, #16a34a)' : request.status === 'rejected' ? 'var(--error-color, #dc2626)' : 'var(--warning-color, #ca8a04)'
            }}>
              {request.status.toUpperCase()}
            </span>
          </p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}><strong>Reason Submitted:</strong> {request.reason}</p>
          
          {request.admin_response && (
            <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Admin Feedback:</strong>
              <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>{request.admin_response}</p>
            </div>
          )}

          {request.status === 'approved' && (
            <p style={{ marginTop: '15px', color: 'var(--error-color, #dc2626)', fontWeight: 'bold' }}>
              Your semester has been successfully dropped. Advising is disabled.
            </p>
          )}
          {request.status === 'rejected' && (
            <button 
              onClick={() => setRequest(null)} 
              className={styles.button}
              style={{ marginTop: '15px', background: '#3b82f6', color: 'white' }}
            >
              Submit New Request
            </button>
          )}
        </div>
      ) : (
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Dropping a semester is a significant decision and must be approved by an advisor or admin. 
            If approved, your current class schedule will be cleared, and you will not be able to register for new classes this semester.
          </p>
          
          {error && <div style={{ color: 'var(--error-color, #ef4444)', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                Reason for Dropping Semester:
              </label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need to drop this semester..."
                style={{ 
                  width: '100%', 
                  minHeight: '120px', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border-color, #ccc)',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: '1em',
                  fontFamily: 'inherit'
                }}
                disabled={submitting}
              />
            </div>
            <button 
              type="submit" 
              className={styles.button} 
              style={{ background: 'var(--error-color, #ef4444)', color: 'white', padding: '10px 20px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Drop Request'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
