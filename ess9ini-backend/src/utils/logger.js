const fs = require('fs');
const path = require('path');

/**
 * Simple logging utility
 * In production, consider using Winston or similar logging library
 */

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Format timestamp
const formatTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatMessage = (level, message, meta = {}) => {
  const timestamp = formatTimestamp();
  const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaString}`;
};

// Write to file
const writeToFile = (filename, message) => {
  const filePath = path.join(logsDir, filename);
  const logMessage = `${message}\n`;
  
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

// Console output with colors
const consoleOutput = (level, message, color) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${color}${message}${colors.reset}`);
  }
};

// Base logging function
const log = (level, levelNum, color, message, meta = {}) => {
  if (levelNum > currentLogLevel) return;
  
  const formattedMessage = formatMessage(level, message, meta);
  
  // Console output
  consoleOutput(level, formattedMessage, color);
  
  // File output
  const filename = `${new Date().toISOString().split('T')[0]}.log`;
  writeToFile(filename, formattedMessage);
  
  // Error logs go to separate file
  if (level === 'ERROR') {
    writeToFile('error.log', formattedMessage);
  }
};

// Logger object
const logger = {
  error: (message, meta = {}) => {
    log('ERROR', LOG_LEVELS.ERROR, colors.red, message, meta);
  },
  
  warn: (message, meta = {}) => {
    log('WARN', LOG_LEVELS.WARN, colors.yellow, message, meta);
  },
  
  info: (message, meta = {}) => {
    log('INFO', LOG_LEVELS.INFO, colors.blue, message, meta);
  },
  
  debug: (message, meta = {}) => {
    log('DEBUG', LOG_LEVELS.DEBUG, colors.cyan, message, meta);
  },
  
  success: (message, meta = {}) => {
    log('INFO', LOG_LEVELS.INFO, colors.green, `✅ ${message}`, meta);
  },
  
  // HTTP request logging
  request: (req, res, duration) => {
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    const meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId
    };
    
    if (res.statusCode >= 400) {
      logger.error(message, meta);
    } else {
      logger.info(message, meta);
    }
  },
  
  // Database operation logging
  database: (operation, collection, duration, error = null) => {
    const message = `DB ${operation} on ${collection} - ${duration}ms`;
    
    if (error) {
      logger.error(`${message} - FAILED`, { error: error.message });
    } else {
      logger.debug(message);
    }
  },
  
  // Authentication logging
  auth: (action, email, success, ip, reason = null) => {
    const message = `AUTH ${action} - ${email} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = { ip, reason };
    
    if (success) {
      logger.info(message, meta);
    } else {
      logger.warn(message, meta);
    }
  },
  
  // Irrigation logging
  irrigation: (action, farmId, userId, zones, duration = null) => {
    const message = `IRRIGATION ${action} - Farm: ${farmId} - User: ${userId} - Zones: [${zones.join(', ')}]`;
    const meta = { duration };
    logger.info(message, meta);
  },
  
  // Sensor logging
  sensor: (action, sensorId, deviceId, data = {}) => {
    const message = `SENSOR ${action} - ${deviceId} (${sensorId})`;
    logger.debug(message, data);
  },
  
  // Alert logging
  alert: (type, severity, message, farmId, userId = null) => {
    const logMessage = `ALERT ${severity.toUpperCase()} - ${type} - ${message}`;
    const meta = { farmId, userId };
    
    if (severity === 'critical') {
      logger.error(logMessage, meta);
    } else if (severity === 'warning') {
      logger.warn(logMessage, meta);
    } else {
      logger.info(logMessage, meta);
    }
  },
  
  // Performance logging
  performance: (operation, duration, threshold = 1000) => {
    const message = `PERFORMANCE ${operation} - ${duration}ms`;
    
    if (duration > threshold) {
      logger.warn(`SLOW ${message}`, { threshold });
    } else {
      logger.debug(message);
    }
  },
  
  // Security logging
  security: (event, details, severity = 'warn') => {
    const message = `SECURITY ${event}`;
    logger[severity](message, details);
  }
};

// Middleware for request logging
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId
  });
  
  next(err);
};

// Clean up old log files
const cleanupLogs = (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      logger.error('Failed to read logs directory', { error: err.message });
      return;
    }
    
    files.forEach(file => {
      if (file.endsWith('.log') && file !== 'error.log') {
        const filePath = path.join(logsDir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (stats.mtime < cutoffDate) {
            fs.unlink(filePath, (err) => {
              if (!err) {
                logger.info(`Cleaned up old log file: ${file}`);
              }
            });
          }
        });
      }
    });
  });
};

// Schedule log cleanup (run daily)
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupLogs, 24 * 60 * 60 * 1000); // 24 hours
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  cleanupLogs,
  LOG_LEVELS
};
