const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/student/studentController');
const dropSemesterController = require('../../controllers/student/dropSemesterController');
const messageController = require('../../controllers/student/messageController');
const advisingRoutes = require('./advisingRoutes');
const { getActiveSemester } = require('../../helpers/semesterManager');
const { verifyToken, isStudent } = require('../../middleware/authMiddleware');

router.use(verifyToken, isStudent);

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

// Drop Semester Request Routes
router.get('/:studentId/drop-request', dropSemesterController.getDropRequest);
router.post('/drop-request', dropSemesterController.submitDropRequest);

// Messages
router.get('/messages', messageController.getMessages);
router.post('/messages', messageController.sendMessage);
router.get('/messages/faculty-contacts', messageController.getFacultyContacts);
router.get('/messages/:messageId', messageController.getMessageThread);
router.post('/messages/:messageId/reply', messageController.replyMessage);

module.exports = router;
