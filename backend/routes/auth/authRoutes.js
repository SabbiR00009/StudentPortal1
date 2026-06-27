const express = require('express');
const { login, logout, me } = require('../../controllers/auth/authController');
const { verifyToken } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);

module.exports = router;
