const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_TOKEN_MISSING',
      message: 'Access denied: Authentication token is missing.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session has expired. Please log in again to continue.'
      });
    }
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token.'
    });
  }
}

module.exports = {
  authenticate
};
