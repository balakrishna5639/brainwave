const AuditModel = require('../models/auditModel');

/**
 * Verifies if the authenticated user possesses one of the allowed roles.
 * @param {string[]} allowedRoles
 */
function verifyRole(allowedRoles = []) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role)) || userRoles.includes('Admin');

    if (!hasRole) {
      // Audit unauthorized access attempt
      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'UNAUTHORIZED_ACCESS',
        resource: req.originalUrl,
        ipAddress: req.ip || req.connection.remoteAddress,
        status: 'FAILURE',
        details: {
          reason: 'Role restriction violated',
          requiredRoles: allowedRoles,
          userRoles: userRoles,
          method: req.method
        }
      }).catch(err => console.error('[Audit Error]', err));

      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: 'Access Denied: Your assigned role does not permit access to this resource.'
      });
    }

    next();
  };
}

/**
 * Verifies if the authenticated user has a specific granular permission.
 * Admin role automatically passes all permission checks.
 * @param {string} requiredPermission
 */
function verifyPermission(requiredPermission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRoles = req.user.roles || [];
    const userPermissions = req.user.permissions || [];

    const isAdmin = userRoles.includes('Admin');
    const hasPermission = isAdmin || userPermissions.includes(requiredPermission);

    if (!hasPermission) {
      // Record unauthorized attempt in audit log
      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'UNAUTHORIZED_ACCESS',
        resource: req.originalUrl,
        ipAddress: req.ip || req.connection.remoteAddress,
        status: 'FAILURE',
        details: {
          reason: 'Missing required permission',
          requiredPermission,
          userRoles,
          userPermissions,
          method: req.method
        }
      }).catch(err => console.error('[Audit Error]', err));

      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_PERMISSION',
        message: `Forbidden: Insufficient permissions. Required: "${requiredPermission}".`
      });
    }

    next();
  };
}

module.exports = {
  verifyRole,
  verifyPermission
};
