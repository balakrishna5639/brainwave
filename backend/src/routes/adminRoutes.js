const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const RoleController = require('../controllers/roleController');
const AuditController = require('../controllers/auditController');
const { authenticate } = require('../middlewares/auth');
const { verifyPermission } = require('../middlewares/rbac');

router.use(authenticate);

// User Management
router.get('/users', verifyPermission('manage:users'), UserController.getAllUsers);
router.post('/users', verifyPermission('manage:users'), UserController.createUser);
router.put('/users/:id', verifyPermission('manage:users'), UserController.updateUser);
router.delete('/users/:id', verifyPermission('manage:users'), UserController.deleteUser);

// Role & Permission Management
router.get('/roles', verifyPermission('manage:roles'), RoleController.getRoles);
router.get('/permissions', verifyPermission('manage:roles'), RoleController.getPermissions);
router.put('/roles/:id/permissions', verifyPermission('manage:roles'), RoleController.updateRolePermissions);

// Audit Log Viewer
router.get('/audit-logs', verifyPermission('view:audit_logs'), AuditController.getLogs);

module.exports = router;
