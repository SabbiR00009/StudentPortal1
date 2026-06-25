import { useState, useEffect } from 'react';
import { getFacultyContacts, sendStudentMessage, getStudentMessages, getMessageThread, replyToMessage } from '../../../api';
import styles from '../StudentDashboard.module.scss';

export default function ContactView() {
  const [faculty, setFaculty] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [recipient, setRecipient] = useState(''); // 'admin' or faculty_id
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Thread State
  const [activeThread, setActiveThread] = useState(null); // messageId
  const [threadData, setThreadData] = useState(null);
  const [replyBody, setReplyBody] = useState('');

  const loadData = async () => {
    try {
      const [facRes, msgRes] = await Promise.all([
        getFacultyContacts(),
        getStudentMessages()
      ]);
      if (facRes.success) setFaculty(facRes.faculty);
      if (msgRes.success) setMessages(msgRes.messages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipient || !subject.trim() || !body.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    
    let rec_id = 'admin';
    let rec_type = 'admin';
    if (recipient !== 'admin') {
      rec_id = recipient;
      rec_type = 'faculty';
    }

    try {
      const res = await sendStudentMessage({
        receiver_id: rec_id,
        receiver_type: rec_type,
        subject,
        body
      });
      if (res.success) {
        setSubject('');
        setBody('');
        setRecipient('');
        await loadData();
        alert('Message sent successfully!');
      } else {
        setError(res.error || 'Failed to send message.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const openThread = async (id) => {
    setActiveThread(id);
    setThreadData(null);
    try {
      const res = await getMessageThread(id);
      if (res.success) {
        setThreadData(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    try {
      const res = await replyToMessage(activeThread, { body: replyBody });
      if (res.success) {
        setReplyBody('');
        await openThread(activeThread); // refresh thread
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.card}>
      <h3>Contact & Support</h3>

      {activeThread && threadData ? (
        <div>
          <button onClick={() => setActiveThread(null)} style={{ marginBottom: '15px', background: 'transparent', border: 'none', color: 'var(--indigo-primary, #3b82f6)', cursor: 'pointer', fontWeight: 'bold' }}>
            &larr; Back to Inbox
          </button>
          
          <div style={{ background: 'var(--bg-inset, #f9fafb)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>{threadData.message.subject}</h4>
            <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: '15px' }}>
              Status: <strong>{threadData.message.status.toUpperCase()}</strong> | 
              Sent: {new Date(threadData.message.created_at).toLocaleString()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-main)' }}>You (Initial Request):</strong>
                <p style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{threadData.message.body}</p>
              </div>

              {threadData.replies.map(reply => (
                <div key={reply.id} style={{ 
                  background: reply.sender_type === 'student' ? 'var(--bg-card)' : 'rgba(59, 130, 246, 0.05)', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: reply.sender_type === 'student' ? '1px solid var(--border-color)' : '1px solid rgba(59, 130, 246, 0.2)',
                  marginLeft: reply.sender_type === 'student' ? '0' : '20px'
                }}>
                  <strong style={{ color: reply.sender_type === 'student' ? 'var(--text-main)' : 'var(--indigo-primary, #3b82f6)' }}>
                    {reply.sender_type === 'student' ? 'You' : reply.sender_type.toUpperCase()}:
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
                  placeholder="Type a reply..."
                  style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }}
                />
                <button type="submit" className={styles.addBtn} style={{ marginTop: '10px' }}>Send Reply</button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* New Message Form */}
          <div>
            <h4 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Send a New Message</h4>
            {error && <div style={{ color: 'var(--error-color, #ef4444)', marginBottom: '10px', fontWeight: 'bold' }}>{error}</div>}
            
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-main)', fontWeight: 'bold' }}>To:</label>
                <select 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }}
                >
                  <option value="">-- Select Recipient --</option>
                  <option value="admin">Admin / Advisor Office</option>
                  {faculty.map(f => (
                    <option key={f.faculty_id} value={f.faculty_id}>
                      {f.name} ({f.course_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-main)', fontWeight: 'bold' }}>Subject:</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-main)', fontWeight: 'bold' }}>Message:</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  style={{ width: '100%', minHeight: '120px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className={styles.confirmBtn} disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Inbox List */}
          <div>
            <h4 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Your Messages</h4>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No messages found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => openThread(m.id)}
                    style={{ 
                      padding: '15px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)', 
                      background: 'var(--bg-inset, #f9fafb)',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-inset, #f9fafb)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{m.subject}</strong>
                      <span style={{ fontSize: '0.8em', padding: '2px 8px', borderRadius: '12px', background: m.status === 'unread' ? 'var(--error-bg, rgba(239, 68, 68, 0.1))' : 'rgba(0,0,0,0.05)', color: m.status === 'unread' ? 'var(--error-color, #ef4444)' : 'var(--text-muted)' }}>
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                      To: {m.receiver_type === 'admin' ? 'Admin' : 'Faculty'} | Replies: {m.reply_count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
