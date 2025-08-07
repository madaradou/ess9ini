const Sensor = require('../models/Sensor');
const SensorReading = require('../models/SensorReading');
const Farm = require('../models/Farm');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all sensors
const getAllSensors = catchAsync(async (req, res) => {
  let query = {};
  
  // If user is not admin, only show sensors from their farm
  if (req.user.role !== 'admin' && req.user.farmId) {
    query.farmId = req.user.farmId;
  }
  
  const sensors = await Sensor.find(query)
    .populate('farmId', 'name location')
    .populate('lastReading');
  
  res.status(200).json({
    success: true,
    message: 'Sensors retrieved successfully',
    data: {
      sensors,
      count: sensors.length
    }
  });
});

// Get sensor by ID
const getSensorById = catchAsync(async (req, res) => {
  const sensor = await Sensor.findById(req.params.id)
    .populate('farmId', 'name location')
    .populate('lastReading');
  
  if (!sensor) {
    throw new AppError('Sensor not found', 404, 'SENSOR_NOT_FOUND');
  }
  
  // Check if user has access to this sensor
  if (req.user.role !== 'admin' && sensor.farmId._id.toString() !== req.user.farmId?.toString()) {
    throw new AppError('Not authorized to access this sensor', 403, 'UNAUTHORIZED');
  }
  
  res.status(200).json({
    success: true,
    message: 'Sensor retrieved successfully',
    data: { sensor }
  });
});

// Get sensor readings
const getSensorReadings = catchAsync(async (req, res) => {
  const { timeRange = '24h', limit = 100 } = req.query;
  
  const sensor = await Sensor.findById(req.params.id);
  
  if (!sensor) {
    throw new AppError('Sensor not found', 404, 'SENSOR_NOT_FOUND');
  }
  
  // Check if user has access to this sensor
  if (req.user.role !== 'admin' && sensor.farmId.toString() !== req.user.farmId?.toString()) {
    throw new AppError('Not authorized to access this sensor', 403, 'UNAUTHORIZED');
  }
  
  // Calculate time range
  let startDate = new Date();
  switch (timeRange) {
    case '1h':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case '24h':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 1);
  }
  
  const readings = await SensorReading.find({
    sensorId: req.params.id,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));
  
  res.status(200).json({
    success: true,
    message: 'Sensor readings retrieved successfully',
    data: {
      readings,
      count: readings.length,
      timeRange,
      sensor: {
        id: sensor._id,
        name: sensor.name,
        type: sensor.type
      }
    }
  });
});

// Create new sensor
const createSensor = catchAsync(async (req, res) => {
  const sensorData = {
    ...req.body,
    farmId: req.user.farmId || req.body.farmId
  };
  
  // Verify farm exists and user has access
  const farm = await Farm.findById(sensorData.farmId);
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to create sensor for this farm', 403, 'UNAUTHORIZED');
  }
  
  const sensor = await Sensor.create(sensorData);
  
  res.status(201).json({
    success: true,
    message: 'Sensor created successfully',
    data: { sensor }
  });
});

// Update sensor
const updateSensor = catchAsync(async (req, res) => {
  const sensor = await Sensor.findById(req.params.id);
  
  if (!sensor) {
    throw new AppError('Sensor not found', 404, 'SENSOR_NOT_FOUND');
  }
  
  // Check if user has access to this sensor
  const farm = await Farm.findById(sensor.farmId);
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to update this sensor', 403, 'UNAUTHORIZED');
  }
  
  const updatedSensor = await Sensor.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'Sensor updated successfully',
    data: { sensor: updatedSensor }
  });
});

// Delete sensor
const deleteSensor = catchAsync(async (req, res) => {
  const sensor = await Sensor.findById(req.params.id);
  
  if (!sensor) {
    throw new AppError('Sensor not found', 404, 'SENSOR_NOT_FOUND');
  }
  
  // Check if user has access to this sensor
  const farm = await Farm.findById(sensor.farmId);
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to delete this sensor', 403, 'UNAUTHORIZED');
  }
  
  await Sensor.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Sensor deleted successfully'
  });
});

// Add sensor reading (for IoT devices)
const addSensorReading = catchAsync(async (req, res) => {
  const sensor = await Sensor.findById(req.params.id);
  
  if (!sensor) {
    throw new AppError('Sensor not found', 404, 'SENSOR_NOT_FOUND');
  }
  
  const reading = await SensorReading.create({
    sensorId: req.params.id,
    ...req.body
  });
  
  // Update sensor's last reading
  sensor.lastReading = reading._id;
  sensor.lastUpdated = new Date();
  await sensor.save();
  
  res.status(201).json({
    success: true,
    message: 'Sensor reading added successfully',
    data: { reading }
  });
});

module.exports = {
  getAllSensors,
  getSensorById,
  getSensorReadings,
  createSensor,
  updateSensor,
  deleteSensor,
  addSensorReading
};
