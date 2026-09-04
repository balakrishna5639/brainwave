const { query } = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const res = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await query(
      `SELECT id, name, email, department, status, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async getUserWithRolesAndPermissions(userId) {
    const userRes = await query(
      `SELECT id, name, email, department, status, created_at
       FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) return null;

    // Fetch user's assigned roles
    const rolesRes = await query(
      `SELECT r.id, r.name, r.description
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    const roles = rolesRes.rows.map(r => r.name);
    const roleObjects = rolesRes.rows;

    // Fetch all distinct permissions assigned across all user's roles
    const permsRes = await query(
      `SELECT DISTINCT p.id, p.code, p.name, p.module
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    const permissions = permsRes.rows.map(p => p.code);

    return {
      ...user,
      roles,
      roleObjects,
      permissions
    };
  }

  static async getAllUsers() {
    const res = await query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.department, 
        u.status, 
        u.created_at,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name)) 
          FILTER (WHERE r.id IS NOT NULL), '[]'
        ) as roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.id ASC`
    );
    return res.rows;
  }

  static async createUser({ name, email, passwordHash, department, roleName }) {
    // 1. Insert user
    const userRes = await query(
      `INSERT INTO users (name, email, password_hash, department, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING id, name, email, department, status, created_at`,
      [name, email.toLowerCase(), passwordHash, department]
    );
    const user = userRes.rows[0];

    // 2. Assign role
    if (roleName) {
      const roleRes = await query(`SELECT id FROM roles WHERE name = $1 LIMIT 1`, [roleName]);
      if (roleRes.rows[0]) {
        await query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [user.id, roleRes.rows[0].id]
        );
      }
    }

    return this.getUserWithRolesAndPermissions(user.id);
  }

  static async updateUser(id, { name, department, status, roleName }) {
    await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           department = COALESCE($2, department),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [name, department, status, id]
    );

    if (roleName) {
      const roleRes = await query(`SELECT id FROM roles WHERE name = $1 LIMIT 1`, [roleName]);
      if (roleRes.rows[0]) {
        // Clear existing roles & assign new one
        await query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
        await query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [id, roleRes.rows[0].id]);
      }
    }

    return this.getUserWithRolesAndPermissions(id);
  }

  static async deleteUser(id) {
    const res = await query(`DELETE FROM users WHERE id = $1 RETURNING id, email`, [id]);
    return res.rows[0] || null;
  }
}

module.exports = UserModel;
