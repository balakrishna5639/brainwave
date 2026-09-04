const fs = require('fs');
const path = require('path');
const { initDB, query, exec, getActiveEngine } = require('../config/db');

async function runMigrations() {
  try {
    console.log('[Migration] Starting database migration...');
    await initDB();
    console.log(`[Migration] Active Database Engine: ${getActiveEngine()}`);

    const migrationFile = path.resolve(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log(`[Migration] Applying 001_initial_schema.sql...`);
    await exec(sql);

    console.log('[Migration] Migration completed successfully! Tables created:');
    console.log(' - users');
    console.log(' - roles');
    console.log(' - permissions');
    console.log(' - user_roles');
    console.log(' - role_permissions');
    console.log(' - audit_logs');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}

module.exports = runMigrations;
