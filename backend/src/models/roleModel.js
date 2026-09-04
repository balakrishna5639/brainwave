const { query } = require('../config/db');

class RoleModel {
  static async getAllRolesWithPermissions() {
    const res = await query(
      `SELECT 
        r.id, 
        r.name, 
        r.description, 
        r.created_at,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', p.id, 'code', p.code, 'name', p.name, 'module', p.module)) 
          FILTER (WHERE p.id IS NOT NULL), '[]'
        ) as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       GROUP BY r.id
       ORDER BY r.id ASC`
    );
    return res.rows;
  }

  static async getAllPermissions() {
    const res = await query(`SELECT * FROM permissions ORDER BY module ASC, code ASC`);
    return res.rows;
  }

  static async updateRolePermissions(roleId, permissionCodes = []) {
    // 1. Clear existing permissions for this role
    await query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);

    // 2. Insert new permissions
    for (const code of permissionCodes) {
      const permRes = await query(`SELECT id FROM permissions WHERE code = $1 LIMIT 1`, [code]);
      if (permRes.rows[0]) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [roleId, permRes.rows[0].id]
        );
      }
    }
  }
}

module.exports = RoleModel;
