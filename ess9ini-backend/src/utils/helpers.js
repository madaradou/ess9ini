const crypto = require('crypto');
const CONSTANTS = require('../config/constants');

/**
 * General utility helper functions
 */

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate random number between min and max
const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Hash string using SHA256
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Format phone number for Tunisia
const formatTunisianPhone = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing
  if (digits.length === 8) {
    return `+216${digits}`;
  } else if (digits.length === 11 && digits.startsWith('216')) {
    return `+${digits}`;
  }
  
  return phone; // Return original if format is unclear
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate Tunisian phone number
const isValidTunisianPhone = (phone) => {
  const phoneRegex = /^\+216[2-9]\d{7}$/;
  return phoneRegex.test(phone);
};

// Convert moisture reading to percentage
const convertMoistureToPercentage = (rawValue, dryValue, wetValue) => {
  if (rawValue <= wetValue) return 100;
  if (rawValue >= dryValue) return 0;
  
  const percentage = ((dryValue - rawValue) / (dryValue - wetValue)) * 100;
  return Math.round(Math.max(0, Math.min(100, percentage)));
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Format date for Tunisia timezone
const formatDateForTunisia = (date, format = 'full') => {
  const options = {
    timeZone: CONSTANTS.TUNISIA.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  if (format === 'full') {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }
  
  return new Date(date).toLocaleString('en-GB', options);
};

// Get time difference in human readable format
const getTimeDifference = (date1, date2 = new Date()) => {
  const diff = Math.abs(date2 - date1);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
};

// Sanitize string for database storage
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

// Generate device ID
const generateDeviceId = (prefix = 'ESP32') => {
  const randomPart = generateRandomString(4).toUpperCase();
  return `${prefix}_${randomPart}`;
};

// Calculate irrigation water amount
const calculateWaterAmount = (area, duration, flowRate = 5) => {
  // area in hectares, duration in minutes, flowRate in L/min per hectare
  return Math.round(area * duration * flowRate);
};

// Convert units (metric/imperial)
const convertUnits = {
  temperature: {
    celsiusToFahrenheit: (celsius) => (celsius * 9/5) + 32,
    fahrenheitToCelsius: (fahrenheit) => (fahrenheit - 32) * 5/9
  },
  area: {
    hectaresToAcres: (hectares) => hectares * 2.47105,
    acresToHectares: (acres) => acres / 2.47105
  },
  volume: {
    litersToGallons: (liters) => liters * 0.264172,
    gallonsToLiters: (gallons) => gallons / 0.264172
  }
};

// Validate coordinates for Tunisia
const isValidTunisianCoordinates = (latitude, longitude) => {
  // Tunisia approximate bounds
  const bounds = {
    north: 37.5,
    south: 30.2,
    east: 11.6,
    west: 7.5
  };
  
  return latitude >= bounds.south && latitude <= bounds.north &&
         longitude >= bounds.west && longitude <= bounds.east;
};

// Generate API response
const generateResponse = (success, message, data = null, code = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) response.data = data;
  if (code) response.code = code;
  
  return response;
};

// Paginate array
const paginateArray = (array, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    totalCount: array.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(array.length / limit)
  };
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined/null values from object
const cleanObject = (obj) => {
  const cleaned = {};
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        const nestedCleaned = cleanObject(obj[key]);
        if (Object.keys(nestedCleaned).length > 0) {
          cleaned[key] = nestedCleaned;
        }
      } else {
        cleaned[key] = obj[key];
      }
    }
  });
  
  return cleaned;
};

// Sleep function for delays
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
const retry = async (fn, maxAttempts = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate slug from string
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Check if object is empty
const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  hashString,
  formatTunisianPhone,
  isValidEmail,
  isValidTunisianPhone,
  convertMoistureToPercentage,
  calculateDistance,
  toRadians,
  formatDateForTunisia,
  getTimeDifference,
  sanitizeString,
  generateDeviceId,
  calculateWaterAmount,
  convertUnits,
  isValidTunisianCoordinates,
  generateResponse,
  paginateArray,
  deepClone,
  cleanObject,
  sleep,
  retry,
  formatFileSize,
  generateSlug,
  isEmpty
};
