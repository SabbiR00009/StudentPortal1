const express = require('express');
const facultyController = require('../../controllers/admin/facultyController');
const studentController = require('../../controllers/admin/studentController');
const courseController = require('../../controllers/admin/courseController');
const financialsController = require('../../controllers/admin/financialsController');
const miscController = require('../../controllers/admin/miscController');

const router = express.Router();

// Faculty
router.get('/faculty', facultyController.getFaculty);
router.post('/faculty', facultyController.createFaculty);
router.put('/faculty/:id', facultyController.updateFaculty);
router.get('/faculty/:id/courses', facultyController.getFacultyCourses);
router.delete('/faculty/:id', facultyController.deleteFaculty);

// Students
router.get('/students', studentController.getStudents);
router.post('/students', studentController.createStudent);
router.put('/students/:id', studentController.updateStudent);
router.delete('/students/:id', studentController.deleteStudent);
router.post('/student/enroll', studentController.enrollStudent);
router.post('/student/drop', studentController.dropStudent);

// Courses & Schedule
router.get('/config/schedules', courseController.getSchedules);
router.get('/courses', courseController.getCourses);
router.post('/courses', courseController.createCourse);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

// Financials
router.get('/financials', financialsController.getFinancials);
router.put('/financials/status', financialsController.updateFinancialStatus);

const { checkAndTransitionSemester } = require('../../helpers/semesterManager');
const dropRequestController = require('../../controllers/admin/dropRequestController');

// Misc
router.post('/admins', miscController.createAdmin);
router.post('/announcements', miscController.postAnnouncement);
router.get('/slots', miscController.getSlots);
router.post('/slots', miscController.createSlot);
router.delete('/slots/:id', miscController.deleteSlot);

router.get('/drop-periods', miscController.getDropPeriods);
router.post('/drop-periods', miscController.createDropPeriod);
router.delete('/drop-periods/:id', miscController.deleteDropPeriod);

router.get('/settings', miscController.getSettings);
router.put('/settings', miscController.updateSettings);

// Drop Requests
router.get('/drop-requests', dropRequestController.getAllRequests);
router.put('/drop-requests/:id/status', dropRequestController.updateRequestStatus);

const messageController = require('../../controllers/admin/messageController');

// Messages & Overview
router.get('/overview-stats', messageController.getOverviewStats);
router.get('/messages', messageController.getAdminMessages);
router.get('/messages/:messageId', messageController.getMessageThread);
router.post('/messages/:messageId/reply', messageController.replyMessage);
router.put('/messages/:messageId/status', messageController.updateMessageStatus);

// System
router.post('/system/trigger-semester-check', async (req, res) => {
  const result = await checkAndTransitionSemester(req.body.mockDate ? new Date(req.body.mockDate) : null);
  res.json(result);
});

module.exports = router;
