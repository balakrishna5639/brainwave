const AuditModel = require('../models/auditModel');

class AuditController {
  static async getLogs(req, res) {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const action = req.query.action || null;
    const status = req.query.status || null;

    try {
      const data = await AuditModel.getLogs({ limit, offset, action, status });
      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[Audit Controller Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
    }
  }
}

module.exports = AuditController;
