import { useState, useEffect } from 'react';
import { getAdminMessages, getAdminMessageThread, replyToAdminMessage, updateMessageStatus } from '../../../api';
import styles from '../AdminDashboard.module.scss';

export default function MessagesView() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Thread State
  const [activeThread, setActiveThread] = useState(null);
  const [threadData, setThreadData] = useState(null);
  const [replyBody, setReplyBody] = useState('');

  const loadData = async () => {
    try {
      const res = await getAdminMessages();
      if (res.success) setMessages(res.messages);
    } catch (e) {
      console.error(e);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openThread = async (id) => {
    setActiveThread(id);
    setThreadData(null);
    try {
      const res = await getAdminMessageThread(id);
      if (res.success) {
        setThreadData(res);
        // Refresh inbox so the message shows as "read"
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    try {
      const res = await replyToAdminMessage(activeThread, { body: replyBody });
      if (res.success) {
        setReplyBody('');
        await openThread(activeThread);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await updateMessageStatus(activeThread, status);
      if (res.success) {
        await openThread(activeThread);
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading messages...</div>;

  return (
    <div className={styles.card}>
      <h3>Message Center</h3>

      {activeThread && threadData ? (
        <div>
          <button onClick={() => setActiveThread(null)} style={{ marginBottom: '15px', background: 'transparent', border: 'none', color: 'var(--indigo-primary, #3b82f6)', cursor: 'pointer', fontWeight: 'bold' }}>
            &larr; Back to Inbox
          </button>
          
          <div style={{ background: 'var(--bg-inset, #f9fafb)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>{threadData.message.subject}</h4>
                <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                  From: <strong>{threadData.message.sender_id}</strong> | Sent: {new Date(threadData.message.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ padding: '6px 12px', borderRadius: '4px', background: threadData.message.status === 'resolved' ? 'var(--success-color, #22c55e)' : 'var(--text-muted)', color: 'white', fontWeight: 'bold', fontSize: '0.85em' }}>
                  {threadData.message.status.toUpperCase()}
                </span>
                {threadData.message.status !== 'resolved' && (
                  <button onClick={() => handleStatusChange('resolved')} style={{ padding: '6px 12px', borderRadius: '4px', background: 'var(--success-color, #22c55e)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-main)' }}>Initial Request ({threadData.message.sender_type}):</strong>
                <p style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{threadData.message.body}</p>
              </div>

              {threadData.replies.map(reply => (
                <div key={reply.id} style={{ 
                  background: reply.sender_type === 'admin' ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-card)', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: reply.sender_type === 'admin' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--border-color)',
                  marginLeft: reply.sender_type === 'admin' ? '20px' : '0'
                }}>
                  <strong style={{ color: reply.sender_type === 'admin' ? 'var(--indigo-primary, #3b82f6)' : 'var(--text-main)' }}>
                    {reply.sender_type.toUpperCase()}:
                  </strong>
                  <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>{new Date(reply.created_at).toLocaleString()}</div>
                  <p style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{reply.body}</p>
                </div>
              ))}
            </div>

            {threadData.message.status !== 'resolved' && (
              <form onSubmit={handleReply} style={{ marginTop: '20px' }}>
                <textarea 
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type a reply to the student..."
                  style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontFamily: 'inherit' }}
                />
                <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', background: 'var(--indigo-primary, #4f46e5)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Send Reply
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div>
          {error && <div style={{ color: 'var(--error-color, #ef4444)', marginBottom: '10px' }}>{error}</div>}
          
          {messages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No messages found.</p>
          ) : (
            <table className={styles.dataTable} style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>From</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Subject</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(m => (
                  <tr 
                    key={m.id} 
                    onClick={() => openThread(m.id)}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      background: m.status === 'unread' ? 'var(--error-bg, rgba(239, 68, 68, 0.05))' : 'transparent',
                      fontWeight: m.status === 'unread' ? 'bold' : 'normal'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = m.status === 'unread' ? 'var(--error-bg, rgba(239, 68, 68, 0.05))' : 'transparent'}
                  >
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', 
                        background: m.status === 'unread' ? 'var(--error-color, #ef4444)' : m.status === 'resolved' ? 'var(--success-color, #22c55e)' : 'var(--text-muted)', 
                        color: 'white' 
                      }}>
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{m.sender_id} <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>({m.sender_type})</span></td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{m.subject}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.9em' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
