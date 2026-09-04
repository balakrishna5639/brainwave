const express = require('express');
const router = express.Router();
const ZohoController = require('../controllers/zohoController');
const { authenticate } = require('../middlewares/auth');
const { verifyPermission } = require('../middlewares/rbac');

// All Zoho routes require valid user authentication
router.use(authenticate);

// General status and authorized services catalog
router.get('/status', ZohoController.getStatus);
router.get('/services', ZohoController.getServices);

// Role-restricted backend Zoho service proxy endpoints
// HR / Admin
router.get(
  '/people/employees',
  verifyPermission('access:zoho_people'),
  ZohoController.getPeopleEmployees
);

// Sales / Admin
router.get(
  '/crm/leads',
  verifyPermission('access:zoho_crm'),
  ZohoController.getCRMLeads
);

// Support / Admin
router.get(
  '/desk/tickets',
  verifyPermission('access:zoho_desk'),
  ZohoController.getDeskTickets
);

// Finance / Admin
router.get(
  '/books/invoices',
  verifyPermission('access:zoho_books'),
  ZohoController.getBooksInvoices
);

module.exports = router;
