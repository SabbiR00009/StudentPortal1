const express = require('express');
const router = express.Router();
const advisingController = require('../../controllers/student/advisingController');

router.get('/check-access/:studentId', advisingController.checkAccess);
router.get('/courses', advisingController.getCourses);
router.post('/validate', advisingController.validateSlip);
router.post('/confirm', advisingController.confirmSlip);

module.exports = router;
