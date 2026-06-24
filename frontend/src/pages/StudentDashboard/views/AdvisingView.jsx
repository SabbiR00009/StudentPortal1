import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { checkAdvisingAccess, getAdvisingCourses, getStudentCourses, validateAdvising, confirmAdvising } from '../../../api';
import styles from '../StudentDashboard.module.scss';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function formatSchedule(c) {
  let s = `${c.theory_days} ${c.theory_time}`;
  if (c.lab_day) s += ` | Lab: ${c.lab_day} ${c.lab_time}`;
  return s;
}

export default function AdvisingView() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(true);
  const [lockedMessage, setLockedMessage] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [slip, setSlip] = useState([]);
  const [dept, setDept] = useState('All');
  const [sem, setSem] = useState('Fall-2025');
  const [enrolledCredits, setEnrolledCredits] = useState(0);

  const loadCatalog = useCallback(async () => {
    try {
      const gate = await checkAdvisingAccess(user.dbId);
      if (!gate.allowed) {
        setAllowed(false);
        setLockedMessage(gate.message);
        return;
      }
      setAllowed(true);

      const [catData, myData] = await Promise.all([
        getAdvisingCourses(dept),
        getStudentCourses(user.dbId),
      ]);

      const enrolledCodes = myData.filter(c => c.status === 'enrolled').map(c => c.code);
      setEnrolledCredits(myData.filter(c => c.status === 'enrolled').reduce((s, c) => s + (c.credits || 0), 0));
      
      // catData now returns { courses, activeSem }
      setCatalog(catData.courses.filter(c => !enrolledCodes.includes(c.code)));
      setSem(catData.activeSem);
    } catch (e) { console.error(e); }
  }, [user.dbId, dept]);

  useEffect(() => {
    loadCatalog();
    const interval = setInterval(loadCatalog, 3000);
    return () => clearInterval(interval);
  }, [loadCatalog]);

  const addToSlip = async (course) => {
    if (slip.find(s => s.id === course.id)) return;
    const slipCredits = slip.reduce((sum, s) => sum + s.credits, 0);
    if (enrolledCredits + slipCredits + course.credits > 15) {
      return alert('Credit Limit Exceeded! Max 15 credits.');
    }

    try {
      const data = await validateAdvising(user.dbId, course.id, slip.map(s => s.id));
      if (!data.success) { alert('🚫 Cannot Add Course:\n\n' + data.error); return; }
      setSlip(prev => [...prev, { id: course.id, code: course.code, name: course.name, credits: course.credits }]);
    } catch (e) { alert('Server validation failed.'); }
  };

  const removeFromSlip = (id) => setSlip(prev => prev.filter(s => s.id !== id));

  const generatePDF = (confirmedCourses) => {
    const doc = new jsPDF();
    const totalCredits = confirmedCourses.reduce((sum, c) => sum + parseFloat(c.credits), 0);
    const totalMoney = (totalCredits * 150) + 500;

    doc.setFontSize(20);
    doc.text('Student Advising Slip', 14, 22);

    doc.setFontSize(12);
    doc.text(`Student: ${user.name} (${user.id})`, 14, 32);
    doc.text(`Semester: ${sem}`, 14, 38);

    const tableData = confirmedCourses.map(c => [
      c.code,
      c.name,
      c.credits
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Course Code', 'Course Title', 'Credits']],
      body: tableData,
    });

    const finalY = doc.lastAutoTable.finalY || 45;
    doc.text(`Total Credits: ${totalCredits}`, 14, finalY + 10);
    doc.text(`Total Tuition Fee: $${totalCredits * 150}`, 14, finalY + 18);
    doc.text(`Semester Fee: $500`, 14, finalY + 26);
    doc.text(`Total Payable: $${totalMoney}`, 14, finalY + 34);

    doc.save(`Advising_Slip_${sem}.pdf`);
  };

  const handleConfirm = async () => {
    if (slip.length === 0) return alert('Slip is empty.');
    try {
      const data = await confirmAdvising(user.dbId, slip.map(s => s.id));
      if (data.success) {
        alert('✅ Enrolled Successfully! Downloading Advising Slip...');
        generatePDF(slip);
        setSlip([]);
        loadCatalog();
      } else { alert('❌ Failed: ' + data.message); }
    } catch (e) { alert('Server connection failed.'); }
  };

  const slipTotal = slip.reduce((sum, s) => sum + parseFloat(s.credits), 0);

  return (
    <div className={styles.advisingLayout}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, border: 'none' }}>Course Catalog ({sem})</h3>
          <span className={styles.liveBadge}><i className="fas fa-circle"></i> LIVE</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
          <select value={dept} onChange={e => setDept(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}>
            <option value="All">All Departments</option>
            <option value="CSE">CSE Dept</option>
            <option value="EEE">EEE Dept</option>
            <option value="BBA">BBA Dept</option>
            <option value="ACT">ACT Dept</option>
            <option value="ENG">English Dept</option>
          </select>
        </div>

        {!allowed ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '10px' }}>
            <i className="fas fa-lock" style={{ fontSize: '2em', color: '#e11d48', marginBottom: '15px' }}></i>
            <h3 style={{ color: '#9f1239' }}>Advising Locked</h3>
            <p>{lockedMessage}</p>
          </div>
        ) : (
          <div className={styles.catalogList}>
            {catalog.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>No courses available.</p>
            ) : catalog.map(c => {
              const isFull = c.seats_available <= 0;
              const inSlip = slip.find(s => s.id === c.id);
              return (
                <div key={c.id} className={styles.catalogItem}>
                  <div>
                    <strong>{c.code} {c.name}</strong>
                    <div className={styles.catalogMeta}>
                      <span><i className="fas fa-clock"></i> {formatSchedule(c)}</span>
                      <span><i className="fas fa-user"></i> {c.instructor}</span>
                      <span><i className="fas fa-star"></i> {c.credits} Cr</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`${styles.seatBadge} ${isFull ? styles.seatFull : styles.seatOpen}`}>
                      {c.seats_available} Seats
                    </span>
                    <div style={{ marginTop: '5px' }}>
                      <button className={styles.addBtn} onClick={() => addToSlip(c)} disabled={inSlip || isFull}>
                        <i className="fas fa-plus"></i> {inSlip ? 'In Slip' : isFull ? 'Full' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.slipCard}>
        <div className={styles.slipHeader}><h3>Advising Slip</h3></div>
        <div className={styles.slipList}>
          {slip.length === 0 ? (
            <div className={styles.emptyState}><i className="fas fa-basket-shopping"></i><p>Select courses from the catalog.</p></div>
          ) : slip.map(s => (
            <div key={s.id} className={styles.slipItem}>
              <div><strong>{s.code}</strong> ({s.credits} Cr)</div>
              <button className={styles.removeBtn} onClick={() => removeFromSlip(s.id)}><i className="fas fa-times"></i></button>
            </div>
          ))}
        </div>
        <div className={styles.slipFooter}>
          <div className={styles.slipSummary}>
            <span>Total Credits:</span>
            <span style={{ fontWeight: 'bold', color: '#4F46E5' }}>{slipTotal}</span>
          </div>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={!allowed || slip.length === 0}>
            Confirm Registration <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
