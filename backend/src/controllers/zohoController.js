const zohoService = require('../services/zohoService');
const AuditModel = require('../models/auditModel');
const env = require('../config/env');

class ZohoController {
  /**
   * Returns list of authorized Zoho services for the authenticated user.
   * Based on user permissions, returns service metadata, portal launch URL, and proxy endpoint.
   */
  static async getServices(req, res) {
    const userPermissions = req.user.permissions || [];
    const isAdmin = (req.user.roles || []).includes('Admin');

    const allServices = [
      {
        id: 'zoho_people',
        name: 'Zoho People',
        category: 'HR Management',
        description: 'Employee lifecycle, attendance, leaves, performance appraisals, and organization directory.',
        launchUrl: env.ZOHO_PEOPLE_URL,
        apiEndpoint: '/zoho/people/employees',
        requiredPermission: 'access:zoho_people',
        icon: 'users',
        color: '#008080'
      },
      {
        id: 'zoho_crm',
        name: 'Zoho CRM',
        category: 'Sales & Relations',
        description: 'Omnichannel lead pipeline, deal stages, accounts, contacts, and revenue forecasting.',
        launchUrl: env.ZOHO_CRM_URL,
        apiEndpoint: '/zoho/crm/leads',
        requiredPermission: 'access:zoho_crm',
        icon: 'briefcase',
        color: '#E65100'
      },
      {
        id: 'zoho_desk',
        name: 'Zoho Desk',
        category: 'Customer Support',
        description: 'Customer service tickets, SLA monitoring, agent work queues, and resolution knowledge base.',
        launchUrl: env.ZOHO_DESK_URL,
        apiEndpoint: '/zoho/desk/tickets',
        requiredPermission: 'access:zoho_desk',
        icon: 'headphones',
        color: '#1565C0'
      },
      {
        id: 'zoho_books',
        name: 'Zoho Books',
        category: 'Finance & Accounting',
        description: 'Accounts receivable/payable, recurring invoices, GST/tax filing, and financial statements.',
        launchUrl: env.ZOHO_BOOKS_URL,
        apiEndpoint: '/zoho/books/invoices',
        requiredPermission: 'access:zoho_books',
        icon: 'receipt',
        color: '#2E7D32'
      }
    ];

    // Filter services based on permission
    const authorizedServices = allServices.filter(svc => 
      isAdmin || userPermissions.includes(svc.requiredPermission)
    );

    return res.json({
      success: true,
      count: authorizedServices.length,
      services: authorizedServices
    });
  }

  static async getStatus(req, res) {
    const status = zohoService.getConnectionStatus();
    return res.json({
      success: true,
      ...status
    });
  }

  static async getPeopleEmployees(req, res) {
    try {
      const data = await zohoService.getPeopleEmployees();

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'ZOHO_ACCESS',
        resource: '/api/zoho/people/employees',
        ipAddress: req.ip || req.connection.remoteAddress,
        status: 'SUCCESS',
        details: { service: 'Zoho People', count: Array.isArray(data.records) ? data.records.length : 1 }
      });

      return res.json({ success: true, ...data });
    } catch (err) {
      console.error('[Zoho People Controller Error]', err.message);
      return res.status(502).json({ success: false, message: err.message });
    }
  }

  static async getCRMLeads(req, res) {
    try {
      const data = await zohoService.getCRMLeads();

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'ZOHO_ACCESS',
        resource: '/api/zoho/crm/leads',
        ipAddress: req.ip || req.connection.remoteAddress,
        status: 'SUCCESS',
        details: { service: 'Zoho CRM', count: Array.isArray(data.records) ? data.records.length : 1 }
      });

      return res.json({ success: true, ...data });
    } catch (err) {
      console.error('[Zoho CRM Controller Error]', err.message);
      return res.status(502).json({ success: false, message: err.message });
    }
  }

  static async getDeskTickets(req, res) {
    try {
      const data = await zohoService.getDeskTickets();

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'ZOHO_ACCESS',
        resource: '/api/zoho/desk/tickets',
        ipAddress: req.ip || req.connection.remoteAddress,
        status: 'SUCCESS',
        details: { service: 'Zoho Desk', count: Array.isArray(data.records) ? data.records.length : 1 }
      });

      return res.json({ success: true, ...data });
    } catch (err) {
      console.error('[Zoho Desk Controller Error]', err.message);
      return res.status(502).json({ success: false, message: err.message });
    }
  }

  static async getBooksInvoices(req, res) {
    try {
      const data = await zohoService.getBooksInvoices();

      await AuditModel.createLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'ZOHO_ACCESS',
        resource: '/api/zoho/books/invoices',
        ipAddress: req.ip || req.connection.remoteAddress,
        status: 'SUCCESS',
        details: { service: 'Zoho Books', count: Array.isArray(data.records) ? data.records.length : 1 }
      });

      return res.json({ success: true, ...data });
    } catch (err) {
      console.error('[Zoho Books Controller Error]', err.message);
      return res.status(502).json({ success: false, message: err.message });
    }
  }
}

module.exports = ZohoController;
