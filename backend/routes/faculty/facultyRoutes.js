const express = require('express');
const router = express.Router();
const facultyController = require('../../controllers/faculty/facultyController');

router.get('/:email/courses', facultyController.getFacultyCourses);
router.get('/:email/advisees', facultyController.getAdvisees);
router.get('/student-profile/:id', facultyController.getStudentProfile);
router.get('/course/:courseId/students', facultyController.getCourseStudents);
router.post('/submit-grade', facultyController.submitGrade);

module.exports = router;
