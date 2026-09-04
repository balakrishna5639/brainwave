const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const AuditModel = require('../models/auditModel');
const { generateToken } = require('../utils/jwt');
const env = require('../config/env');

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        await AuditModel.createLog({
          userEmail: email,
          action: 'LOGIN_FAILED',
          resource: '/api/auth/login',
          ipAddress,
          status: 'FAILURE',
          details: { reason: 'User not found' }
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.'
        });
      }

      if (user.status !== 'ACTIVE') {
        await AuditModel.createLog({
          userId: user.id,
          userEmail: user.email,
          action: 'LOGIN_FAILED',
          resource: '/api/auth/login',
          ipAddress,
          status: 'FAILURE',
          details: { reason: 'Account is deactivated' }
        });

        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact your system administrator.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await AuditModel.createLog({
          userId: user.id,
          userEmail: user.email,
          action: 'LOGIN_FAILED',
          resource: '/api/auth/login',
          ipAddress,
          status: 'FAILURE',
          details: { reason: 'Password mismatch' }
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.'
        });
      }

      // Fetch user with consolidated roles and permissions
      const userWithAuth = await UserModel.getUserWithRolesAndPermissions(user.id);
      const token = generateToken(userWithAuth);

      // Audit successful login
      await AuditModel.createLog({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN_SUCCESS',
        resource: '/api/auth/login',
        ipAddress,
        status: 'SUCCESS',
        details: { roles: userWithAuth.roles }
      });

      return res.json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: {
          id: userWithAuth.id,
          name: userWithAuth.name,
          email: userWithAuth.email,
          department: userWithAuth.department,
          status: userWithAuth.status,
          roles: userWithAuth.roles,
          permissions: userWithAuth.permissions
        }
      });
    } catch (error) {
      console.error('[Auth Login Error]', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication.'
      });
    }
  }

  static async getMe(req, res) {
    try {
      const user = await UserModel.getUserWithRolesAndPermissions(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          status: user.status,
          roles: user.roles,
          permissions: user.permissions
        }
      });
    } catch (error) {
      console.error('[Auth getMe Error]', error);
      return res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
    }
  }

  static async logout(req, res) {
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    if (req.user) {
      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'LOGOUT',
        resource: '/api/auth/logout',
        ipAddress,
        status: 'SUCCESS',
        details: { message: 'User logged out' }
      });
    }

    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  }
}

module.exports = AuthController;
