const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./src/config/env');
const { initDB, getActiveEngine } = require('./src/config/db');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const zohoRoutes = require('./src/routes/zohoRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health & System Info Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseEngine: getActiveEngine(),
    zohoMode: env.isZohoConfigured() ? 'LIVE' : 'DEMO / SIMULATION (Credentials Unset)',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/zoho', zohoRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `API route ${req.method} ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Start Server
async function startServer() {
  try {
    await initDB();
    const server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 BrainWave Employee Portal Backend running on port ${env.PORT}`);
      console.log(`📦 Database: ${getActiveEngine()}`);
      console.log(`☁️ Zoho Mode: ${env.isZohoConfigured() ? 'LIVE (Real Zoho OAuth)' : 'DEMO / SIMULATION'}`);
      console.log('====================================================');
    });
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
