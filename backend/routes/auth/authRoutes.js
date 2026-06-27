const express = require('express');
const { login, logout, me, changePassword } = require('../../controllers/auth/authController');
const { verifyToken } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.post('/change-password', verifyToken, changePassword);

module.exports = router;
