const { Pool } = require('pg');
const env = require('./env');
const path = require('path');
const fs = require('fs');

let pool = null;
let pgliteInstance = null;
let activeEngine = 'unknown';

async function initDB() {
  if (activeEngine !== 'unknown') return;

  // Attempt 1: Connect to external PostgreSQL server using pg.Pool
  try {
    const testPool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 2000,
    });
    const res = await testPool.query('SELECT 1 AS connected');
    if (res.rows && res.rows[0].connected === 1) {
      pool = testPool;
      activeEngine = 'PostgreSQL (pg pool)';
      console.log(`[DB] Connected successfully to PostgreSQL via pg pool`);
      return;
    }
  } catch (err) {
    console.warn(`[DB] External PostgreSQL connection notice (${err.message}).`);
    console.log(`[DB] Initializing embedded PostgreSQL 16 (PGlite) for zero-setup local execution...`);
  }

  // Attempt 2: Fallback to embedded PostgreSQL 16 (PGlite)
  try {
    const { PGlite } = require('@electric-sql/pglite');
    const dataDir = path.resolve(__dirname, '../../data/pglite_db');
    if (!fs.existsSync(path.dirname(dataDir))) {
      fs.mkdirSync(path.dirname(dataDir), { recursive: true });
    }
    // Clean stale lockfiles from unclean shutdown
    const pidFile = path.join(dataDir, 'postmaster.pid');
    const lockFile = path.join(dataDir, '.s.PGSQL.5432.lock.out');
    if (fs.existsSync(pidFile)) {
      try { fs.unlinkSync(pidFile); } catch (e) {}
    }
    if (fs.existsSync(lockFile)) {
      try { fs.unlinkSync(lockFile); } catch (e) {}
    }
    pgliteInstance = new PGlite(dataDir);
    await pgliteInstance.waitReady;
    activeEngine = 'PostgreSQL 16 (PGlite embedded)';
    console.log(`[DB] Connected successfully to ${activeEngine}`);
  } catch (fallbackErr) {
    console.error(`[DB] Fatal: Could not initialize database engine`, fallbackErr);
    throw fallbackErr;
  }
}

/**
 * Universal query runner for PostgreSQL
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<{ rows: Array, rowCount: number }>}
 */
async function query(text, params = []) {
  if (activeEngine === 'unknown') {
    await initDB();
  }

  if (pool) {
    return pool.query(text, params);
  }

  if (pgliteInstance) {
    const result = await pgliteInstance.query(text, params);
    return {
      rows: result.rows || [],
      rowCount: result.affectedRows !== undefined ? result.affectedRows : (result.rows ? result.rows.length : 0),
    };
  }

  throw new Error('Database is not initialized.');
}

/**
 * Execute raw multi-statement SQL (e.g. migrations)
 * @param {string} sqlText
 */
async function exec(sqlText) {
  if (activeEngine === 'unknown') {
    await initDB();
  }

  if (pool) {
    return pool.query(sqlText);
  }

  if (pgliteInstance) {
    return pgliteInstance.exec(sqlText);
  }

  throw new Error('Database is not initialized.');
}

function getActiveEngine() {
  return activeEngine;
}

module.exports = {
  initDB,
  query,
  exec,
  getActiveEngine,
};
