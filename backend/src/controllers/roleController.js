const RoleModel = require('../models/roleModel');
const AuditModel = require('../models/auditModel');

class RoleController {
  static async getRoles(req, res) {
    try {
      const roles = await RoleModel.getAllRolesWithPermissions();
      return res.json({ success: true, count: roles.length, roles });
    } catch (err) {
      console.error('[Role Controller Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve roles.' });
    }
  }

  static async getPermissions(req, res) {
    try {
      const permissions = await RoleModel.getAllPermissions();
      return res.json({ success: true, count: permissions.length, permissions });
    } catch (err) {
      console.error('[Permission Controller Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve permissions.' });
    }
  }

  static async updateRolePermissions(req, res) {
    const { id } = req.params;
    const { permissions } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions must be an array of permission codes.' });
    }

    try {
      await RoleModel.updateRolePermissions(id, permissions);

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'PERMISSION_CHANGED',
        resource: `/api/admin/roles/${id}/permissions`,
        ipAddress,
        status: 'SUCCESS',
        details: { roleId: id, updatedPermissions: permissions }
      });

      return res.json({ success: true, message: 'Role permissions updated successfully.' });
    } catch (err) {
      console.error('[Update Role Perms Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to update role permissions.' });
    }
  }
}

module.exports = RoleController;
