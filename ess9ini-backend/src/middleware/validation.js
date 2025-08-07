const { body, param, query, validationResult } = require('express-validator');
const { formatValidationErrors } = require('./errorHandler');
const CONSTANTS = require('../config/constants');

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formatValidationErrors(errors),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  name: (field) => body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/)
    .withMessage(`${field} can only contain letters and spaces`),
    
  phone: body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
    
  mongoId: (field) => param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`),
    
  coordinates: {
    latitude: body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    longitude: body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  }
};

// User validation rules
const userValidations = {
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.phone,
    body('role')
      .optional()
      .isIn(Object.values(CONSTANTS.USER_ROLES))
      .withMessage('Invalid user role'),
    body('language')
      .optional()
      .isIn(Object.values(CONSTANTS.LANGUAGES))
      .withMessage('Invalid language'),
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  updateProfile: [
    commonValidations.name('firstName').optional(),
    commonValidations.name('lastName').optional(),
    commonValidations.phone,
    body('language')
      .optional()
      .isIn(Object.values(CONSTANTS.LANGUAGES))
      .withMessage('Invalid language'),
    body('profile.bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('profile.preferences.units')
      .optional()
      .isIn(Object.values(CONSTANTS.UNITS))
      .withMessage('Invalid units preference'),
    body('profile.preferences.theme')
      .optional()
      .isIn(Object.values(CONSTANTS.THEMES))
      .withMessage('Invalid theme preference'),
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password.custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

// Farm validation rules
const farmValidations = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Farm name must be between 2 and 100 characters'),
    body('nameEn')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('English name cannot exceed 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('location.address')
      .trim()
      .notEmpty()
      .withMessage('Farm address is required'),
    body('location.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    body('location.region')
      .isIn(CONSTANTS.TUNISIA.REGIONS)
      .withMessage('Invalid region'),
    commonValidations.coordinates.latitude.custom((value, { req }) => {
      req.body.location = req.body.location || {};
      req.body.location.coordinates = req.body.location.coordinates || {};
      req.body.location.coordinates.latitude = value;
      return true;
    }),
    commonValidations.coordinates.longitude.custom((value, { req }) => {
      req.body.location.coordinates.longitude = value;
      return true;
    }),
    body('location.area')
      .isFloat({ min: 0.1 })
      .withMessage('Farm area must be at least 0.1 hectares'),
    body('primaryCrop')
      .isIn(Object.values(CONSTANTS.CROP_TYPES))
      .withMessage('Invalid primary crop type'),
    body('soilType')
      .isIn(Object.values(CONSTANTS.SOIL_TYPES))
      .withMessage('Invalid soil type'),
    body('irrigationSystem')
      .isIn(Object.values(CONSTANTS.IRRIGATION_SYSTEMS))
      .withMessage('Invalid irrigation system'),
    body('establishedDate')
      .isISO8601()
      .withMessage('Invalid establishment date'),
    body('targetMoisture')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Target moisture must be between 0 and 100%'),
    handleValidationErrors
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Farm name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('targetMoisture')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Target moisture must be between 0 and 100%'),
    handleValidationErrors
  ],
  
  addZone: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Zone name is required'),
    body('area')
      .isFloat({ min: 0.01 })
      .withMessage('Zone area must be at least 0.01 hectares'),
    body('cropType')
      .isIn(Object.values(CONSTANTS.CROP_TYPES))
      .withMessage('Invalid crop type'),
    body('soilType')
      .optional()
      .isIn(Object.values(CONSTANTS.SOIL_TYPES))
      .withMessage('Invalid soil type'),
    body('irrigationSystem')
      .optional()
      .isIn(Object.values(CONSTANTS.IRRIGATION_SYSTEMS))
      .withMessage('Invalid irrigation system'),
    body('targetMoisture')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Target moisture must be between 0 and 100%'),
    handleValidationErrors
  ]
};

// Sensor validation rules
const sensorValidations = {
  create: [
    body('deviceId')
      .trim()
      .notEmpty()
      .withMessage('Device ID is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Device ID must be between 3 and 20 characters')
      .matches(/^[A-Z0-9_]+$/)
      .withMessage('Device ID can only contain uppercase letters, numbers, and underscores'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Sensor name must be between 2 and 50 characters'),
    body('type')
      .optional()
      .isIn(Object.values(CONSTANTS.SENSOR_TYPES))
      .withMessage('Invalid sensor type'),
    body('location.x')
      .isFloat({ min: 0 })
      .withMessage('X coordinate must be a positive number'),
    body('location.y')
      .isFloat({ min: 0 })
      .withMessage('Y coordinate must be a positive number'),
    body('location.zone')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Zone name cannot be empty'),
    body('location.depth')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Depth must be a positive number'),
    body('specifications.model')
      .trim()
      .notEmpty()
      .withMessage('Sensor model is required'),
    body('calibration.dryValue')
      .isNumeric()
      .withMessage('Dry calibration value must be a number'),
    body('calibration.wetValue')
      .isNumeric()
      .withMessage('Wet calibration value must be a number'),
    handleValidationErrors
  ],
  
  addReading: [
    body('readings.moistureLevel')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Moisture level must be between 0 and 100%'),
    body('readings.temperature')
      .optional()
      .isFloat({ min: -50, max: 80 })
      .withMessage('Temperature must be between -50 and 80°C'),
    body('readings.humidity')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Humidity must be between 0 and 100%'),
    body('readings.batteryLevel')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Battery level must be between 0 and 100%'),
    body('readings.signalStrength')
      .optional()
      .isFloat({ min: -120, max: 0 })
      .withMessage('Signal strength must be between -120 and 0 dBm'),
    body('timestamp')
      .optional()
      .isISO8601()
      .withMessage('Invalid timestamp format'),
    handleValidationErrors
  ],
  
  calibrate: [
    body('dryValue')
      .isNumeric()
      .withMessage('Dry value must be a number'),
    body('wetValue')
      .isNumeric()
      .withMessage('Wet value must be a number'),
    body('notes')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Notes cannot exceed 200 characters'),
    handleValidationErrors
  ]
};

// Irrigation validation rules
const irrigationValidations = {
  start: [
    body('zones')
      .isArray({ min: 1 })
      .withMessage('At least one zone is required'),
    body('zones.*')
      .isInt({ min: 1 })
      .withMessage('Zone numbers must be positive integers'),
    body('duration')
      .isInt({ min: 1, max: 480 })
      .withMessage('Duration must be between 1 and 480 minutes'),
    body('type')
      .optional()
      .isIn(Object.values(CONSTANTS.IRRIGATION_TYPES))
      .withMessage('Invalid irrigation type'),
    body('startTime')
      .optional()
      .isISO8601()
      .withMessage('Invalid start time format'),
    body('waterAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Water amount must be a positive number'),
    handleValidationErrors
  ],
  
  complete: [
    body('waterUsed')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Water used must be a positive number'),
    body('moistureReadings')
      .optional()
      .isArray()
      .withMessage('Moisture readings must be an array'),
    body('moistureReadings.*.zone')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Zone number must be a positive integer'),
    body('moistureReadings.*.beforeMoisture')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Before moisture must be between 0 and 100%'),
    body('moistureReadings.*.afterMoisture')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('After moisture must be between 0 and 100%'),
    handleValidationErrors
  ]
};

// Query parameter validations
const queryValidations = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: CONSTANTS.PAGINATION.MAX_LIMIT })
      .withMessage(`Limit must be between 1 and ${CONSTANTS.PAGINATION.MAX_LIMIT}`),
    handleValidationErrors
  ],
  
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  userValidations,
  farmValidations,
  sensorValidations,
  irrigationValidations,
  queryValidations
};
