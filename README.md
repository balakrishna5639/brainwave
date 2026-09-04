# BrainWave Custom Employee Portal with Zoho One Integration

[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?logo=postgresql&logoColor=white)](#database--schema-setup)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?logo=nodedotjs&logoColor=white)](#backend-architecture)
[![React](https://img.shields.io/badge/Frontend-React%20%2F%20Vite-61DAFB?logo=react&logoColor=black)](#frontend-dashboard)
[![RBAC Security](https://img.shields.io/badge/Security-Enforced%20RBAC%20%2B%20Audit-6366F1)](#rbac-matrix--authorization-engine)
[![Zoho One](https://img.shields.io/badge/Integration-Zoho%20One%20Service%20Account-E42528)](#zoho-one-api-integration-layer)

A secure, enterprise-grade custom employee portal featuring built-in authentication, database-driven **Role-Based Access Control (RBAC)**, and **Zoho One API integration** using a single backend service account. Employees log into the portal with corporate credentials and access only the Zoho applications permitted by their role, **never needing individual Zoho accounts or personal credentials**.

---

## 🏛️ System Architecture

```
                         ┌────────────────────────┐
                         │ React / Vite Frontend  │
                         │ (Dashboard & Admin UI) │
                         └───────────┬────────────┘
                                     │
                                 JWT / API
                                     │
                                     ▼
                    ┌──────────────────────────────────┐
                    │      Express.js API Gateway      │
                    │                                  │
                    │  • Auth & Session (30m JWT)      │
                    │  • verifyRole / verifyPermission │
                    │  • Automated Audit Logging       │
                    └────────┬─────────────────┬───────┘
                             │                 │
                      PostgreSQL 16            │
                      Relational DB            │
                      (6 Tables)               ▼
                             │       ┌──────────────────┐
                             │       │   zohoService    │
                             │       │  OAuth2 Refresh  │
                             │       │   Token Cache    │
                             │       │  Dynamic 5m TTL  │
                             │       └────────┬─────────┘
                             │                │
                             ▼                ▼
                        Audit Logs       Zoho One APIs
                   (Security & Access)  (People/CRM/Desk/Books)
```

---

## 🔑 Core Features & Architectural Highlights

1. **Relational RBAC Engine (PostgreSQL)**:
   - Built on a strict 6-table relational schema (`users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `audit_logs`) with foreign keys, composite primary keys, and cascading deletes.
   - Distinct SQL migrations and idempotent database seed scripts (`npm run migrate`, `npm run seed`).
2. **Backend-First Authorization Enforcement**:
   - Security is enforced on backend routes before service execution: an unauthorized user receives **HTTP 403 Forbidden** and an `UNAUTHORIZED_ACCESS` audit record is stored.
   - Frontend UI dynamically renders permitted service cards, but frontend visibility is for UX while backend authorization is for security.
3. **Single Backend Service Account for Zoho One**:
   - Zero exposure of Zoho credentials to client applications or employees.
   - Centralized OAuth2 token refresh pipeline querying Zoho accounts.
   - **Dynamic Token TTL**: Computes expiration using Zoho's returned `expires_in` seconds and refreshes proactively with a 5-minute safety buffer.
   - Decoupled portal launch URLs (for employee web redirection) and REST API endpoints (for backend data proxying).
4. **Honest Dual-Mode Zoho Integration**:
   - **Live Mode**: When `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` are set, communicates with live Zoho REST endpoints.
   - **Simulation / Demo Mode**: When credentials are unset, returns structured sample payloads with a transparent dashboard status pill (`🟡 DEMO / SIMULATION`).
5. **Comprehensive Compliance Audit Logging**:
   - Records `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `ROLE_ASSIGNED`, `ROLE_CHANGED`, `PERMISSION_CHANGED`, `ZOHO_ACCESS`, and `UNAUTHORIZED_ACCESS`.
6. **Session Timeout & Security Controls**:
   - 30-minute signed JWT expiration.
   - Axios response interceptor detects session expiry (401 `TOKEN_EXPIRED`), wipes state, and redirects to `/login?session_expired=true`.
7. **Automated Security Test Suite**:
   - 13 automated test assertions validating unauthenticated rejection, tampered token rejection, cross-role 403 barriers, and audit log generation.

---

## 👥 Pre-Configured Demo Accounts

For rapid evaluation, the login page features **1-Click Demo Evaluation Pills** that submit authentic credentials through the standard `POST /api/auth/login` endpoint (bcrypt verification + JWT generation):

| Role | Email | Password | Assigned Zoho Application | Portal Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@brainwave.com` | `password123` | **All 4 Applications** (People, CRM, Desk, Books) | Full Access, User/Role Management, Audit Logs |
| **HR** | `hr@brainwave.com` | `password123` | **Zoho People** | `access:zoho_people` |
| **Sales** | `sales@brainwave.com` | `password123` | **Zoho CRM** | `access:zoho_crm` |
| **Support** | `support@brainwave.com` | `password123` | **Zoho Desk** | `access:zoho_desk` |
| **Finance** | `finance@brainwave.com` | `password123` | **Zoho Books** | `access:zoho_books` |

---

## 🛡️ RBAC Matrix & API Endpoints

| Resource / Endpoint | HTTP | Required Permission | Admin | HR | Sales | Support | Finance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/api/auth/login` | POST | *Public* | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/me` | GET | *Authenticated* | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/zoho/services` | GET | *Authenticated* | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/zoho/people/employees` | GET | `access:zoho_people` | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `/api/zoho/crm/leads` | GET | `access:zoho_crm` | ✅ | ❌ (403) | ✅ | ❌ (403) | ❌ (403) |
| `/api/zoho/desk/tickets` | GET | `access:zoho_desk` | ✅ | ❌ (403) | ❌ (403) | ✅ | ❌ (403) |
| `/api/zoho/books/invoices` | GET | `access:zoho_books` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| `/api/admin/users` | GET/POST | `manage:users` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) |
| `/api/admin/roles` | GET/PUT | `manage:roles` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) |
| `/api/admin/audit-logs` | GET | `view:audit_logs` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) |

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22)
- **Docker Desktop** (optional for containerized PostgreSQL, embedded Postgres engine included)

### 2. Start PostgreSQL Database

Using Docker Compose:
```bash
docker compose up -d
```
*Note: If Docker is not running, the application includes an automatic embedded PostgreSQL 16 engine fallback (`@electric-sql/pglite`) for seamless zero-setup evaluation.*

### 3. Run Database Migrations & Seeds

From repository root:
```bash
# Apply relational database schema (6 tables)
npm run migrate

# Seed roles, permissions, and 5 demo accounts
npm run seed
```

### 4. Configure Environment Variables (Optional for Live Zoho)

Copy `.env.example` to `.env` in `backend/`:
```bash
cp backend/.env.example backend/.env
```
*(Leave Zoho credentials blank to run in Demo/Simulation mode, or follow [docs/ZOHO_SETUP_GUIDE.md](docs/ZOHO_SETUP_GUIDE.md) to add live Zoho API credentials).*

### 5. Launch Backend and Frontend Servers

**Terminal 1 — Backend (Port 5000):**
```bash
npm run backend
```

**Terminal 2 — Frontend (Port 5173):**
```bash
npm run frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Live Cloud Deployment

The application is deployed live in production:

- **Frontend (Vercel)**: Connects dynamically via `VITE_API_URL` with SPA client-side rewrites enabled.
- **Backend API (Render)**: [https://brainwave-backend-i5io.onrender.com](https://brainwave-backend-i5io.onrender.com)
- **Live Health & System Status**: [https://brainwave-backend-i5io.onrender.com/api/health](https://brainwave-backend-i5io.onrender.com/api/health)
- **Production Database**: Render Managed PostgreSQL 16 instance.

---

## 🧪 Running Automated Security & RBAC Tests

The repository includes both a fast RBAC security test suite and a comprehensive 20-point pre-deployment audit suite:

### 1. Comprehensive 20-Point Pre-Deployment Audit (Recommended)
Validates all assignment criteria including auth validation errors, malformed/expired JWTs, all 5 role cross-access boundaries (200 vs 403), dynamic role reassignment, user deactivation, user deletion cascade, audit log persistence, and secrets leakage protection:

```bash
npm run test:audit
```
*(All 19/19 test assertions pass with 100% success)*.

### 2. Core RBAC Security Suite
```bash
npm test
```

### Verified Test Assertions:
1. `401 Unauthorized` for unauthenticated requests.
2. `401 Unauthorized` for tampered/invalid JWT tokens.
3. `401 Unauthorized` for expired JWT tokens.
4. `200 OK` for HR user accessing Zoho People proxy.
5. **`403 Forbidden`** when HR user attempts to access Zoho CRM (`access:zoho_crm` denied).
6. **Audit verification**: Automatic creation of `UNAUTHORIZED_ACCESS` record for HR CRM attempt with full IP and user context.
7. `200 OK` for Sales user accessing Zoho CRM proxy.
8. **`403 Forbidden`** when Sales user attempts to access Zoho Books (`access:zoho_books` denied).
9. `200 OK` for Admin accessing all 4 Zoho proxies simultaneously.
10. `200 OK` for Admin accessing user management and audit logs.
11. **`403 Forbidden`** for non-admin users attempting to access `/api/admin/users`.
12. **Safe Admin Controls**: Logged-in admin account is badged as `(You)` and protected against accidental self-deletion.
13. **Zero Secrets Leakage**: Confirms backend responses never leak client secrets or refresh tokens.

---

## 📁 Repository Structure

```
brainwave/
├── backend/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # 6-table relational schema & indexes
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # PostgreSQL pool with resilient fallback
│   │   │   └── env.js              # Validated environment configuration
│   │   ├── controllers/            # Auth, User, Role, Zoho, Audit handlers
│   │   ├── middlewares/            # JWT auth, verifyRole, verifyPermission
│   │   ├── models/                 # Database queries & RBAC aggregations
│   │   ├── routes/                 # Express API routes
│   │   ├── scripts/
│   │   │   ├── migrate.js          # Migration runner
│   │   │   └── seed.js             # RBAC role & user seeder
│   │   ├── services/
│   │   │   └── zohoService.js      # Centralized OAuth2 & token cache
│   │   └── utils/
│   │       └── jwt.js              # Token signing & verification
│   ├── tests/
│   │   └── rbac.test.js            # Automated security test suite
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, ZohoAppCard, DataViewer, AuditTable
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Session & user auth state provider
│   │   ├── pages/                  # LoginPage, DashboardPage, AdminPage
│   │   ├── services/
│   │   │   └── api.js              # Axios with JWT interceptor & 401 redirect
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Enterprise dark design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── ZOHO_SETUP_GUIDE.md         # Zoho Developer Console & OAuth step-by-step
│   └── VIDEO_DEMO_SCRIPT.md        # 3-5 minute presentation script with timestamps
├── docker-compose.yml              # PostgreSQL 16 Alpine container definition
├── .gitignore
├── README.md
└── package.json                    # Root workspace runner
```

---

## 📹 Video Presentation Script
Refer to [docs/VIDEO_DEMO_SCRIPT.md](docs/VIDEO_DEMO_SCRIPT.md) for the exact 3-5 minute video narration script and camera cues covering all assignment rubric points.
