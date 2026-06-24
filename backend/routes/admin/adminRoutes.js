const express = require('express');
const facultyController = require('../../controllers/admin/facultyController');
const studentController = require('../../controllers/admin/studentController');
const courseController = require('../../controllers/admin/courseController');
const gradeController = require('../../controllers/admin/gradeController');
const financialsController = require('../../controllers/admin/financialsController');
const miscController = require('../../controllers/admin/miscController');

const router = express.Router();

// Faculty
router.get('/faculty', facultyController.getFaculty);
router.post('/faculty', facultyController.createFaculty);
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
router.put('/courses/:id/capacity', courseController.updateCapacity);
router.delete('/courses/:id', courseController.deleteCourse);

// Grades
router.get('/grades/search-student', gradeController.searchStudent);
router.get('/grades/pending-courses/:studentId', gradeController.getPendingCourses);
router.post('/grades/batch', gradeController.batchPublishGrades);

// Financials
router.get('/financials', financialsController.getFinancials);
router.put('/financials/status', financialsController.updateFinancialStatus);

const { checkAndTransitionSemester } = require('../../helpers/semesterManager');

// Misc
router.post('/admins', miscController.createAdmin);
router.post('/semesters', miscController.createSemester);
router.post('/announcements', miscController.postAnnouncement);
router.get('/slots', miscController.getSlots);
router.post('/slots', miscController.createSlot);
router.delete('/slots/:id', miscController.deleteSlot);

// System
router.post('/system/trigger-semester-check', async (req, res) => {
  const result = await checkAndTransitionSemester(req.body.mockDate ? new Date(req.body.mockDate) : null);
  res.json(result);
});

module.exports = router;
