const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');

// Import routes (only if they exist and work)
let authRoutes, userRoutes, farmRoutes, sensorRoutes, irrigationRoutes;
try {
  authRoutes = require('./src/routes/auth');
} catch (err) {
  console.log('⚠️  Auth routes not available:', err.message);
}
try {
  userRoutes = require('./src/routes/users');
} catch (err) {
  console.log('⚠️  User routes not available:', err.message);
}
try {
  farmRoutes = require('./src/routes/farms');
} catch (err) {
  console.log('⚠️  Farm routes not available:', err.message);
}
try {
  sensorRoutes = require('./src/routes/sensors');
} catch (err) {
  console.log('⚠️  Sensor routes not available:', err.message);
}
try {
  irrigationRoutes = require('./src/routes/irrigation');
} catch (err) {
  console.log('⚠️  Irrigation routes not available:', err.message);
}

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`📊 Database: ${process.env.DB_NAME || 'ess9ini-farm'}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ess9ini Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes (only if available)
if (authRoutes) app.use('/api/auth', authRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (farmRoutes) app.use('/api/farms', farmRoutes);
if (sensorRoutes) app.use('/api/sensors', sensorRoutes);
if (irrigationRoutes) app.use('/api/irrigation', irrigationRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Welcome message for root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌱 Welcome to Ess9ini Smart Farm API',
    description: 'Backend API for Tunisian Smart Farming Dashboard',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      farms: '/api/farms',
      sensors: '/api/sensors',
      irrigation: '/api/irrigation'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      '/api/health',
      '/api/auth',
      '/api/users',
      '/api/farms',
      '/api/sensors',
      '/api/irrigation'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('🚀 Ess9ini Backend Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🎯 Client URL: ${process.env.CLIENT_URL}`);
  console.log('📋 Available endpoints:');
  console.log('   GET  /api/health');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/sensors');
  console.log('   POST /api/irrigation/start');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    mongoose.connection.close();
  });
});

module.exports = app;
