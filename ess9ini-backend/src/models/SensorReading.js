const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  sensorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensor',
    required: [true, 'Sensor ID is required']
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm ID is required']
  },
  readings: {
    moistureLevel: {
      type: Number,
      required: [true, 'Moisture level is required'],
      min: [0, 'Moisture level cannot be negative'],
      max: [100, 'Moisture level cannot exceed 100%']
    },
    temperature: {
      type: Number,
      min: [-50, 'Temperature cannot be less than -50°C'],
      max: [80, 'Temperature cannot exceed 80°C']
    },
    humidity: {
      type: Number,
      min: [0, 'Humidity cannot be negative'],
      max: [100, 'Humidity cannot exceed 100%']
    },
    ph: {
      type: Number,
      min: [0, 'pH cannot be negative'],
      max: [14, 'pH cannot exceed 14']
    },
    lightIntensity: {
      type: Number,
      min: [0, 'Light intensity cannot be negative']
    },
    batteryLevel: {
      type: Number,
      required: [true, 'Battery level is required'],
      min: [0, 'Battery level cannot be negative'],
      max: [100, 'Battery level cannot exceed 100%']
    },
    signalStrength: {
      type: Number,
      min: [-120, 'Signal strength cannot be less than -120 dBm'],
      max: [0, 'Signal strength cannot be greater than 0 dBm']
    }
  },
  rawData: {
    moistureRaw: Number,
    temperatureRaw: Number,
    humidityRaw: Number,
    phRaw: Number,
    lightRaw: Number
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  processed: {
    type: Boolean,
    default: false
  },
  alerts: [{
    type: {
      type: String,
      enum: ['low_moisture', 'high_moisture', 'low_battery', 'sensor_error', 'calibration_needed'],
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
    acknowledged: {
      type: Boolean,
      default: false
    }
  }],
  metadata: {
    deviceInfo: {
      firmware: String,
      bootCount: Number,
      freeMemory: Number
    },
    networkInfo: {
      ssid: String,
      rssi: Number,
      ip: String
    },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    weather: {
      temperature: Number,
      humidity: Number,
      pressure: Number,
      windSpeed: Number
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
sensorReadingSchema.index({ sensorId: 1, timestamp: -1 });
sensorReadingSchema.index({ farmId: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: -1 });
sensorReadingSchema.index({ processed: 1 });
sensorReadingSchema.index({ 'alerts.acknowledged': 1 });

// TTL index to automatically delete old readings (keep for 1 year)
sensorReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for moisture status
sensorReadingSchema.virtual('moistureStatus').get(function() {
  const moisture = this.readings.moistureLevel;
  if (moisture <= 30) return 'critical';
  if (moisture <= 60) return 'low';
  if (moisture <= 80) return 'optimal';
  return 'high';
});

// Virtual for battery status
sensorReadingSchema.virtual('batteryStatus').get(function() {
  const battery = this.readings.batteryLevel;
  if (battery <= 20) return 'critical';
  if (battery <= 40) return 'low';
  if (battery <= 70) return 'good';
  return 'excellent';
});

// Virtual for signal quality
sensorReadingSchema.virtual('signalQuality').get(function() {
  const signal = this.readings.signalStrength;
  if (!signal) return 'unknown';
  if (signal >= -50) return 'excellent';
  if (signal >= -60) return 'good';
  if (signal >= -70) return 'fair';
  return 'poor';
});

// Pre-save middleware to determine data quality
sensorReadingSchema.pre('save', function(next) {
  let qualityScore = 100;
  
  // Check signal strength
  if (this.readings.signalStrength) {
    if (this.readings.signalStrength < -80) qualityScore -= 20;
    else if (this.readings.signalStrength < -70) qualityScore -= 10;
  }
  
  // Check battery level
  if (this.readings.batteryLevel < 20) qualityScore -= 15;
  else if (this.readings.batteryLevel < 40) qualityScore -= 5;
  
  // Check for missing optional readings
  if (!this.readings.temperature) qualityScore -= 5;
  if (!this.readings.humidity) qualityScore -= 5;
  
  // Determine quality based on score
  if (qualityScore >= 90) this.quality = 'excellent';
  else if (qualityScore >= 75) this.quality = 'good';
  else if (qualityScore >= 60) this.quality = 'fair';
  else this.quality = 'poor';
  
  next();
});

// Pre-save middleware to generate alerts
sensorReadingSchema.pre('save', async function(next) {
  try {
    const Sensor = mongoose.model('Sensor');
    const sensor = await Sensor.findById(this.sensorId);
    
    if (!sensor) return next();
    
    this.alerts = [];
    
    // Check moisture levels
    if (sensor.alerts.moistureThreshold.enabled) {
      if (this.readings.moistureLevel <= sensor.alerts.moistureThreshold.low) {
        this.alerts.push({
          type: 'low_moisture',
          severity: 'critical',
          message: `Critical moisture level: ${this.readings.moistureLevel}%`
        });
      } else if (this.readings.moistureLevel >= sensor.alerts.moistureThreshold.high) {
        this.alerts.push({
          type: 'high_moisture',
          severity: 'warning',
          message: `High moisture level: ${this.readings.moistureLevel}%`
        });
      }
    }
    
    // Check battery level
    if (sensor.alerts.lowBattery.enabled) {
      if (this.readings.batteryLevel <= sensor.alerts.lowBattery.threshold) {
        this.alerts.push({
          type: 'low_battery',
          severity: this.readings.batteryLevel <= 10 ? 'critical' : 'warning',
          message: `Low battery: ${this.readings.batteryLevel}%`
        });
      }
    }
    
    // Check for sensor errors (unrealistic values)
    if (this.readings.moistureLevel < 0 || this.readings.moistureLevel > 100) {
      this.alerts.push({
        type: 'sensor_error',
        severity: 'critical',
        message: 'Invalid moisture reading detected'
      });
    }
    
    // Check if calibration is needed (very old calibration)
    const daysSinceCalibration = (Date.now() - sensor.calibration.lastCalibrated) / (1000 * 60 * 60 * 24);
    if (daysSinceCalibration > 180) { // 6 months
      this.alerts.push({
        type: 'calibration_needed',
        severity: 'info',
        message: 'Sensor calibration is overdue'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update sensor statistics
sensorReadingSchema.post('save', async function(doc) {
  try {
    const Sensor = mongoose.model('Sensor');
    await Sensor.findByIdAndUpdate(doc.sensorId, {
      $inc: { 'statistics.totalReadings': 1 },
      $set: {
        'statistics.lastReading': {
          moistureLevel: doc.readings.moistureLevel,
          temperature: doc.readings.temperature,
          batteryLevel: doc.readings.batteryLevel,
          timestamp: doc.timestamp
        },
        'connectivity.lastSeen': doc.timestamp,
        'connectivity.signalStrength': doc.readings.signalStrength
      }
    });
  } catch (error) {
    console.error('Error updating sensor statistics:', error);
  }
});

// Static method to get latest readings for a sensor
sensorReadingSchema.statics.getLatestBySensor = function(sensorId, limit = 10) {
  return this.find({ sensorId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('sensorId', 'name deviceId location');
};

// Static method to get readings by farm
sensorReadingSchema.statics.getByFarm = function(farmId, startDate, endDate, limit = 100) {
  const query = { farmId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('sensorId', 'name deviceId location');
};

// Static method to get average readings for a time period
sensorReadingSchema.statics.getAverages = function(sensorId, startDate, endDate) {
  const matchStage = { sensorId: mongoose.Types.ObjectId(sensorId) };
  
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        avgMoisture: { $avg: '$readings.moistureLevel' },
        avgTemperature: { $avg: '$readings.temperature' },
        avgHumidity: { $avg: '$readings.humidity' },
        avgBattery: { $avg: '$readings.batteryLevel' },
        minMoisture: { $min: '$readings.moistureLevel' },
        maxMoisture: { $max: '$readings.moistureLevel' },
        count: { $sum: 1 },
        firstReading: { $min: '$timestamp' },
        lastReading: { $max: '$timestamp' }
      }
    }
  ]);
};

// Static method to get unprocessed readings
sensorReadingSchema.statics.getUnprocessed = function(limit = 100) {
  return this.find({ processed: false })
    .sort({ timestamp: 1 })
    .limit(limit);
};

// Static method to mark readings as processed
sensorReadingSchema.statics.markAsProcessed = function(readingIds) {
  return this.updateMany(
    { _id: { $in: readingIds } },
    { $set: { processed: true } }
  );
};

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
