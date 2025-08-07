const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false // Count failed requests
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Irrigation control rate limiter
const irrigationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 irrigation commands per 5 minutes
  message: {
    success: false,
    message: 'Too many irrigation commands, please wait before trying again.',
    code: 'IRRIGATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user?.userId || req.ip;
  }
});

// Sensor data upload rate limiter (for IoT devices)
const sensorDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each device to 60 readings per minute (1 per second)
  message: {
    success: false,
    message: 'Too many sensor readings, please reduce upload frequency.',
    code: 'SENSOR_DATA_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use device ID from header or API key
    return req.header('X-Device-ID') || req.header('X-API-Key') || req.ip;
  },
  skip: (req) => {
    // Skip if not a sensor data endpoint
    return !req.path.includes('/readings');
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 file uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API key rate limiter (for external integrations)
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each API key to 1000 requests per hour
  message: {
    success: false,
    message: 'API key rate limit exceeded.',
    code: 'API_KEY_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.header('X-API-Key') || req.ip;
  }
});

// Dynamic rate limiter based on user role
const createRoleBasedLimiter = (limits) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      const userRole = req.user?.role;
      return limits[userRole] || limits.default || 100;
    },
    message: (req) => ({
      success: false,
      message: `Rate limit exceeded for ${req.user?.role || 'user'} role.`,
      code: 'ROLE_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    }),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.userId || req.ip;
    }
  });
};

// Create role-based limiter for different user types
const roleLimiter = createRoleBasedLimiter({
  admin: 500,     // Admins get higher limits
  farmer: 200,    // Farmers get moderate limits
  technician: 300, // Technicians get higher limits for maintenance
  default: 100    // Default for unauthenticated users
});

// Sliding window rate limiter using Redis (for production)
const createSlidingWindowLimiter = (options) => {
  const { windowMs, max, keyGenerator } = options;
  
  return async (req, res, next) => {
    // This would use Redis in production
    // For now, we'll use the standard rate limiter
    return generalLimiter(req, res, next);
  };
};

// Custom rate limiter for specific endpoints
const createCustomLimiter = (windowMs, max, message, keyGenerator) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip)
  });
};

// Rate limiter for weather API calls (to prevent excessive external API usage)
const weatherApiLimiter = createCustomLimiter(
  60 * 60 * 1000, // 1 hour
  100, // 100 requests per hour
  'Weather API rate limit exceeded.',
  (req) => 'weather-api' // Single key for all weather requests
);

// Rate limiter for AI prediction requests
const aiPredictionLimiter = createCustomLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // 20 predictions per 5 minutes
  'AI prediction rate limit exceeded.',
  (req) => req.user?.farmId || req.ip // Per farm rate limiting
);

// Export all rate limiters
module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  irrigationLimiter,
  sensorDataLimiter,
  uploadLimiter,
  apiKeyLimiter,
  roleLimiter,
  weatherApiLimiter,
  aiPredictionLimiter,
  createCustomLimiter,
  createRoleBasedLimiter,
  createSlidingWindowLimiter
};
