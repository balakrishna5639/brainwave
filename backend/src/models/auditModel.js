const { query } = require('../config/db');

class AuditModel {
  static async createLog({
    userId = null,
    userEmail = 'anonymous',
    action,
    resource = null,
    ipAddress = '127.0.0.1',
    status = 'SUCCESS',
    details = {}
  }) {
    const res = await query(
      `INSERT INTO audit_logs (user_id, user_email, action, resource, ip_address, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, userEmail, action, resource, ipAddress, status, JSON.stringify(details)]
    );
    return res.rows[0];
  }

  static async getLogs({ limit = 50, offset = 0, action = null, status = null } = {}) {
    let whereClauses = [];
    let params = [];

    if (action) {
      params.push(action);
      whereClauses.push(`action = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs ${whereSql}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const logsRes = await query(
      `SELECT id, user_id, user_email, action, resource, ip_address, status, details, timestamp
       FROM audit_logs
       ${whereSql}
       ORDER BY timestamp DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    return {
      total,
      limit,
      offset,
      logs: logsRes.rows
    };
  }
}

module.exports = AuditModel;
