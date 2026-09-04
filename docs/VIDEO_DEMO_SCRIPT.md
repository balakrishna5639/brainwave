# 3-to-5 Minute Video Recording Script & Walkthrough

**Target Time**: 3:30 – 4:30 minutes  
**Recommended Tools**: Loom, OBS Studio, or Windows Screen Recorder (`Win + Alt + R`)  
**Objective**: Demonstrate how the Custom Employee Portal solves the assignment objective: built-in authentication, database-backed RBAC, backend service account Zoho One integration, and automated audit logging.

---

## ⏱️ Video Breakdown & Speaking Prompts

### [0:00 – 0:45] 1. Project Overview & Architecture Introduction
- **Visual**: Show the Login screen (`http://localhost:5173`) with the test account switcher and clean, minimalist corporate SaaS UI.
- **Narrator**:
  > *"Hello! Today I'm presenting the BrainWave Custom Employee Portal with Role-Based Access Control and Zoho One Integration.
  >
  > The objective was to create a centralized portal where employees log in using corporate credentials—never needing individual Zoho accounts—while strictly restricting access so each employee can only view and interact with the Zoho applications assigned to their role.
  >
  > Our architecture uses PostgreSQL for relational data integrity, an Express.js backend that handles JWT authentication, RBAC authorization middlewares, and a centralized Zoho service account OAuth2 client, paired with a modern React and Vite dashboard."*

---

### [0:45 – 1:45] 2. Role-Based Access Control (RBAC) & User Experience Demo
- **Visual**: 
  1. Click **HR (Zoho People Only)** pill. Log in as `hr@brainwave.com`.
  2. Show that the dashboard renders **only Zoho People**.
  3. Click **Launch Portal** (opens `https://people.zoho.com`).
  4. Click **Inspect API** to show backend-proxied employee records retrieved via the service account.
  5. Scroll down to the **Backend RBAC Security Verification** widget. Click **Test Zoho CRM API**.
  6. Show the real-time **403 Forbidden** banner: *"Forbidden: Insufficient permissions. Required: 'access:zoho_crm'"*.
  7. Log out and click **Sales (Zoho CRM Only)** (`sales@brainwave.com`).
  8. Show that the dashboard updates dynamically: only **Zoho CRM** appears.
- **Narrator**:
  > *"Notice how the frontend conditional rendering matches the business requirements: an HR user only sees Zoho People.
  >
  > But crucially, our security is enforced on the backend: if this HR user attempts to directly call the Zoho CRM endpoint—either via curl, Postman, or our live test widget—the Express RBAC middleware checks their JWT claims, blocks the request with HTTP 403 Forbidden, and records an UNAUTHORIZED_ACCESS audit log.
  >
  > Switching to our Sales user, we see Zoho CRM is permitted, but accessing Zoho Books is immediately blocked."*

---

### [1:45 – 2:45] 3. Backend Architecture & Zoho OAuth2 Service Account
- **Visual**: Switch to VS Code / IDE. Show `backend/src/services/zohoService.js` and `backend/src/middlewares/rbac.js`.
- **Narrator**:
  > *"Let's examine how this works under the hood.
  >
  > In `zohoService.js`, we implement a centralized backend service account architecture. Employees never receive or enter Zoho credentials. 
  >
  > The backend manages the OAuth2 refresh token lifecycle. When a token is needed, `getAccessToken()` checks our in-memory cache and its `expires_in` TTL. Notice that we calculate expiry dynamically with a 5-minute safety buffer so tokens refresh proactively before expiry.
  >
  > All Zoho product launch URLs and REST API endpoints are decoupled and environment-configurable for international data centers. Furthermore, the system includes a dual-mode integration: live OAuth communication when credentials are provided in `.env`, and transparent simulation when offline for testing."*

---

### [2:45 – 3:45] 4. Admin Management, Database Schema & Audit Logging
- **Visual**: 
  1. Switch back to browser. Log in as `admin@brainwave.com`.
  2. Show that Admin has access to all 4 Zoho applications (People, CRM, Desk, Books).
  3. Click **Admin Management** in the navbar.
  4. Show **User Management** tab:
     - Point out the current admin user row labeled with a clear **(You)** badge.
     - Hover over the disabled delete button: explain that self-deletion is blocked to prevent accidental administrative lockout.
     - Show the deletion confirmation modal and instant feedback alerts when managing team accounts.
  5. Click **Roles & Permissions Matrix** tab (show the 6-table relational RBAC model).
  6. Click **Audit Logs** tab (point out `LOGIN_SUCCESS`, `ZOHO_ACCESS`, and the `UNAUTHORIZED_ACCESS` entry logged during the HR CRM attempt).
  7. Click **Zoho OAuth Diagnostics** tab (show token health and TTL).
- **Narrator**:
  > *"Logging in as Admin reveals full access across all 4 Zoho products plus the Admin Control Center.
  >
  > Here, administrators can create new users, reassign RBAC roles, and inspect our permission matrix. Notice the safety controls: the logged-in administrator is clearly marked with a 'You' badge and self-deletion is prevented so the portal can never be left without an admin. Deletion of any other account requires explicit modal confirmation and cascades safely across relational junction tables.
  >
  > In the Audit Logs tab, every critical security event is tracked in PostgreSQL—including successful logins, user modifications, Zoho proxy requests, and the exact unauthorized attempt we tested moments ago with timestamp, resource, and IP address.
  >
  > Sessions are protected with a 30-minute JWT lifespan, automatically clearing client state upon expiration."*

---

### [3:45 – 4:30] 5. Automated Security Test Suite, Live Cloud Deployment & Conclusion
- **Visual**: 
  1. Open terminal and run:
     ```bash
     npm run test:audit
     ```
  2. Show all 19 comprehensive test cases passing with 100% green checks (auth validation, cross-role 403 barriers, session expiry, and zero secrets leakage).
  3. Show the live cloud deployment URLs (Backend on Render with managed PostgreSQL, Frontend on Vercel).
- **Narrator**:
  > *"Finally, we validate our implementation with our comprehensive automated test suite. Running `npm run test:audit` verifies all 19 pre-deployment assertions—from input validation and expired token rejections to strict cross-role 403 barriers and zero credentials leakage. All 19 tests pass with 100% success.
  >
  > The portal is fully deployed live in production: our Node.js backend and managed PostgreSQL database are hosted on Render, and our React frontend is hosted on Vercel with real-time Zoho OAuth2 integration.
  >
  > The repository includes complete documentation, database migrations, and a comprehensive setup guide.
  >
  > Thank you for your time!"*

---

## 🎯 Scoring Checklist Covered
- [x] **RBAC Implementation (30%)**: 6-table relational schema, route-level JWT validation, 403 enforcement on unauthorized services.
- [x] **Zoho API Integration (25%)**: Single service account, dynamic token refresh buffer, employee credential isolation.
- [x] **Code Quality & Architecture (20%)**: Centralized service layer, clean controller/route separation, comprehensive audit logging.
- [x] **UI/UX & Frontend (15%)**: Responsive dashboard, 1-click evaluation switcher, conditional rendering, Admin panel.
- [x] **Submission (10%)**: Clear README, setup guide, and presentation script.
