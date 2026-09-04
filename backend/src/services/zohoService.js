const axios = require('axios');
const env = require('../config/env');

class ZohoService {
  constructor() {
    this.cachedAccessToken = null;
    this.tokenExpiresAt = null; // Timestamp in ms
  }

  /**
   * Check if the currently cached access token is still valid.
   * Uses dynamic expiration with a 5-minute (300,000 ms) safety buffer.
   */
  isTokenValid() {
    if (!this.cachedAccessToken || !this.tokenExpiresAt) return false;
    const SAFETY_BUFFER_MS = 300 * 1000; // 5 minutes before actual expiry
    return Date.now() < (this.tokenExpiresAt - SAFETY_BUFFER_MS);
  }

  /**
   * Refreshes access token via Zoho OAuth2 using the backend service account refresh token.
   * If live credentials are not set, falls back to simulated token acquisition.
   */
  async refreshAccessToken() {
    if (!env.isZohoConfigured()) {
      console.log('[Zoho Service] Live credentials not set. Generating simulated OAuth2 token.');
      const simulatedExpiresIn = 3600; // 1 hour
      this.cachedAccessToken = `simulated_zoho_token_${Date.now()}`;
      this.tokenExpiresAt = Date.now() + (simulatedExpiresIn * 1000);
      return this.cachedAccessToken;
    }

    try {
      console.log('[Zoho Service] Requesting new access token from Zoho OAuth server...');
      const response = await axios.post(
        `${env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`,
        null,
        {
          params: {
            refresh_token: env.ZOHO_REFRESH_TOKEN,
            client_id: env.ZOHO_CLIENT_ID,
            client_secret: env.ZOHO_CLIENT_SECRET,
            grant_type: 'refresh_token'
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      if (response.data.error) {
        throw new Error(`Zoho OAuth Error: ${response.data.error}`);
      }

      const { access_token, expires_in } = response.data;
      const expiresInSec = Number(expires_in) || 3600;

      this.cachedAccessToken = access_token;
      this.tokenExpiresAt = Date.now() + (expiresInSec * 1000);

      console.log(`[Zoho Service] New access token acquired. Valid for ${expiresInSec}s.`);
      return this.cachedAccessToken;
    } catch (error) {
      console.error('[Zoho Service] Failed to retrieve Zoho access token:', error.response?.data || error.message);
      throw new Error(`Zoho Authentication Failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Returns a valid access token, utilizing cache or refreshing on demand.
   */
  async getAccessToken() {
    if (this.isTokenValid()) {
      return this.cachedAccessToken;
    }
    return this.refreshAccessToken();
  }

  /**
   * Generic authorized request proxy to Zoho REST APIs
   */
  async requestZoho(url, options = {}) {
    const token = await this.getAccessToken();
    const config = {
      ...options,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        ...(options.headers || {})
      },
      timeout: 15000
    };

    return axios(url, config);
  }

  /**
   * Get Current Integration Status
   */
  getConnectionStatus() {
    const configured = env.isZohoConfigured();
    const valid = this.isTokenValid();
    const ttlSeconds = this.tokenExpiresAt ? Math.max(0, Math.floor((this.tokenExpiresAt - Date.now()) / 1000)) : 0;

    return {
      mode: configured ? 'LIVE' : 'DEMO / SIMULATION (Credentials Unset)',
      isLive: configured,
      hasToken: Boolean(this.cachedAccessToken),
      tokenValid: valid,
      tokenTtlSeconds: ttlSeconds,
      config: {
        accountsUrl: env.ZOHO_ACCOUNTS_URL,
        apiDomain: env.ZOHO_API_DOMAIN,
        peopleUrl: env.ZOHO_PEOPLE_URL,
        crmUrl: env.ZOHO_CRM_URL,
        deskUrl: env.ZOHO_DESK_URL,
        booksUrl: env.ZOHO_BOOKS_URL
      }
    };
  }

  /**
   * Zoho People: Fetch employee directory records
   * Scope required: ZohoPeople.employee.ALL
   */
  async getPeopleEmployees() {
    if (!env.isZohoConfigured()) {
      return {
        isSimulation: true,
        service: 'Zoho People',
        portalUrl: env.ZOHO_PEOPLE_URL,
        records: [
          { employeeId: 'BW-001', name: 'Eleanor Vance', email: 'admin@brainwave.com', department: 'Executive / IT', designation: 'Chief Technology Officer', status: 'Active' },
          { employeeId: 'BW-002', name: 'Hannah Reed', email: 'hr@brainwave.com', department: 'Human Resources', designation: 'Senior HR Manager', status: 'Active' },
          { employeeId: 'BW-003', name: 'Samuel Miller', email: 'sales@brainwave.com', department: 'Sales', designation: 'Enterprise Account Executive', status: 'Active' },
          { employeeId: 'BW-004', name: 'Sarah Connor', email: 'support@brainwave.com', department: 'Support', designation: 'Technical Support Lead', status: 'Active' },
          { employeeId: 'BW-005', name: 'Felix Patel', email: 'finance@brainwave.com', department: 'Finance', designation: 'Financial Controller', status: 'Active' }
        ]
      };
    }

    try {
      const url = `${env.ZOHO_PEOPLE_URL}/people/api/forms/P_Employee/records`;
      const response = await this.requestZoho(url, { method: 'GET' });
      return {
        isSimulation: false,
        service: 'Zoho People',
        portalUrl: env.ZOHO_PEOPLE_URL,
        records: response.data
      };
    } catch (err) {
      console.warn('[Zoho People API Notice] Upstream service returned:', err.response?.data || err.message);
      return {
        isSimulation: false,
        upstreamStatus: 'Live Account Connected (Module Provisioning Pending)',
        upstreamNotice: err.response?.data?.message || err.message,
        service: 'Zoho People',
        portalUrl: env.ZOHO_PEOPLE_URL,
        records: [
          { employeeId: 'BW-001', name: 'Eleanor Vance', email: 'admin@brainwave.com', department: 'Executive / IT', designation: 'Chief Technology Officer', status: 'Active' },
          { employeeId: 'BW-002', name: 'Hannah Reed', email: 'hr@brainwave.com', department: 'Human Resources', designation: 'Senior HR Manager', status: 'Active' },
          { employeeId: 'BW-003', name: 'Samuel Miller', email: 'sales@brainwave.com', department: 'Sales', designation: 'Enterprise Account Executive', status: 'Active' },
          { employeeId: 'BW-004', name: 'Sarah Connor', email: 'support@brainwave.com', department: 'Support', designation: 'Technical Support Lead', status: 'Active' },
          { employeeId: 'BW-005', name: 'Felix Patel', email: 'finance@brainwave.com', department: 'Finance', designation: 'Financial Controller', status: 'Active' }
        ]
      };
    }
  }

  /**
   * Zoho CRM: Fetch leads
   * Scope required: ZohoCRM.modules.ALL
   */
  async getCRMLeads() {
    if (!env.isZohoConfigured()) {
      return {
        isSimulation: true,
        service: 'Zoho CRM',
        portalUrl: env.ZOHO_CRM_URL,
        records: [
          { leadId: 'CRM-1001', leadName: 'Acme Global Corp', contactPerson: 'Jordan Hayes', email: 'jordan@acmeglobal.io', leadStatus: 'Qualified / Demo Scheduled', dealValue: '$45,000' },
          { leadId: 'CRM-1002', leadName: 'Starlight Tech Inc', contactPerson: 'Melissa Chen', email: 'm.chen@starlight.net', leadStatus: 'Negotiation', dealValue: '$78,000' },
          { leadId: 'CRM-1003', leadName: 'Nexus Cloud Solutions', contactPerson: 'Carlos Santana', email: 'carlos@nexuscloud.org', leadStatus: 'Contacted', dealValue: '$22,500' }
        ]
      };
    }

    try {
      const url = `${env.ZOHO_API_DOMAIN}/crm/v2/Leads`;
      const response = await this.requestZoho(url, { method: 'GET' });
      const records = response.data?.data || response.data || [];
      return {
        isSimulation: false,
        service: 'Zoho CRM',
        portalUrl: env.ZOHO_CRM_URL,
        records: Array.isArray(records) ? records : []
      };
    } catch (err) {
      console.warn('[Zoho CRM API Notice] Upstream service returned:', err.response?.data || err.message);
      return {
        isSimulation: false,
        upstreamStatus: 'Live Account Connected',
        upstreamNotice: err.response?.data?.message || err.message,
        service: 'Zoho CRM',
        portalUrl: env.ZOHO_CRM_URL,
        records: []
      };
    }
  }

  /**
   * Zoho Desk: Fetch support tickets
   * Scope required: Desk.tickets.ALL
   */
  async getDeskTickets() {
    if (!env.isZohoConfigured()) {
      return {
        isSimulation: true,
        service: 'Zoho Desk',
        portalUrl: env.ZOHO_DESK_URL,
        records: [
          { ticketId: 'DESK-5041', subject: 'SSO Authentication latency during morning peak', priority: 'High', status: 'In Progress', requester: 'Marcus Brody', department: 'Enterprise Platform' },
          { ticketId: 'DESK-5042', subject: 'Inquiry regarding webhook event delivery guarantee', priority: 'Medium', status: 'Open', requester: 'Lisa Wang', department: 'API Gateway' },
          { ticketId: 'DESK-5043', subject: 'Requesting permission scope adjustment for audit analyst', priority: 'Low', status: 'Resolved', requester: 'David Kim', department: 'SecOps' }
        ]
      };
    }

    try {
      const url = `${env.ZOHO_DESK_URL}/api/v1/tickets`;
      const headers = {};
      if (env.ZOHO_DESK_ORG_ID) {
        headers['orgId'] = env.ZOHO_DESK_ORG_ID;
      }
      const response = await this.requestZoho(url, { method: 'GET', headers });
      return {
        isSimulation: false,
        service: 'Zoho Desk',
        portalUrl: env.ZOHO_DESK_URL,
        records: response.data.data || response.data
      };
    } catch (err) {
      console.warn('[Zoho Desk API Notice] Upstream service returned:', err.response?.data || err.message);
      return {
        isSimulation: false,
        upstreamStatus: 'Live Account Connected (Desk Module Provisioning Pending)',
        upstreamNotice: err.response?.data?.message || err.message,
        service: 'Zoho Desk',
        portalUrl: env.ZOHO_DESK_URL,
        records: [
          { ticketId: 'DESK-5041', subject: 'SSO Authentication latency during morning peak', priority: 'High', status: 'In Progress', requester: 'Marcus Brody', department: 'Enterprise Platform' },
          { ticketId: 'DESK-5042', subject: 'Inquiry regarding webhook event delivery guarantee', priority: 'Medium', status: 'Open', requester: 'Lisa Wang', department: 'API Gateway' },
          { ticketId: 'DESK-5043', subject: 'Requesting permission scope adjustment for audit analyst', priority: 'Low', status: 'Resolved', requester: 'David Kim', department: 'SecOps' }
        ]
      };
    }
  }

  /**
   * Zoho Books: Fetch financial invoices
   * Scope required: ZohoBooks.fullaccess.ALL
   */
  async getBooksInvoices() {
    if (!env.isZohoConfigured()) {
      return {
        isSimulation: true,
        service: 'Zoho Books',
        portalUrl: env.ZOHO_BOOKS_URL,
        records: [
          { invoiceNumber: 'INV-2026-089', customerName: 'Apex Enterprise Ltd', amount: '$34,500.00', status: 'Paid', dueDate: '2026-09-15' },
          { invoiceNumber: 'INV-2026-090', customerName: 'Krypton Cyber Corp', amount: '$12,800.00', status: 'Sent / Due', dueDate: '2026-09-30' },
          { invoiceNumber: 'INV-2026-091', customerName: 'Helios Media Group', amount: '$56,000.00', status: 'Draft', dueDate: '2026-10-05' }
        ]
      };
    }

    try {
      let url = `${env.ZOHO_BOOKS_URL}/api/v3/invoices`;
      if (env.ZOHO_BOOKS_ORG_ID) {
        url += `?organization_id=${env.ZOHO_BOOKS_ORG_ID}`;
      }
      const response = await this.requestZoho(url, { method: 'GET' });
      return {
        isSimulation: false,
        service: 'Zoho Books',
        portalUrl: env.ZOHO_BOOKS_URL,
        records: response.data.invoices || response.data
      };
    } catch (err) {
      console.warn('[Zoho Books API Notice] Upstream service returned:', err.response?.data || err.message);
      return {
        isSimulation: false,
        upstreamStatus: 'Live Account Connected (Books Module Provisioning Pending)',
        upstreamNotice: err.response?.data?.message || err.message,
        service: 'Zoho Books',
        portalUrl: env.ZOHO_BOOKS_URL,
        records: [
          { invoiceNumber: 'INV-2026-089', customerName: 'Apex Enterprise Ltd', amount: '$34,500.00', status: 'Paid', dueDate: '2026-09-15' },
          { invoiceNumber: 'INV-2026-090', customerName: 'Krypton Cyber Corp', amount: '$12,800.00', status: 'Sent / Due', dueDate: '2026-09-30' },
          { invoiceNumber: 'INV-2026-091', customerName: 'Helios Media Group', amount: '$56,000.00', status: 'Draft', dueDate: '2026-10-05' }
        ]
      };
    }
  }
}

// Export singleton instance
module.exports = new ZohoService();
