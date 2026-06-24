const pool = require('../../db');

const getFinancials = async (req, res) => {
  try {
    const [report] = await pool.query(`
        SELECT s.id, s.student_id, s.name, s.department, s.payment_status, s.previous_due, SUM(c.credits) as total_credits 
        FROM students s 
        LEFT JOIN student_courses sc ON s.id = sc.student_id AND sc.status = 'enrolled' 
        LEFT JOIN courses c ON sc.course_id = c.id 
        GROUP BY s.id
    `);

    const data = report.map((r) => {
      const credits = r.total_credits || 0;
      const currentCharges = (credits * 150) + 500;
      return {
        ...r,
        total_credits: credits,
        current_charges: currentCharges,
        total_payable: currentCharges + parseFloat(r.previous_due || 0)
      };
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateFinancialStatus = async (req, res) => {
  try {
    const { studentId, status } = req.body;
    if (status === 'Paid') {
      await pool.query("UPDATE students SET payment_status = ?, previous_due = 0 WHERE id = ?", [status, studentId]);
    } else {
      await pool.query("UPDATE students SET payment_status = ? WHERE id = ?", [status, studentId]);
    }
    res.json({ success: true, message: "Status Updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getFinancials,
  updateFinancialStatus
};
