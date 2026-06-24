const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/student/studentController');
const advisingRoutes = require('./advisingRoutes');
const { getActiveSemester } = require('../../helpers/semesterManager');

router.use('/advising', advisingRoutes);

router.get('/active-semester', async (req, res) => {
  const activeSem = await getActiveSemester();
  res.json({ activeSem });
});

router.get('/:id', studentController.getStudentById);
router.get('/:id/courses', studentController.getStudentCourses);
router.get('/:id/grades', studentController.getStudentGrades);
router.get('/:id/financials', studentController.getStudentFinancials);

router.post('/drop-course', studentController.dropCourse);
router.post('/drop-semester', studentController.dropSemester);

module.exports = router;
