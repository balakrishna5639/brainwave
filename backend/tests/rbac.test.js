/**
 * Automated RBAC & Security Test Suite
 * BrainWave Custom Employee Portal
 *
 * Verifies backend route-level security enforcement, role/permission isolation,
 * token validation, and automatic audit logging of unauthorized attempts.
 */

const assert = require('assert');
const http = require('http');
const axios = require('axios');
const { app, startServer } = require('../server');
const { query } = require('../src/config/db');

let server;
let baseUrl;

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Automated RBAC & Security Test Suite');
  console.log('======================================================\n');

  // Start server on a dynamic port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`[Test Runner] Test server running on ${baseUrl}`);

  let passedCount = 0;
  let totalCount = 0;

  async function test(title, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${title}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${title}`);
      console.error(`     Error: ${err.message}`);
      if (err.response) {
        console.error(`     Response Status: ${err.response.status}`);
        console.error(`     Response Data:`, err.response.data);
      }
    }
  }

  // Helper login function
  async function login(email, password = 'password123') {
    const res = await axios.post(`${baseUrl}/api/auth/login`, { email, password });
    return res.data;
  }

  try {
    // -----------------------------------------------------------
    // TEST 1: Unauthenticated request rejection
    // -----------------------------------------------------------
    await test('Unauthenticated request to protected endpoint returns 401 Unauthorized', async () => {
      try {
        await axios.get(`${baseUrl}/api/zoho/services`);
        assert.fail('Expected 401 Unauthorized');
      } catch (err) {
        assert.strictEqual(err.response.status, 401);
        assert.strictEqual(err.response.data.code, 'AUTH_TOKEN_MISSING');
      }
    });

    // -----------------------------------------------------------
    // TEST 2: Tampered / invalid JWT rejection
    // -----------------------------------------------------------
    await test('Invalid or tampered JWT token returns 401 Unauthorized', async () => {
      try {
        await axios.get(`${baseUrl}/api/zoho/services`, {
          headers: { Authorization: 'Bearer invalid.tampered.token' }
        });
        assert.fail('Expected 401 Unauthorized');
      } catch (err) {
        assert.strictEqual(err.response.status, 401);
        assert.strictEqual(err.response.data.code, 'INVALID_TOKEN');
      }
    });

    // -----------------------------------------------------------
    // TEST 3: HR Login and Authorized Access to Zoho People
    // -----------------------------------------------------------
    let hrToken;
    await test('HR User logs in successfully and receives valid JWT with HR role', async () => {
      const auth = await login('hr@brainwave.com');
      assert.strictEqual(auth.success, true);
      assert.ok(auth.token);
      assert.deepStrictEqual(auth.user.roles, ['HR']);
      assert.ok(auth.user.permissions.includes('access:zoho_people'));
      hrToken = auth.token;
    });

    await test('HR User can successfully access authorized Zoho People proxy', async () => {
      const res = await axios.get(`${baseUrl}/api/zoho/people/employees`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.service, 'Zoho People');
      assert.ok(Array.isArray(res.data.records));
    });

    // -----------------------------------------------------------
    // TEST 4: Backend RBAC Enforcement (HR attempting to access CRM)
    // -----------------------------------------------------------
    await test('SECURITY: HR User attempting to access Zoho CRM receives 403 Forbidden', async () => {
      try {
        await axios.get(`${baseUrl}/api/zoho/crm/leads`, {
          headers: { Authorization: `Bearer ${hrToken}` }
        });
        assert.fail('Expected 403 Forbidden for HR accessing CRM');
      } catch (err) {
        assert.strictEqual(err.response.status, 403);
        assert.strictEqual(err.response.data.code, 'FORBIDDEN_PERMISSION');
        assert.ok(err.response.data.message.includes('access:zoho_crm'));
      }
    });

    await test('SECURITY: Unauthorized access attempt by HR is recorded in AuditLogs', async () => {
      const auditRes = await query(
        `SELECT * FROM audit_logs 
         WHERE user_email = 'hr@brainwave.com' AND action = 'UNAUTHORIZED_ACCESS'
         ORDER BY timestamp DESC LIMIT 1`
      );
      assert.ok(auditRes.rows.length > 0, 'Audit log for unauthorized access not found');
      const log = auditRes.rows[0];
      assert.strictEqual(log.status, 'FAILURE');
      assert.strictEqual(log.resource, '/api/zoho/crm/leads');
    });

    // -----------------------------------------------------------
    // TEST 5: Sales User Isolation
    // -----------------------------------------------------------
    let salesToken;
    await test('Sales User logs in and receives Sales permissions', async () => {
      const auth = await login('sales@brainwave.com');
      assert.strictEqual(auth.success, true);
      assert.deepStrictEqual(auth.user.roles, ['Sales']);
      assert.ok(auth.user.permissions.includes('access:zoho_crm'));
      salesToken = auth.token;
    });

    await test('Sales User can access Zoho CRM leads proxy', async () => {
      const res = await axios.get(`${baseUrl}/api/zoho/crm/leads`, {
        headers: { Authorization: `Bearer ${salesToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.service, 'Zoho CRM');
    });

    await test('SECURITY: Sales User attempting to access Zoho Books receives 403 Forbidden', async () => {
      try {
        await axios.get(`${baseUrl}/api/zoho/books/invoices`, {
          headers: { Authorization: `Bearer ${salesToken}` }
        });
        assert.fail('Expected 403 Forbidden for Sales accessing Books');
      } catch (err) {
        assert.strictEqual(err.response.status, 403);
        assert.strictEqual(err.response.data.code, 'FORBIDDEN_PERMISSION');
      }
    });

    // -----------------------------------------------------------
    // TEST 6: Admin Full Access to All 4 Services and Management
    // -----------------------------------------------------------
    let adminToken;
    await test('Admin logs in with full permissions', async () => {
      const auth = await login('admin@brainwave.com');
      assert.strictEqual(auth.success, true);
      assert.deepStrictEqual(auth.user.roles, ['Admin']);
      adminToken = auth.token;
    });

    await test('Admin can access all Zoho applications (People, CRM, Desk, Books)', async () => {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const people = await axios.get(`${baseUrl}/api/zoho/people/employees`, { headers });
      const crm = await axios.get(`${baseUrl}/api/zoho/crm/leads`, { headers });
      const desk = await axios.get(`${baseUrl}/api/zoho/desk/tickets`, { headers });
      const books = await axios.get(`${baseUrl}/api/zoho/books/invoices`, { headers });

      assert.strictEqual(people.status, 200);
      assert.strictEqual(crm.status, 200);
      assert.strictEqual(desk.status, 200);
      assert.strictEqual(books.status, 200);
    });

    await test('Admin can inspect audit logs and manage users', async () => {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const usersRes = await axios.get(`${baseUrl}/api/admin/users`, { headers });
      const auditRes = await axios.get(`${baseUrl}/api/admin/audit-logs`, { headers });

      assert.strictEqual(usersRes.status, 200);
      assert.ok(usersRes.data.users.length >= 5);
      assert.strictEqual(auditRes.status, 200);
      assert.ok(auditRes.data.logs.length > 0);
    });

    // -----------------------------------------------------------
    // TEST 7: Non-Admin blocked from Admin Management endpoints
    // -----------------------------------------------------------
    await test('SECURITY: Non-Admin (HR) cannot access /api/admin/users (403 Forbidden)', async () => {
      try {
        await axios.get(`${baseUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${hrToken}` }
        });
        assert.fail('Expected 403 Forbidden');
      } catch (err) {
        assert.strictEqual(err.response.status, 403);
      }
    });

  } finally {
    server.close();
    console.log('\n======================================================');
    console.log(`📊 Test Results: ${passedCount}/${totalCount} Passed (${Math.round((passedCount/totalCount)*100)}%)`);
    console.log('======================================================\n');
    if (passedCount !== totalCount) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
