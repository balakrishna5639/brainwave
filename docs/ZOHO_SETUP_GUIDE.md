# Zoho One API & OAuth2 Integration Setup Guide

This guide walks you through registering a **Backend Service Account** in the Zoho Developer Console, securing OAuth credentials, and generating a permanent refresh token for the BrainWave Custom Employee Portal.

Employees log into the portal with corporate credentials and **never need individual Zoho logins**. The backend handles all Zoho communication via a single service account.

---

## 1. Prerequisites
- A Zoho account (Free Trial or Zoho One account: [https://www.zoho.com/one/](https://www.zoho.com/one/)).
- Access to the **Zoho API Console**: [https://api-console.zoho.com/](https://api-console.zoho.com/).

---

## 2. Register Application in Zoho API Console

1. Navigate to [https://api-console.zoho.com/](https://api-console.zoho.com/).
2. Click **Add Client**.
3. Choose the client type:
   - **Self Client** (Recommended for local evaluation & single service account): Generates a grant token directly within the console.
   - **Server-based Applications** (For production redirect flow):
     - **Client Name**: `BrainWave Employee Portal Service Account`
     - **Homepage URL**: `http://localhost:5173`
     - **Authorized Redirect URIs**: `http://localhost:5000/api/auth/zoho/callback`
4. Copy your **Client ID** and **Client Secret**.

---

## 3. Required API Scopes

In the **Generate Code** tab (Self Client), request the following scopes based on your company's Zoho One applications:

| Application | Required Scope | Purpose |
| :--- | :--- | :--- |
| **Zoho People** (HR) | `ZohoPeople.employee.ALL` | View and manage employee directory and leaves |
| **Zoho CRM** (Sales) | `ZohoCRM.modules.ALL` | Retrieve sales leads, contacts, and deals |
| **Zoho Desk** (Support) | `ZohoDesk.tickets.ALL` | Access customer support tickets and status |
| **Zoho Books** (Finance) | `ZohoBooks.fullaccess.ALL` | Access company invoices, payments, and estimates |

**Scope String (paste into Scope input):**
```text
ZohoPeople.employee.ALL,ZohoCRM.modules.ALL,ZohoDesk.tickets.ALL,ZohoBooks.fullaccess.ALL
```

Select Time Duration: **10 minutes**, specify Description, and click **Generate Code**. Copy the temporary grant token (e.g., `1000.xxxxxxx`).

---

## 4. Exchange Grant Token for a Permanent Refresh Token

Execute this cURL request in your terminal within 10 minutes to exchange the grant token for a permanent refresh token:

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "code=YOUR_GENERATED_GRANT_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code"
```

> **Note for regional data centers**: If your Zoho account is hosted in Europe (`.eu`), India (`.in`), or Australia (`.com.au`), replace `https://accounts.zoho.com` with `https://accounts.zoho.eu` or `https://accounts.zoho.in`.

### Expected Response:
```json
{
  "access_token": "1000.xxxx...",
  "refresh_token": "1000.yyyy...",
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Copy the `refresh_token`.

---

## 5. Retrieve Contextual Organization IDs

Some Zoho products require an Organization ID header or parameter:

1. **Zoho Books Organization ID**:
   - Log into [https://books.zoho.com](https://books.zoho.com).
   - Look at the top-right profile icon or the URL parameter `organization_id=xxxxxxxx`.
2. **Zoho Desk Organization ID (orgId)**:
   - Log into [https://desk.zoho.com](https://desk.zoho.com).
   - In Setup $\rightarrow$ Developer Space $\rightarrow$ API, copy your **Portal/Org ID**.

---

## 6. Configure Backend `.env`

Paste your retrieved credentials into `backend/.env`:

```env
ZOHO_CLIENT_ID=1000.YOUR_CLIENT_ID
ZOHO_CLIENT_SECRET=YOUR_CLIENT_SECRET
ZOHO_REFRESH_TOKEN=1000.YOUR_REFRESH_TOKEN

ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_API_DOMAIN=https://www.zohoapis.com

ZOHO_PEOPLE_URL=https://people.zoho.com
ZOHO_CRM_URL=https://crm.zoho.com
ZOHO_DESK_URL=https://desk.zoho.com
ZOHO_BOOKS_URL=https://books.zoho.com

ZOHO_BOOKS_ORG_ID=YOUR_BOOKS_ORG_ID
ZOHO_DESK_ORG_ID=YOUR_DESK_ORG_ID
```

When credentials are configured, restart the backend. The portal will automatically detect live credentials and switch the badge to:
`🟢 Zoho One: LIVE`.
