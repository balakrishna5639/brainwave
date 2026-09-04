const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/brainwave_portal',
  JWT_SECRET: process.env.JWT_SECRET || 'brainwave_fallback_jwt_secret_dev_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30m',

  // Zoho Service Account Credentials
  ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID || '',
  ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET || '',
  ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN || '',

  // Zoho Configurable Endpoints
  ZOHO_ACCOUNTS_URL: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
  ZOHO_API_DOMAIN: process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com',
  ZOHO_PEOPLE_URL: process.env.ZOHO_PEOPLE_URL || 'https://people.zoho.com',
  ZOHO_CRM_URL: process.env.ZOHO_CRM_URL || 'https://crm.zoho.com',
  ZOHO_DESK_URL: process.env.ZOHO_DESK_URL || 'https://desk.zoho.com',
  ZOHO_BOOKS_URL: process.env.ZOHO_BOOKS_URL || 'https://books.zoho.com',

  // Zoho Organization IDs
  ZOHO_BOOKS_ORG_ID: process.env.ZOHO_BOOKS_ORG_ID || '',
  ZOHO_DESK_ORG_ID: process.env.ZOHO_DESK_ORG_ID || '',

  // Utility to determine if Live Zoho is configured
  isZohoConfigured() {
    return Boolean(
      this.ZOHO_CLIENT_ID &&
      this.ZOHO_CLIENT_SECRET &&
      this.ZOHO_REFRESH_TOKEN
    );
  }
};
