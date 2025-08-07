const mongoose = require('mongoose');
const CONSTANTS = require('../config/constants');

const sensorSchema = new mongoose.Schema({
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm ID is required']
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Sensor name is required'],
    trim: true,
    maxlength: [50, 'Sensor name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Sensor type is required'],
    enum: Object.values(CONSTANTS.SENSOR_TYPES),
    default: CONSTANTS.SENSOR_TYPES.SOIL_MOISTURE
  },
  location: {
    x: {
      type: Number,
      required: [true, 'X coordinate is required'],
      min: [0, 'X coordinate cannot be negative']
    },
    y: {
      type: Number,
      required: [true, 'Y coordinate is required'],
      min: [0, 'Y coordinate cannot be negative']
    },
    zone: {
      type: String,
      trim: true
    },
    depth: {
      type: Number,
      min: [0, 'Depth cannot be negative'],
      default: 15 // cm
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  specifications: {
    model: {
      type: String,
      required: [true, 'Sensor model is required'],
      trim: true
    },
    manufacturer: {
      type: String,
      trim: true
    },
    version: {
      type: String,
      trim: true
    },
    range: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 100
      },
      unit: {
        type: String,
        default: '%'
      }
    },
    accuracy: {
      type: String,
      default: '±2%'
    },
    batteryCapacity: {
      type: Number,
      min: [0, 'Battery capacity cannot be negative'],
      default: 3000 // mAh
    },
    transmissionRange: {
      type: Number,
      min: [0, 'Transmission range cannot be negative'],
      default: 1000 // meters
    },
    operatingTemperature: {
      min: {
        type: Number,
        default: -20 // °C
      },
      max: {
        type: Number,
        default: 60 // °C
      }
    }
  },
  calibration: {
    dryValue: {
      type: Number,
      required: [true, 'Dry calibration value is required']
    },
    wetValue: {
      type: Number,
      required: [true, 'Wet calibration value is required']
    },
    lastCalibrated: {
      type: Date,
      required: [true, 'Last calibration date is required'],
      default: Date.now
    },
    calibratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      maxlength: [200, 'Calibration notes cannot exceed 200 characters']
    }
  },
  status: {
    type: String,
    enum: Object.values(CONSTANTS.SENSOR_STATUS),
    default: CONSTANTS.SENSOR_STATUS.ACTIVE
  },
  connectivity: {
    protocol: {
      type: String,
      enum: ['WiFi', 'LoRa', 'Bluetooth', 'Zigbee', '4G'],
      default: 'WiFi'
    },
    signalStrength: {
      type: Number,
      min: [-120, 'Signal strength cannot be less than -120 dBm'],
      max: [0, 'Signal strength cannot be greater than 0 dBm']
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    firmware: {
      version: String,
      lastUpdate: Date
    }
  },
  maintenance: {
    installDate: {
      type: Date,
      required: [true, 'Installation date is required'],
      default: Date.now
    },
    lastMaintenance: {
      type: Date,
      default: Date.now
    },
    nextMaintenance: {
      type: Date
    },
    maintenanceInterval: {
      type: Number,
      default: 90 // days
    },
    notes: [{
      date: {
        type: Date,
        default: Date.now
      },
      technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: {
        type: String,
        enum: ['installation', 'calibration', 'repair', 'replacement', 'cleaning'],
        required: true
      },
      description: {
        type: String,
        required: true,
        maxlength: [500, 'Maintenance description cannot exceed 500 characters']
      },
      cost: {
        type: Number,
        min: [0, 'Cost cannot be negative']
      }
    }]
  },
  alerts: {
    lowBattery: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        min: [0, 'Battery threshold cannot be negative'],
        max: [100, 'Battery threshold cannot exceed 100%'],
        default: 20
      }
    },
    offline: {
      enabled: {
        type: Boolean,
        default: true
      },
      timeout: {
        type: Number,
        min: [60, 'Offline timeout cannot be less than 60 seconds'],
        default: 300 // seconds
      }
    },
    moistureThreshold: {
      enabled: {
        type: Boolean,
        default: true
      },
      low: {
        type: Number,
        min: [0, 'Low moisture threshold cannot be negative'],
        max: [100, 'Low moisture threshold cannot exceed 100%'],
        default: 30
      },
      high: {
        type: Number,
        min: [0, 'High moisture threshold cannot be negative'],
        max: [100, 'High moisture threshold cannot exceed 100%'],
        default: 90
      }
    }
  },
  statistics: {
    totalReadings: {
      type: Number,
      default: 0
    },
    lastReading: {
      moistureLevel: Number,
      temperature: Number,
      batteryLevel: Number,
      timestamp: Date
    },
    averages: {
      moisture: {
        daily: Number,
        weekly: Number,
        monthly: Number
      },
      temperature: {
        daily: Number,
        weekly: Number,
        monthly: Number
      }
    },
    uptime: {
      type: Number,
      default: 100 // percentage
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
sensorSchema.index({ farmId: 1 });
sensorSchema.index({ deviceId: 1 }, { unique: true });
sensorSchema.index({ status: 1 });
sensorSchema.index({ 'connectivity.lastSeen': -1 });
sensorSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for battery status
sensorSchema.virtual('batteryStatus').get(function() {
  if (!this.statistics.lastReading?.batteryLevel) return 'unknown';
  
  const level = this.statistics.lastReading.batteryLevel;
  if (level <= CONSTANTS.BATTERY_THRESHOLDS.LOW) return 'low';
  if (level <= CONSTANTS.BATTERY_THRESHOLDS.WARNING) return 'warning';
  return 'good';
});

// Virtual for connection status
sensorSchema.virtual('connectionStatus').get(function() {
  if (!this.connectivity.lastSeen) return 'unknown';
  
  const timeDiff = Date.now() - this.connectivity.lastSeen.getTime();
  const timeoutMs = this.alerts.offline.timeout * 1000;
  
  return timeDiff > timeoutMs ? 'offline' : 'online';
});

// Virtual for maintenance status
sensorSchema.virtual('maintenanceStatus').get(function() {
  if (!this.maintenance.nextMaintenance) return 'unknown';
  
  const now = new Date();
  const nextMaintenance = this.maintenance.nextMaintenance;
  const daysDiff = Math.ceil((nextMaintenance - now) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 'overdue';
  if (daysDiff <= 7) return 'due_soon';
  return 'ok';
});

// Pre-save middleware to calculate next maintenance date
sensorSchema.pre('save', function(next) {
  if (this.isModified('maintenance.lastMaintenance') || this.isModified('maintenance.maintenanceInterval')) {
    const lastMaintenance = this.maintenance.lastMaintenance || this.maintenance.installDate;
    const intervalDays = this.maintenance.maintenanceInterval || 90;
    
    this.maintenance.nextMaintenance = new Date(
      lastMaintenance.getTime() + (intervalDays * 24 * 60 * 60 * 1000)
    );
  }
  next();
});

// Instance method to add maintenance record
sensorSchema.methods.addMaintenanceRecord = function(maintenanceData) {
  this.maintenance.notes.push(maintenanceData);
  this.maintenance.lastMaintenance = new Date();
  return this.save();
};

// Instance method to calibrate sensor
sensorSchema.methods.calibrate = function(dryValue, wetValue, userId, notes) {
  this.calibration = {
    dryValue,
    wetValue,
    lastCalibrated: new Date(),
    calibratedBy: userId,
    notes: notes || ''
  };
  
  // Add maintenance record
  this.maintenance.notes.push({
    type: 'calibration',
    description: `Sensor calibrated. Dry: ${dryValue}, Wet: ${wetValue}`,
    technician: userId
  });
  
  return this.save();
};

// Instance method to update statistics
sensorSchema.methods.updateStatistics = async function(readingData) {
  this.statistics.totalReadings += 1;
  this.statistics.lastReading = {
    moistureLevel: readingData.moistureLevel,
    temperature: readingData.temperature,
    batteryLevel: readingData.batteryLevel,
    timestamp: new Date()
  };
  
  this.connectivity.lastSeen = new Date();
  if (readingData.signalStrength) {
    this.connectivity.signalStrength = readingData.signalStrength;
  }
  
  return this.save();
};

// Static method to find sensors by farm
sensorSchema.statics.findByFarm = function(farmId) {
  return this.find({ farmId, isActive: true });
};

// Static method to find offline sensors
sensorSchema.statics.findOffline = function(timeoutMinutes = 5) {
  const cutoffTime = new Date(Date.now() - (timeoutMinutes * 60 * 1000));
  return this.find({
    'connectivity.lastSeen': { $lt: cutoffTime },
    status: CONSTANTS.SENSOR_STATUS.ACTIVE,
    isActive: true
  });
};

// Static method to find sensors needing maintenance
sensorSchema.statics.findNeedingMaintenance = function() {
  const now = new Date();
  return this.find({
    'maintenance.nextMaintenance': { $lte: now },
    status: { $ne: CONSTANTS.SENSOR_STATUS.MAINTENANCE },
    isActive: true
  });
};

module.exports = mongoose.model('Sensor', sensorSchema);
