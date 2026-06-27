const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') next();
  else res.status(403).json({ error: 'Forbidden: Requires student role' });
};

const isFaculty = (req, res, next) => {
  if (req.user && req.user.role === 'faculty') next();
  else res.status(403).json({ error: 'Forbidden: Requires faculty role' });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ error: 'Forbidden: Requires admin role' });
};

module.exports = {
  verifyToken,
  isStudent,
  isFaculty,
  isAdmin
};
