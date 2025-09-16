const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // For development/testing purposes, bypass authentication if SKIP_AUTH is true
  if (process.env.SKIP_AUTH === 'true') {
    // In a real scenario, you might want to mock a user object here for testing protected routes
    req.user = { id: req.body.userId || 1, role: 'user' }; // Mock user for testing
    return next();
  }

  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};
