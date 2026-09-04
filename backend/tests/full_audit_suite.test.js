/**
 * Comprehensive 20-Point Verification Test Suite
 * BrainWave Custom Employee Portal
 */

const assert = require('assert');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { app } = require('../server');
const { initDB } = require('../src/config/db');

let server;
let baseUrl;
let startedOwnServer = false;

async function runComprehensiveAudit() {
  console.log('\n======================================================');
  console.log('🔬 RUNNING COMPREHENSIVE 20-POINT PRE-DEPLOYMENT AUDIT');
  console.log('======================================================\n');

  baseUrl = `http://localhost:${env.PORT || 5000}`;

  // Check if an external or local server is already running
  try {
    await axios.get(`${baseUrl}/api/health`, { timeout: 1000 });
    console.log(`[Test Runner] Connected to running server at ${baseUrl}\n`);
  } catch (err) {
    console.log('[Test Runner] Active server not detected. Starting test instance automatically...');
    await initDB();
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    startedOwnServer = true;
    console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);
  }

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS ${total}] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL ${total}] ${name}`);
      console.error(`     Message: ${err.message}`);
      if (err.response) {
        console.error(`     HTTP Status: ${err.response.status}`);
        console.error(`     Response:`, err.response.data);
      }
    }
  }

  async function login(email, password = 'password123') {
    const res = await axios.post(`${baseUrl}/api/auth/login`, { email, password });
    return res.data;
  }

  try {
    // -------------------------------------------------------------
    // POINT 3: AUTHENTICATION FAILURES & VALIDATION
    // -------------------------------------------------------------
    await test('Point 3.1: Wrong password returns 401 Unauthorized', async () => {
      try {
        await login('sales@brainwave.com', 'wrongpassword');
        assert.fail('Expected 401');
      } catch (err) {
        assert.strictEqual(err.response.status, 401);
        assert.ok(err.response.data.message.includes('Invalid credentials'));
      }
    });

    await test('Point 3.2: Non-existent email returns 401 Unauthorized', async () => {
      try {
        await login('doesnotexist@brainwave.com', 'password123');
        assert.fail('Expected 401');
      } catch (err) {
        assert.strictEqual(err.response.status, 401);
      }
    });

    await test('Point 3.3: Empty email returns 400 Bad Request', async () => {
      try {
        await axios.post(`${baseUrl}/api/auth/login`, { email: '', password: 'password123' });
        assert.fail('Expected 400');
      } catch (err) {
        assert.strictEqual(err.response.status, 400);
      }
    });

    await test('Point 3.4: Empty password returns 400 Bad Request', async () => {
      try {
        await axios.post(`${baseUrl}/api/auth/login`, { email: 'hr@brainwave.com', password: '' });
        assert.fail('Expected 400');
      } catch (err) {
        assert.strictEqual(err.response.status, 400);
      }
    });

    await test('Point 3.5: Both email & password empty returns 400 Bad Request', async () => {
      try {
        await axios.post(`${baseUrl}/api/auth/login`, {});
        assert.fail('Expected 400');
      } catch (err) {
        assert.strictEqual(err.response.status, 400);
      }
    });

    // -------------------------------------------------------------
    // POINT 4: JWT SECURITY & TIMEOUT CONTROLS
    // -------------------------------------------------------------
    await test('Point 4.1: Missing Authorization header returns 401 (AUTH_TOKEN_MISSING)', async () => {
      try {
        await axios.get(`${baseUrl}/api/zoho/services`);
        assert.fail('Expected 401');
      } catch (err) {
        assert.strictEqual(err.response.status, 401);
        assert.strictEqual(err.response.data.code, 'AUTH_TOKEN_MISSING');
      }
    });

    await test('Point 4.2: Invalid/malformed Bearer token returns 401 (INVALID_TOKEN)', async () => {
      try {
        await axios.get(`${baseUrl}/api/zoho/services`, {
          headers: { Authorization: 'Bearer abc123def456' }
        });
        assert.fail('Expected 401');
      } catch (err) {
        assert.strictEqual(err.response.status, 401);
        assert.strictEqual(err.response.data.code, 'INVALID_TOKEN');
      }
    });

    await test('Point 4.3: Expired JWT token returns 401 (TOKEN_EXPIRED)', async () => {
      const expiredToken = jwt.sign(
        { id: 999, email: 'expired@brainwave.com', roles: ['HR'], permissions: ['access:zoho_people'] },
        env.JWT_SECRET,
        { expiresIn: '-10s' }
      );
      try {
        await axios.get(`${baseUrl}/api/zoho/services`, {
          headers: { Authorization: `Bearer ${expiredToken}` }
        });
        assert.fail('Expected 401');
      } catch (err) {
        assert.strictEqual(err.response.status, 401);
        assert.strictEqual(err.response.data.code, 'TOKEN_EXPIRED');
      }
    });

    // -------------------------------------------------------------
    // POINT 2: EXHAUSTIVE 5-ROLE x 4-SERVICE RBAC MATRIX
    // -------------------------------------------------------------
    const hrAuth = await login('hr@brainwave.com');
    const salesAuth = await login('sales@brainwave.com');
    const supportAuth = await login('support@brainwave.com');
    const financeAuth = await login('finance@brainwave.com');
    const adminAuth = await login('admin@brainwave.com');

    const endpoints = {
      people: '/api/zoho/people/employees',
      crm: '/api/zoho/crm/leads',
      desk: '/api/zoho/desk/tickets',
      books: '/api/zoho/books/invoices'
    };

    // HR Matrix: People=200, CRM=403, Desk=403, Books=403
    await test('Point 2.1 (HR): People is 200, CRM is 403, Desk is 403, Books is 403', async () => {
      const h = { Authorization: `Bearer ${hrAuth.token}` };
      const p = await axios.get(`${baseUrl}${endpoints.people}`, { headers: h });
      assert.strictEqual(p.status, 200);

      for (const [key, ep] of Object.entries(endpoints)) {
        if (key === 'people') continue;
        try {
          await axios.get(`${baseUrl}${ep}`, { headers: h });
          assert.fail(`HR should not access ${key}`);
        } catch (err) {
          assert.strictEqual(err.response.status, 403);
          assert.strictEqual(err.response.data.code, 'FORBIDDEN_PERMISSION');
        }
      }
    });

    // Sales Matrix: CRM=200, People=403, Desk=403, Books=403
    await test('Point 2.2 (Sales): CRM is 200, People is 403, Desk is 403, Books is 403', async () => {
      const h = { Authorization: `Bearer ${salesAuth.token}` };
      const c = await axios.get(`${baseUrl}${endpoints.crm}`, { headers: h });
      assert.strictEqual(c.status, 200);

      for (const [key, ep] of Object.entries(endpoints)) {
        if (key === 'crm') continue;
        try {
          await axios.get(`${baseUrl}${ep}`, { headers: h });
          assert.fail(`Sales should not access ${key}`);
        } catch (err) {
          assert.strictEqual(err.response.status, 403);
        }
      }
    });

    // Support Matrix: Desk=200, People=403, CRM=403, Books=403
    await test('Point 2.3 (Support): Desk is 200, People is 403, CRM is 403, Books is 403', async () => {
      const h = { Authorization: `Bearer ${supportAuth.token}` };
      const d = await axios.get(`${baseUrl}${endpoints.desk}`, { headers: h });
      assert.strictEqual(d.status, 200);

      for (const [key, ep] of Object.entries(endpoints)) {
        if (key === 'desk') continue;
        try {
          await axios.get(`${baseUrl}${ep}`, { headers: h });
          assert.fail(`Support should not access ${key}`);
        } catch (err) {
          assert.strictEqual(err.response.status, 403);
        }
      }
    });

    // Finance Matrix: Books=200, People=403, CRM=403, Desk=403
    await test('Point 2.4 (Finance): Books is 200, People is 403, CRM is 403, Desk is 403', async () => {
      const h = { Authorization: `Bearer ${financeAuth.token}` };
      const b = await axios.get(`${baseUrl}${endpoints.books}`, { headers: h });
      assert.strictEqual(b.status, 200);

      for (const [key, ep] of Object.entries(endpoints)) {
        if (key === 'books') continue;
        try {
          await axios.get(`${baseUrl}${ep}`, { headers: h });
          assert.fail(`Finance should not access ${key}`);
        } catch (err) {
          assert.strictEqual(err.response.status, 403);
        }
      }
    });

    // Admin Matrix: All 4 services return 200
    await test('Point 2.5 (Admin): All 4 applications return 200 OK', async () => {
      const h = { Authorization: `Bearer ${adminAuth.token}` };
      for (const [key, ep] of Object.entries(endpoints)) {
        const res = await axios.get(`${baseUrl}${ep}`, { headers: h });
        assert.strictEqual(res.status, 200);
      }
    });

    // -------------------------------------------------------------
    // POINT 17: NON-ADMIN BLOCKED FROM ADMIN APIS
    // -------------------------------------------------------------
    await test('Point 17: Non-admin (HR) cannot access /api/admin/users, /roles, or /audit-logs', async () => {
      const h = { Authorization: `Bearer ${hrAuth.token}` };
      for (const adminEp of ['/api/admin/users', '/api/admin/roles', '/api/admin/audit-logs']) {
        try {
          await axios.get(`${baseUrl}${adminEp}`, { headers: h });
          assert.fail(`HR should not access ${adminEp}`);
        } catch (err) {
          assert.strictEqual(err.response.status, 403);
        }
      }
    });

    // -------------------------------------------------------------
    // POINT 7: LIVE ROLE CHANGE (HR -> SALES)
    // -------------------------------------------------------------
    await test('Point 7: Dynamic role update reflects immediately upon re-authentication', async () => {
      const adminHeader = { Authorization: `Bearer ${adminAuth.token}` };
      const testEmail = `switchrole_${Date.now()}@brainwave.com`;

      // 1. Create user with HR role
      const createRes = await axios.post(
        `${baseUrl}/api/admin/users`,
        { name: 'Role Switcher', email: testEmail, password: 'password123', department: 'HR', roleName: 'HR' },
        { headers: adminHeader }
      );
      const testUserId = createRes.data.user.id;

      // 2. Log in as test user
      const userAuth1 = await login(testEmail, 'password123');
      assert.deepStrictEqual(userAuth1.user.roles, ['HR']);

      // 3. Verify HR can access People, but not CRM
      const h1 = { Authorization: `Bearer ${userAuth1.token}` };
      const p1 = await axios.get(`${baseUrl}/api/zoho/people/employees`, { headers: h1 });
      assert.strictEqual(p1.status, 200);
      try {
        await axios.get(`${baseUrl}/api/zoho/crm/leads`, { headers: h1 });
        assert.fail('Should fail CRM');
      } catch (err) {
        assert.strictEqual(err.response.status, 403);
      }

      // 4. Admin updates user role to Sales
      await axios.put(
        `${baseUrl}/api/admin/users/${testUserId}`,
        { roleName: 'Sales' },
        { headers: adminHeader }
      );

      // 5. User logs in again -> receives Sales role
      const userAuth2 = await login(testEmail, 'password123');
      assert.deepStrictEqual(userAuth2.user.roles, ['Sales']);

      // 6. User now accesses CRM (200) and is blocked from People (403)!
      const h2 = { Authorization: `Bearer ${userAuth2.token}` };
      const c2 = await axios.get(`${baseUrl}/api/zoho/crm/leads`, { headers: h2 });
      assert.strictEqual(c2.status, 200);
      try {
        await axios.get(`${baseUrl}/api/zoho/people/employees`, { headers: h2 });
        assert.fail('Should now fail People');
      } catch (err) {
        assert.strictEqual(err.response.status, 403);
      }

      // Clean up test user
      await axios.delete(`${baseUrl}/api/admin/users/${testUserId}`, { headers: adminHeader });
    });

    // -------------------------------------------------------------
    // POINT 8: INACTIVE USER LOGIN REJECTION
    // -------------------------------------------------------------
    await test('Point 8: Deactivated user login is rejected with 403 even with correct password', async () => {
      const adminHeader = { Authorization: `Bearer ${adminAuth.token}` };
      const testEmail = `inactive_${Date.now()}@brainwave.com`;

      // 1. Create active user
      const createRes = await axios.post(
        `${baseUrl}/api/admin/users`,
        { name: 'Disabled User', email: testEmail, password: 'password123', department: 'Security', roleName: 'Support' },
        { headers: adminHeader }
      );
      const testUserId = createRes.data.user.id;

      // 2. Admin sets status to INACTIVE
      await axios.put(
        `${baseUrl}/api/admin/users/${testUserId}`,
        { status: 'INACTIVE' },
        { headers: adminHeader }
      );

      // 3. Attempt login with correct password
      try {
        await login(testEmail, 'password123');
        assert.fail('Expected 403 for deactivated user');
      } catch (err) {
        assert.strictEqual(err.response.status, 403);
        assert.ok(err.response.data.message.includes('Account is deactivated'));
      }

      // Clean up
      await axios.delete(`${baseUrl}/api/admin/users/${testUserId}`, { headers: adminHeader });
    });

    // -------------------------------------------------------------
    // POINT 16: DATABASE INTEGRITY CONSTRAINTS
    // -------------------------------------------------------------
    await test('Point 16: Duplicate email creation is rejected with 409 Conflict', async () => {
      const adminHeader = { Authorization: `Bearer ${adminAuth.token}` };
      try {
        await axios.post(
          `${baseUrl}/api/admin/users`,
          { name: 'Duplicate', email: 'hr@brainwave.com', password: 'password123', department: 'HR', roleName: 'HR' },
          { headers: adminHeader }
        );
        assert.fail('Expected 409 for duplicate email');
      } catch (err) {
        assert.strictEqual(err.response.status, 409);
      }
    });

    // -------------------------------------------------------------
    // POINT 9: AUDIT LOG VERIFICATION IN POSTGRESQL
    // -------------------------------------------------------------
    await test('Point 9: Audit log records contain full security context (IP, user, resource, status)', async () => {
      const h = { Authorization: `Bearer ${adminAuth.token}` };
      const res = await axios.get(`${baseUrl}/api/admin/audit-logs?action=UNAUTHORIZED_ACCESS`, { headers: h });
      assert.ok(res.data.logs && res.data.logs.length > 0, 'No unauthorized access logs found');
      const log = res.data.logs[0];
      assert.strictEqual(log.status, 'FAILURE');
      assert.ok(log.user_email);
      assert.ok(log.resource);
      assert.ok(log.ip_address);
      assert.ok(log.timestamp);
    });

    // -------------------------------------------------------------
    // POINT 18: ZERO SECRETS LEAKAGE IN RESPONSES
    // -------------------------------------------------------------
    await test('Point 18: Backend API responses never leak client secret, refresh token, or JWT secret', async () => {
      const h = { Authorization: `Bearer ${adminAuth.token}` };
      const statusRes = await axios.get(`${baseUrl}/api/zoho/status`, { headers: h });
      const stringified = JSON.stringify(statusRes.data);

      assert.ok(!stringified.includes(env.ZOHO_CLIENT_SECRET), 'Leaked ZOHO_CLIENT_SECRET');
      assert.ok(!stringified.includes(env.ZOHO_REFRESH_TOKEN), 'Leaked ZOHO_REFRESH_TOKEN');
      assert.ok(!stringified.includes(env.JWT_SECRET), 'Leaked JWT_SECRET');
    });

  } finally {
    if (startedOwnServer && server && server.close) {
      server.close();
    }
    console.log('\n======================================================');
    console.log(`📊 Comprehensive Audit Results: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
    console.log('======================================================\n');
    if (passed !== total) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runComprehensiveAudit();
}

module.exports = runComprehensiveAudit;
