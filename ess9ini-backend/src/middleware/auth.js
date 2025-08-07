const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CONSTANTS = require('../config/constants');

// Middleware to authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and check if still active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      farmId: user.farmId,
      firstName: user.firstName,
      lastName: user.lastName,
      language: user.language
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error.',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to check farm ownership or admin access
exports.checkFarmAccess = async (req, res, next) => {
  try {
    const farmId = req.params.farmId || req.body.farmId || req.query.farmId;
    
    if (!farmId) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID is required.',
        code: 'FARM_ID_REQUIRED'
      });
    }

    // Admin can access any farm
    if (req.user.role === CONSTANTS.USER_ROLES.ADMIN) {
      return next();
    }

    // Check if user has access to this farm
    if (req.user.farmId && req.user.farmId.toString() === farmId.toString()) {
      return next();
    }

    // Check if user is a technician assigned to this farm
    if (req.user.role === CONSTANTS.USER_ROLES.TECHNICIAN) {
      const Farm = require('../models/Farm');
      const farm = await Farm.findById(farmId);
      
      if (farm && farm.technicians && farm.technicians.includes(req.user.userId)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this farm.',
      code: 'FARM_ACCESS_DENIED'
    });
  } catch (error) {
    console.error('Farm access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking farm access.',
      code: 'FARM_ACCESS_ERROR'
    });
  }
};

// Middleware to check sensor access
exports.checkSensorAccess = async (req, res, next) => {
  try {
    const sensorId = req.params.sensorId || req.params.id;
    
    if (!sensorId) {
      return res.status(400).json({
        success: false,
        message: 'Sensor ID is required.',
        code: 'SENSOR_ID_REQUIRED'
      });
    }

    const Sensor = require('../models/Sensor');
    const sensor = await Sensor.findById(sensorId);
    
    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found.',
        code: 'SENSOR_NOT_FOUND'
      });
    }

    // Admin can access any sensor
    if (req.user.role === CONSTANTS.USER_ROLES.ADMIN) {
      req.sensor = sensor;
      return next();
    }

    // Check if user has access to the farm that owns this sensor
    if (req.user.farmId && req.user.farmId.toString() === sensor.farmId.toString()) {
      req.sensor = sensor;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this sensor.',
      code: 'SENSOR_ACCESS_DENIED'
    });
  } catch (error) {
    console.error('Sensor access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking sensor access.',
      code: 'SENSOR_ACCESS_ERROR'
    });
  }
};

// Middleware to validate API key for IoT devices
exports.validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required.',
      code: 'API_KEY_REQUIRED'
    });
  }

  if (apiKey !== process.env.IOT_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key.',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

// Middleware to check if user owns the resource
exports.checkOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Admin can access any resource
      if (req.user.role === CONSTANTS.USER_ROLES.ADMIN) {
        req.resource = resource;
        return next();
      }

      // Check ownership based on different fields
      let hasAccess = false;
      
      if (resource.userId && resource.userId.toString() === req.user.userId.toString()) {
        hasAccess = true;
      } else if (resource.owner && resource.owner.toString() === req.user.userId.toString()) {
        hasAccess = true;
      } else if (resource.farmId && req.user.farmId && resource.farmId.toString() === req.user.farmId.toString()) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.',
          code: 'OWNERSHIP_DENIED'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking resource ownership.',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

// Middleware to log user activity
exports.logActivity = (action) => {
  return (req, res, next) => {
    // Store activity info in request for later logging
    req.activity = {
      userId: req.user?.userId,
      action,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };
    
    // Log immediately for critical actions
    if (['login', 'logout', 'irrigation_start', 'irrigation_stop'].includes(action)) {
      console.log(`User Activity: ${req.user?.email} performed ${action} from ${req.ip}`);
    }
    
    next();
  };
};

// Middleware to check rate limiting per user
exports.userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) return next();
    
    const userId = req.user.userId.toString();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create user request history
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }
    
    const requests = userRequests.get(userId);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    userRequests.set(userId, recentRequests);
    
    // Check if user has exceeded the limit
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    userRequests.set(userId, recentRequests);
    
    next();
  };
};

module.exports = exports;
