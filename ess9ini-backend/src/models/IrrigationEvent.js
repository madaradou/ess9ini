const mongoose = require('mongoose');
const CONSTANTS = require('../config/constants');

const irrigationEventSchema = new mongoose.Schema({
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: Object.values(CONSTANTS.IRRIGATION_TYPES),
    required: [true, 'Irrigation type is required']
  },
  zones: [{
    type: Number,
    required: [true, 'At least one zone is required'],
    min: [1, 'Zone number must be positive']
  }],
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 8 hours'] // minutes
  },
  waterAmount: {
    planned: {
      type: Number,
      required: [true, 'Planned water amount is required'],
      min: [0, 'Water amount cannot be negative'] // liters
    },
    actual: {
      type: Number,
      min: [0, 'Actual water amount cannot be negative'],
      default: 0
    }
  },
  schedule: {
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date
    },
    actualStartTime: {
      type: Date
    },
    actualEndTime: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: Object.values(CONSTANTS.IRRIGATION_STATUS),
    default: CONSTANTS.IRRIGATION_STATUS.PENDING
  },
  trigger: {
    reason: {
      type: String,
      enum: [
        'manual',
        'scheduled',
        'low_moisture',
        'ai_recommendation',
        'weather_forecast',
        'crop_stage',
        'emergency'
      ],
      required: [true, 'Trigger reason is required']
    },
    sensorReadings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SensorReading'
    }],
    aiRecommendation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIPrediction'
    },
    weatherData: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      windSpeed: Number,
      forecast: String
    },
    moistureLevels: [{
      zone: Number,
      sensorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor'
      },
      moistureLevel: Number,
      timestamp: Date
    }]
  },
  settings: {
    flowRate: {
      type: Number,
      min: [0, 'Flow rate cannot be negative'],
      default: 5 // liters per minute
    },
    pressure: {
      type: Number,
      min: [0, 'Pressure cannot be negative'],
      default: 2.5 // bar
    },
    temperature: {
      type: Number,
      min: [0, 'Water temperature cannot be negative'],
      max: [50, 'Water temperature cannot exceed 50°C']
    },
    fertilizer: {
      enabled: {
        type: Boolean,
        default: false
      },
      type: String,
      concentration: Number, // ppm
      amount: Number // ml
    }
  },
  results: {
    waterUsed: {
      type: Number,
      min: [0, 'Water used cannot be negative'],
      default: 0
    },
    efficiency: {
      type: Number,
      min: [0, 'Efficiency cannot be negative'],
      max: [100, 'Efficiency cannot exceed 100%']
    },
    moistureIncrease: [{
      zone: Number,
      sensorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor'
      },
      beforeMoisture: Number,
      afterMoisture: Number,
      increase: Number,
      timestamp: Date
    }],
    coverage: {
      type: Number,
      min: [0, 'Coverage cannot be negative'],
      max: [100, 'Coverage cannot exceed 100%']
    },
    uniformity: {
      type: Number,
      min: [0, 'Uniformity cannot be negative'],
      max: [100, 'Uniformity cannot exceed 100%']
    }
  },
  monitoring: {
    sensors: [{
      sensorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor'
      },
      readings: [{
        timestamp: Date,
        moistureLevel: Number,
        temperature: Number
      }]
    }],
    flowMeter: [{
      timestamp: Date,
      flow: Number, // liters per minute
      totalVolume: Number, // liters
      pressure: Number // bar
    }],
    weather: [{
      timestamp: Date,
      temperature: Number,
      humidity: Number,
      windSpeed: Number,
      rainfall: Number
    }]
  },
  alerts: [{
    type: {
      type: String,
      enum: ['low_pressure', 'high_flow', 'sensor_offline', 'system_error', 'water_shortage'],
      required: true
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  cost: {
    water: {
      type: Number,
      min: [0, 'Water cost cannot be negative'],
      default: 0
    },
    electricity: {
      type: Number,
      min: [0, 'Electricity cost cannot be negative'],
      default: 0
    },
    fertilizer: {
      type: Number,
      min: [0, 'Fertilizer cost cannot be negative'],
      default: 0
    },
    total: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
irrigationEventSchema.index({ farmId: 1, 'schedule.startTime': -1 });
irrigationEventSchema.index({ userId: 1, createdAt: -1 });
irrigationEventSchema.index({ status: 1 });
irrigationEventSchema.index({ type: 1 });
irrigationEventSchema.index({ 'schedule.startTime': -1 });

// Virtual for actual duration
irrigationEventSchema.virtual('actualDuration').get(function() {
  if (!this.schedule.actualStartTime || !this.schedule.actualEndTime) return null;
  return Math.round((this.schedule.actualEndTime - this.schedule.actualStartTime) / (1000 * 60)); // minutes
});

// Virtual for water efficiency
irrigationEventSchema.virtual('waterEfficiency').get(function() {
  if (!this.waterAmount.planned || !this.results.waterUsed) return null;
  return Math.round((this.results.waterUsed / this.waterAmount.planned) * 100);
});

// Virtual for average moisture increase
irrigationEventSchema.virtual('avgMoistureIncrease').get(function() {
  if (!this.results.moistureIncrease || this.results.moistureIncrease.length === 0) return null;
  const total = this.results.moistureIncrease.reduce((sum, item) => sum + (item.increase || 0), 0);
  return Math.round(total / this.results.moistureIncrease.length);
});

// Pre-save middleware to calculate end time and water amount
irrigationEventSchema.pre('save', function(next) {
  // Calculate scheduled end time
  if (this.schedule.startTime && this.duration && !this.schedule.endTime) {
    this.schedule.endTime = new Date(
      this.schedule.startTime.getTime() + (this.duration * 60 * 1000)
    );
  }
  
  // Calculate planned water amount if not provided
  if (!this.waterAmount.planned && this.duration && this.settings.flowRate) {
    this.waterAmount.planned = this.duration * this.settings.flowRate * this.zones.length;
  }
  
  // Calculate total cost
  this.cost.total = (this.cost.water || 0) + (this.cost.electricity || 0) + (this.cost.fertilizer || 0);
  
  next();
});

// Pre-save middleware to validate zones
irrigationEventSchema.pre('save', async function(next) {
  try {
    const Farm = mongoose.model('Farm');
    const farm = await Farm.findById(this.farmId);
    
    if (!farm) {
      return next(new Error('Farm not found'));
    }
    
    // Check if all zones exist in the farm
    const farmZoneIds = farm.location.zones.map(zone => zone.id);
    const invalidZones = this.zones.filter(zoneId => !farmZoneIds.includes(zoneId));
    
    if (invalidZones.length > 0) {
      return next(new Error(`Invalid zones: ${invalidZones.join(', ')}`));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to start irrigation
irrigationEventSchema.methods.start = function() {
  this.status = CONSTANTS.IRRIGATION_STATUS.RUNNING;
  this.schedule.actualStartTime = new Date();
  return this.save();
};

// Instance method to complete irrigation
irrigationEventSchema.methods.complete = function(waterUsed, moistureReadings) {
  this.status = CONSTANTS.IRRIGATION_STATUS.COMPLETED;
  this.schedule.actualEndTime = new Date();
  
  if (waterUsed) {
    this.results.waterUsed = waterUsed;
    this.results.efficiency = Math.round((waterUsed / this.waterAmount.planned) * 100);
  }
  
  if (moistureReadings && moistureReadings.length > 0) {
    this.results.moistureIncrease = moistureReadings;
  }
  
  return this.save();
};

// Instance method to cancel irrigation
irrigationEventSchema.methods.cancel = function(reason) {
  this.status = CONSTANTS.IRRIGATION_STATUS.CANCELLED;
  this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  return this.save();
};

// Instance method to add alert
irrigationEventSchema.methods.addAlert = function(type, severity, message) {
  this.alerts.push({
    type,
    severity,
    message,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get active irrigations
irrigationEventSchema.statics.getActive = function() {
  return this.find({
    status: { $in: [CONSTANTS.IRRIGATION_STATUS.PENDING, CONSTANTS.IRRIGATION_STATUS.RUNNING] }
  }).populate('farmId userId');
};

// Static method to get irrigation history for a farm
irrigationEventSchema.statics.getHistoryByFarm = function(farmId, startDate, endDate, limit = 50) {
  const query = { farmId };
  
  if (startDate || endDate) {
    query['schedule.startTime'] = {};
    if (startDate) query['schedule.startTime'].$gte = new Date(startDate);
    if (endDate) query['schedule.startTime'].$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ 'schedule.startTime': -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName')
    .populate('farmId', 'name');
};

// Static method to get irrigation statistics
irrigationEventSchema.statics.getStatistics = function(farmId, startDate, endDate) {
  const matchStage = { farmId: mongoose.Types.ObjectId(farmId) };
  
  if (startDate || endDate) {
    matchStage['schedule.startTime'] = {};
    if (startDate) matchStage['schedule.startTime'].$gte = new Date(startDate);
    if (endDate) matchStage['schedule.startTime'].$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        totalWaterUsed: { $sum: '$results.waterUsed' },
        totalWaterPlanned: { $sum: '$waterAmount.planned' },
        avgDuration: { $avg: '$duration' },
        avgEfficiency: { $avg: '$results.efficiency' },
        completedEvents: {
          $sum: {
            $cond: [{ $eq: ['$status', CONSTANTS.IRRIGATION_STATUS.COMPLETED] }, 1, 0]
          }
        },
        failedEvents: {
          $sum: {
            $cond: [{ $eq: ['$status', CONSTANTS.IRRIGATION_STATUS.FAILED] }, 1, 0]
          }
        },
        totalCost: { $sum: '$cost.total' }
      }
    }
  ]);
};

module.exports = mongoose.model('IrrigationEvent', irrigationEventSchema);
