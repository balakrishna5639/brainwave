const bcrypt = require('bcryptjs');
const { initDB, query } = require('../config/db');

async function runSeed() {
  try {
    console.log('[Seed] Starting database seeding...');
    await initDB();

    // 1. Seed Roles
    const roles = [
      { name: 'Admin', description: 'Full system administration, user management, and access to all Zoho services' },
      { name: 'HR', description: 'Human Resources team with access to Zoho People' },
      { name: 'Sales', description: 'Sales executives with access to Zoho CRM' },
      { name: 'Support', description: 'Customer Support team with access to Zoho Desk' },
      { name: 'Finance', description: 'Finance and Accounting team with access to Zoho Books' }
    ];

    const roleMap = {};
    for (const r of roles) {
      const res = await query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [r.name, r.description]
      );
      roleMap[r.name] = res.rows[0].id;
    }
    console.log('[Seed] Roles seeded:', Object.keys(roleMap));

    // 2. Seed Permissions
    const permissions = [
      { code: 'access:zoho_people', name: 'Access Zoho People', module: 'Zoho People' },
      { code: 'access:zoho_crm', name: 'Access Zoho CRM', module: 'Zoho CRM' },
      { code: 'access:zoho_desk', name: 'Access Zoho Desk', module: 'Zoho Desk' },
      { code: 'access:zoho_books', name: 'Access Zoho Books', module: 'Zoho Books' },
      { code: 'manage:users', name: 'Manage Portal Users', module: 'Administration' },
      { code: 'manage:roles', name: 'Manage Roles and Permissions', module: 'Administration' },
      { code: 'view:audit_logs', name: 'View Audit Logs', module: 'Compliance' }
    ];

    const permissionMap = {};
    for (const p of permissions) {
      const res = await query(
        `INSERT INTO permissions (code, name, module)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, module = EXCLUDED.module
         RETURNING id, code`,
        [p.code, p.name, p.module]
      );
      permissionMap[p.code] = res.rows[0].id;
    }
    console.log('[Seed] Permissions seeded:', Object.keys(permissionMap));

    // 3. Map Role Permissions
    const rolePermissionMappings = {
      Admin: [
        'access:zoho_people',
        'access:zoho_crm',
        'access:zoho_desk',
        'access:zoho_books',
        'manage:users',
        'manage:roles',
        'view:audit_logs'
      ],
      HR: ['access:zoho_people'],
      Sales: ['access:zoho_crm'],
      Support: ['access:zoho_desk'],
      Finance: ['access:zoho_books']
    };

    for (const [roleName, permCodes] of Object.entries(rolePermissionMappings)) {
      const roleId = roleMap[roleName];
      for (const code of permCodes) {
        const permId = permissionMap[code];
        await query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [roleId, permId]
        );
      }
    }
    console.log('[Seed] Role-to-Permissions mapped successfully');

    // 4. Seed Demo Users (password: "password123")
    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const demoUsers = [
      { name: 'Eleanor Vance (Admin)', email: 'admin@brainwave.com', department: 'Executive / IT', role: 'Admin' },
      { name: 'Hannah Reed (HR Lead)', email: 'hr@brainwave.com', department: 'Human Resources', role: 'HR' },
      { name: 'Samuel Miller (Sales Rep)', email: 'sales@brainwave.com', department: 'Enterprise Sales', role: 'Sales' },
      { name: 'Sarah Connor (Support Agent)', email: 'support@brainwave.com', department: 'Customer Support', role: 'Support' },
      { name: 'Felix Patel (Financial Controller)', email: 'finance@brainwave.com', department: 'Finance & Accounting', role: 'Finance' }
    ];

    for (const u of demoUsers) {
      const userRes = await query(
        `INSERT INTO users (name, email, password_hash, department, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, department = EXCLUDED.department
         RETURNING id, email`,
        [u.name, u.email, passwordHash, u.department]
      );
      const userId = userRes.rows[0].id;
      const roleId = roleMap[u.role];

      await query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, roleId]
      );
    }
    console.log('[Seed] Demo users seeded successfully with password "password123"');

    // 5. Initial System Seed Audit Log
    await query(
      `INSERT INTO audit_logs (user_email, action, resource, ip_address, status, details)
       VALUES ('system', 'SYSTEM_SEED', 'database', '127.0.0.1', 'SUCCESS', $1)`,
      [JSON.stringify({ message: 'Database initialized and seeded with RBAC data' })]
    );

    console.log('[Seed] Seeding completed successfully!');
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeed().then(() => process.exit(0));
}

module.exports = runSeed;
