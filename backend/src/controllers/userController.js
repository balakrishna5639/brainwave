const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const AuditModel = require('../models/auditModel');

class UserController {
  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      return res.json({ success: true, count: users.length, users });
    } catch (err) {
      console.error('[User Controller Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
    }
  }

  static async createUser(req, res) {
    const { name, email, password, department, roleName } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!name || !email || !password || !department || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, department, and role are required.'
      });
    }

    try {
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await UserModel.createUser({
        name,
        email,
        passwordHash,
        department,
        roleName
      });

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'USER_CREATED',
        resource: `/api/admin/users/${newUser.id}`,
        ipAddress,
        status: 'SUCCESS',
        details: { createdUserId: newUser.id, createdEmail: newUser.email, assignedRole: roleName }
      });

      return res.status(201).json({ success: true, message: 'User created successfully.', user: newUser });
    } catch (err) {
      console.error('[Create User Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to create user.' });
    }
  }

  static async updateUser(req, res) {
    const { id } = req.params;
    const { name, department, status, roleName } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      const targetUser = await UserModel.findById(id);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const updatedUser = await UserModel.updateUser(id, { name, department, status, roleName });

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'USER_UPDATED',
        resource: `/api/admin/users/${id}`,
        ipAddress,
        status: 'SUCCESS',
        details: { targetUserId: id, targetEmail: targetUser.email, changes: { name, department, status, roleName } }
      });

      return res.json({ success: true, message: 'User updated successfully.', user: updatedUser });
    } catch (err) {
      console.error('[Update User Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
  }

  static async deleteUser(req, res) {
    const { id } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Prevent self-deletion
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Administrators cannot delete their own account.' });
    }

    try {
      const deleted = await UserModel.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'USER_DELETED',
        resource: `/api/admin/users/${id}`,
        ipAddress,
        status: 'SUCCESS',
        details: { deletedUserId: id, deletedEmail: deleted.email }
      });

      return res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err) {
      console.error('[Delete User Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
  }
}

module.exports = UserController;
