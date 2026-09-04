const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    department: user.department,
    roles: user.roles || [],
    permissions: user.permissions || []
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken
};
