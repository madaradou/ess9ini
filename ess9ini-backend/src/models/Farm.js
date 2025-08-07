const mongoose = require('mongoose');
const CONSTANTS = require('../config/constants');

const farmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Farm name is required'],
    trim: true,
    maxlength: [100, 'Farm name cannot exceed 100 characters']
  },
  nameEn: {
    type: String,
    trim: true,
    maxlength: [100, 'English name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farm owner is required']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Farm address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      enum: CONSTANTS.TUNISIA.REGIONS
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    area: {
      type: Number,
      required: [true, 'Farm area is required'],
      min: [0.1, 'Farm area must be at least 0.1 hectares']
    },
    zones: [{
      id: {
        type: Number,
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      area: {
        type: Number,
        required: true,
        min: [0.01, 'Zone area must be at least 0.01 hectares']
      },
      cropType: {
        type: String,
        required: true,
        enum: Object.values(CONSTANTS.CROP_TYPES)
      },
      soilType: {
        type: String,
        enum: Object.values(CONSTANTS.SOIL_TYPES)
      },
      irrigationSystem: {
        type: String,
        enum: Object.values(CONSTANTS.IRRIGATION_SYSTEMS)
      },
      targetMoisture: {
        type: Number,
        min: [0, 'Target moisture cannot be negative'],
        max: [100, 'Target moisture cannot exceed 100%'],
        default: 80
      }
    }]
  },
  cropTypes: [{
    type: String,
    enum: Object.values(CONSTANTS.CROP_TYPES)
  }],
  primaryCrop: {
    type: String,
    enum: Object.values(CONSTANTS.CROP_TYPES),
    required: [true, 'Primary crop type is required']
  },
  soilType: {
    type: String,
    enum: Object.values(CONSTANTS.SOIL_TYPES),
    required: [true, 'Soil type is required']
  },
  irrigationSystem: {
    type: String,
    enum: Object.values(CONSTANTS.IRRIGATION_SYSTEMS),
    required: [true, 'Irrigation system is required']
  },
  establishedDate: {
    type: Date,
    required: [true, 'Farm establishment date is required']
  },
  targetMoisture: {
    type: Number,
    min: [0, 'Target moisture cannot be negative'],
    max: [100, 'Target moisture cannot exceed 100%'],
    default: 80
  },
  settings: {
    autoIrrigation: {
      enabled: {
        type: Boolean,
        default: false
      },
      schedule: [{
        time: String, // Format: "HH:MM"
        duration: Number, // minutes
        zones: [Number],
        days: [String] // ['monday', 'tuesday', etc.]
      }],
      moistureThreshold: {
        type: Number,
        min: [0, 'Moisture threshold cannot be negative'],
        max: [100, 'Moisture threshold cannot exceed 100%'],
        default: 40
      }
    },
    alerts: {
      lowMoisture: {
        enabled: { type: Boolean, default: true },
        threshold: { type: Number, default: 30 }
      },
      lowBattery: {
        enabled: { type: Boolean, default: true },
        threshold: { type: Number, default: 20 }
      },
      sensorOffline: {
        enabled: { type: Boolean, default: true },
        timeout: { type: Number, default: 300 } // seconds
      }
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  statistics: {
    totalSensors: {
      type: Number,
      default: 0
    },
    activeSensors: {
      type: Number,
      default: 0
    },
    totalIrrigationEvents: {
      type: Number,
      default: 0
    },
    totalWaterUsed: {
      type: Number,
      default: 0 // in liters
    },
    averageMoisture: {
      type: Number,
      default: 0
    },
    lastIrrigation: {
      type: Date,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
farmSchema.index({ owner: 1 });
farmSchema.index({ 'location.region': 1 });
farmSchema.index({ primaryCrop: 1 });
farmSchema.index({ isActive: 1 });
farmSchema.index({ createdAt: -1 });
farmSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries

// Virtual for total area calculation
farmSchema.virtual('totalZoneArea').get(function() {
  return this.location.zones.reduce((total, zone) => total + zone.area, 0);
});

// Virtual for sensor count
farmSchema.virtual('sensorCount', {
  ref: 'Sensor',
  localField: '_id',
  foreignField: 'farmId',
  count: true
});

// Virtual for active sensor count
farmSchema.virtual('activeSensorCount', {
  ref: 'Sensor',
  localField: '_id',
  foreignField: 'farmId',
  match: { status: CONSTANTS.SENSOR_STATUS.ACTIVE },
  count: true
});

// Pre-save middleware to validate zones
farmSchema.pre('save', function(next) {
  // Ensure zone IDs are unique
  const zoneIds = this.location.zones.map(zone => zone.id);
  const uniqueZoneIds = [...new Set(zoneIds)];
  
  if (zoneIds.length !== uniqueZoneIds.length) {
    return next(new Error('Zone IDs must be unique'));
  }

  // Validate total zone area doesn't exceed farm area
  const totalZoneArea = this.location.zones.reduce((total, zone) => total + zone.area, 0);
  if (totalZoneArea > this.location.area * 1.1) { // Allow 10% tolerance
    return next(new Error('Total zone area cannot exceed farm area'));
  }

  next();
});

// Instance method to add zone
farmSchema.methods.addZone = function(zoneData) {
  const nextId = this.location.zones.length > 0 
    ? Math.max(...this.location.zones.map(z => z.id)) + 1 
    : 1;
  
  this.location.zones.push({
    id: nextId,
    ...zoneData
  });
  
  return this.save();
};

// Instance method to remove zone
farmSchema.methods.removeZone = function(zoneId) {
  this.location.zones = this.location.zones.filter(zone => zone.id !== zoneId);
  return this.save();
};

// Instance method to update statistics
farmSchema.methods.updateStatistics = async function() {
  const Sensor = mongoose.model('Sensor');
  const IrrigationEvent = mongoose.model('IrrigationEvent');
  const SensorReading = mongoose.model('SensorReading');

  // Count sensors
  const totalSensors = await Sensor.countDocuments({ farmId: this._id });
  const activeSensors = await Sensor.countDocuments({ 
    farmId: this._id, 
    status: CONSTANTS.SENSOR_STATUS.ACTIVE 
  });

  // Count irrigation events
  const totalIrrigationEvents = await IrrigationEvent.countDocuments({ farmId: this._id });

  // Calculate total water used
  const irrigationStats = await IrrigationEvent.aggregate([
    { $match: { farmId: this._id, status: CONSTANTS.IRRIGATION_STATUS.COMPLETED } },
    { $group: { _id: null, totalWater: { $sum: '$results.waterUsed' } } }
  ]);

  // Calculate average moisture
  const moistureStats = await SensorReading.aggregate([
    { $match: { farmId: this._id } },
    { $sort: { timestamp: -1 } },
    { $limit: activeSensors * 10 }, // Last 10 readings per sensor
    { $group: { _id: null, avgMoisture: { $avg: '$readings.moistureLevel' } } }
  ]);

  // Get last irrigation
  const lastIrrigation = await IrrigationEvent.findOne(
    { farmId: this._id },
    {},
    { sort: { startTime: -1 } }
  );

  // Update statistics
  this.statistics = {
    totalSensors,
    activeSensors,
    totalIrrigationEvents,
    totalWaterUsed: irrigationStats[0]?.totalWater || 0,
    averageMoisture: Math.round(moistureStats[0]?.avgMoisture || 0),
    lastIrrigation: lastIrrigation?.startTime || null
  };

  return this.save();
};

// Static method to find farms by region
farmSchema.statics.findByRegion = function(region) {
  return this.find({ 'location.region': region, isActive: true });
};

// Static method to find farms by crop type
farmSchema.statics.findByCropType = function(cropType) {
  return this.find({ primaryCrop: cropType, isActive: true });
};

module.exports = mongoose.model('Farm', farmSchema);
