// Application constants
const CONSTANTS = {
  // User roles
  USER_ROLES: {
    FARMER: 'farmer',
    ADMIN: 'admin',
    TECHNICIAN: 'technician'
  },

  // Sensor types
  SENSOR_TYPES: {
    SOIL_MOISTURE: 'soil_moisture',
    TEMPERATURE: 'temperature',
    HUMIDITY: 'humidity',
    PH: 'ph',
    LIGHT: 'light'
  },

  // Sensor status
  SENSOR_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    MAINTENANCE: 'maintenance',
    OFFLINE: 'offline'
  },

  // Irrigation types
  IRRIGATION_TYPES: {
    MANUAL: 'manual',
    SCHEDULED: 'scheduled',
    AUTOMATIC: 'automatic'
  },

  // Irrigation status
  IRRIGATION_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  // Alert types
  ALERT_TYPES: {
    CRITICAL: 'critical',
    WARNING: 'warning',
    INFO: 'info'
  },

  // Alert categories
  ALERT_CATEGORIES: {
    MOISTURE: 'moisture',
    BATTERY: 'battery',
    SENSOR: 'sensor',
    WEATHER: 'weather',
    SYSTEM: 'system',
    IRRIGATION: 'irrigation'
  },

  // Alert status
  ALERT_STATUS: {
    ACTIVE: 'active',
    ACKNOWLEDGED: 'acknowledged',
    RESOLVED: 'resolved'
  },

  // Crop types (Tunisian context)
  CROP_TYPES: {
    OLIVE_TREES: 'olive_trees',
    DATE_PALMS: 'date_palms',
    CEREALS: 'cereals',
    CITRUS: 'citrus',
    VEGETABLES: 'vegetables',
    ALMONDS: 'almonds'
  },

  // Soil types
  SOIL_TYPES: {
    CLAY: 'clay',
    SANDY: 'sandy',
    LOAM: 'loam',
    CLAY_LOAM: 'clay_loam',
    SANDY_LOAM: 'sandy_loam',
    SILT_LOAM: 'silt_loam'
  },

  // Irrigation systems
  IRRIGATION_SYSTEMS: {
    DRIP: 'drip',
    SPRINKLER: 'sprinkler',
    FLOOD: 'flood',
    MICRO_SPRAY: 'micro_spray'
  },

  // Languages
  LANGUAGES: {
    ARABIC: 'ar',
    ENGLISH: 'en',
    FRENCH: 'fr'
  },

  // Units
  UNITS: {
    METRIC: 'metric',
    IMPERIAL: 'imperial'
  },

  // Themes
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  },

  // Moisture thresholds (percentage)
  MOISTURE_THRESHOLDS: {
    CRITICAL: 30,
    WARNING: 60,
    OPTIMAL: 80
  },

  // Battery thresholds (percentage)
  BATTERY_THRESHOLDS: {
    LOW: 20,
    WARNING: 40,
    GOOD: 70
  },

  // File upload limits
  FILE_LIMITS: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // Time intervals (milliseconds)
  INTERVALS: {
    SENSOR_UPDATE: 30000, // 30 seconds
    WEATHER_UPDATE: 300000, // 5 minutes
    AI_PREDICTION: 600000, // 10 minutes
    ALERT_CHECK: 60000 // 1 minute
  },

  // Tunisian specific
  TUNISIA: {
    TIMEZONE: 'Africa/Tunis',
    CURRENCY: 'TND',
    PHONE_PREFIX: '+216',
    REGIONS: [
      'Tunis',
      'Ariana',
      'Ben Arous',
      'Manouba',
      'Nabeul',
      'Zaghouan',
      'Bizerte',
      'Béja',
      'Jendouba',
      'Kef',
      'Siliana',
      'Kairouan',
      'Kasserine',
      'Sidi Bouzid',
      'Sousse',
      'Monastir',
      'Mahdia',
      'Sfax',
      'Gabès',
      'Medenine',
      'Tataouine',
      'Gafsa',
      'Tozeur',
      'Kebili'
    ]
  },

  // API Response messages
  MESSAGES: {
    SUCCESS: {
      CREATED: 'Resource created successfully',
      UPDATED: 'Resource updated successfully',
      DELETED: 'Resource deleted successfully',
      RETRIEVED: 'Resource retrieved successfully'
    },
    ERROR: {
      NOT_FOUND: 'Resource not found',
      UNAUTHORIZED: 'Unauthorized access',
      FORBIDDEN: 'Access forbidden',
      VALIDATION: 'Validation error',
      SERVER_ERROR: 'Internal server error',
      DUPLICATE: 'Resource already exists'
    }
  }
};

module.exports = CONSTANTS;
