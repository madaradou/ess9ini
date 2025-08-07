# Ess9ini Database Schema Design

## Collections Overview

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  email: "farmer@example.com",
  password: "hashed_password",
  firstName: "Ahmed",
  lastName: "Ben Ali",
  role: "farmer", // farmer, admin, technician
  farmId: ObjectId, // Reference to farms collection
  phone: "+216 XX XXX XXX",
  language: "ar", // ar, en, fr
  isActive: true,
  emailVerified: false,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date,
  profile: {
    avatar: "url_to_image",
    notifications: {
      email: true,
      sms: true,
      push: true
    },
    preferences: {
      units: "metric", // metric, imperial
      timezone: "Africa/Tunis",
      theme: "light" // light, dark
    }
  }
}
```

### 2. Farms Collection
```javascript
{
  _id: ObjectId,
  name: "مزرعة الزياتين",
  nameEn: "Olive Farm",
  location: {
    address: "Gabès, Tunisia",
    coordinates: {
      latitude: 33.8815,
      longitude: 10.0982
    },
    area: 12.5, // hectares
    zones: [
      {
        id: 1,
        name: "North Field",
        area: 3.2,
        cropType: "olive_trees"
      }
    ]
  },
  owner: ObjectId, // Reference to users collection
  cropTypes: ["olive_trees", "date_palms"],
  establishedDate: Date,
  soilType: "clay_loam",
  irrigationSystem: "drip",
  targetMoisture: 80,
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Sensors Collection
```javascript
{
  _id: ObjectId,
  farmId: ObjectId,
  deviceId: "ESP32_001",
  name: "Sensor 1",
  type: "soil_moisture",
  location: {
    x: 80,
    y: 60,
    zone: "North Field",
    coordinates: {
      latitude: 33.8815,
      longitude: 10.0982
    }
  },
  specifications: {
    model: "Capacitive Soil Moisture v1.2",
    range: "0-100%",
    accuracy: "±2%",
    batteryCapacity: 3000 // mAh
  },
  calibration: {
    dryValue: 595,
    wetValue: 239,
    lastCalibrated: Date
  },
  status: "active", // active, inactive, maintenance, offline
  installDate: Date,
  lastMaintenance: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Sensor Readings Collection
```javascript
{
  _id: ObjectId,
  sensorId: ObjectId,
  farmId: ObjectId,
  readings: {
    moistureLevel: 45.2,
    temperature: 22.5,
    humidity: 65.3,
    batteryLevel: 85,
    signalStrength: -67 // dBm
  },
  timestamp: Date,
  quality: "good", // good, fair, poor
  processed: false,
  createdAt: Date
}
```

### 5. Irrigation Events Collection
```javascript
{
  _id: ObjectId,
  farmId: ObjectId,
  userId: ObjectId, // Who triggered it
  type: "manual", // manual, scheduled, automatic
  zones: [1, 2, 3],
  duration: 30, // minutes
  waterAmount: 150, // liters
  startTime: Date,
  endTime: Date,
  status: "completed", // pending, running, completed, failed
  trigger: {
    reason: "low_moisture",
    sensorReadings: [ObjectId],
    aiRecommendation: ObjectId
  },
  results: {
    waterUsed: 145,
    moistureIncrease: 15.3,
    efficiency: 92.5
  },
  createdAt: Date
}
```

### 6. AI Predictions Collection
```javascript
{
  _id: ObjectId,
  farmId: ObjectId,
  predictionType: "irrigation",
  inputData: {
    sensorReadings: [ObjectId],
    weatherData: ObjectId,
    cropType: "olive_trees",
    soilType: "clay_loam"
  },
  prediction: {
    recommendation: "irrigate_now",
    amount: 25, // mm
    timing: "early_morning",
    confidence: 0.87,
    reasoning: "Soil moisture below optimal, weather forecast shows no rain"
  },
  accuracy: null, // Filled after validation
  isImplemented: false,
  validatedAt: null,
  createdAt: Date,
  expiresAt: Date
}
```

### 7. Weather Data Collection
```javascript
{
  _id: ObjectId,
  location: "Gabès, Tunisia",
  source: "openweathermap",
  current: {
    temperature: 23.5,
    humidity: 65,
    pressure: 1013.25,
    windSpeed: 12.5,
    windDirection: 180,
    rainfall: 0,
    uvIndex: 6
  },
  forecast: [
    {
      date: Date,
      tempMin: 18,
      tempMax: 28,
      humidity: 70,
      rainfall: 2.5,
      windSpeed: 15
    }
  ],
  timestamp: Date,
  createdAt: Date
}
```

### 8. Alerts Collection
```javascript
{
  _id: ObjectId,
  farmId: ObjectId,
  userId: ObjectId,
  type: "critical", // critical, warning, info
  category: "moisture", // moisture, battery, sensor, weather, system
  title: "Critical Moisture Level",
  message: "Sensor 3 moisture critically low (25%)",
  source: {
    type: "sensor",
    id: ObjectId,
    reading: ObjectId
  },
  status: "active", // active, acknowledged, resolved
  priority: 1, // 1-5 (1 = highest)
  acknowledgedBy: ObjectId,
  acknowledgedAt: Date,
  resolvedAt: Date,
  actions: [
    {
      type: "irrigation",
      status: "pending",
      scheduledAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### 9. User Sessions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  sessionToken: "jwt_token_hash",
  deviceInfo: {
    userAgent: "Mozilla/5.0...",
    ip: "192.168.1.100",
    location: "Gabès, Tunisia"
  },
  isActive: true,
  expiresAt: Date,
  createdAt: Date
}
```

## Relationships

### One-to-Many Relationships
- Users → Farms (one user can own multiple farms)
- Farms → Sensors (one farm has multiple sensors)
- Sensors → Sensor Readings (one sensor generates many readings)
- Farms → Irrigation Events (one farm has multiple irrigation events)
- Users → Alerts (one user receives multiple alerts)

### Many-to-Many Relationships
- Users ↔ Farms (users can have access to multiple farms, farms can have multiple users)

## Indexes for Performance

```javascript
// Users Collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "farmId": 1 })
db.users.createIndex({ "role": 1 })

// Sensor Readings Collection
db.sensorReadings.createIndex({ "sensorId": 1, "timestamp": -1 })
db.sensorReadings.createIndex({ "farmId": 1, "timestamp": -1 })
db.sensorReadings.createIndex({ "timestamp": -1 })

// Alerts Collection
db.alerts.createIndex({ "farmId": 1, "status": 1 })
db.alerts.createIndex({ "userId": 1, "createdAt": -1 })
db.alerts.createIndex({ "type": 1, "status": 1 })

// Irrigation Events Collection
db.irrigationEvents.createIndex({ "farmId": 1, "startTime": -1 })
db.irrigationEvents.createIndex({ "userId": 1, "createdAt": -1 })
```
