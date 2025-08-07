const IrrigationEvent = require('../models/IrrigationEvent');
const Farm = require('../models/Farm');
const Sensor = require('../models/Sensor');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all irrigation events
const getAllIrrigationEvents = catchAsync(async (req, res) => {
  let query = {};
  
  // If user is not admin, only show events from their farm
  if (req.user.role !== 'admin' && req.user.farmId) {
    query.farmId = req.user.farmId;
  }
  
  const events = await IrrigationEvent.find(query)
    .populate('farmId', 'name location')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    message: 'Irrigation events retrieved successfully',
    data: {
      events,
      count: events.length
    }
  });
});

// Get irrigation event by ID
const getIrrigationEventById = catchAsync(async (req, res) => {
  const event = await IrrigationEvent.findById(req.params.id)
    .populate('farmId', 'name location');
  
  if (!event) {
    throw new AppError('Irrigation event not found', 404, 'EVENT_NOT_FOUND');
  }
  
  // Check if user has access to this event
  if (req.user.role !== 'admin' && event.farmId._id.toString() !== req.user.farmId?.toString()) {
    throw new AppError('Not authorized to access this irrigation event', 403, 'UNAUTHORIZED');
  }
  
  res.status(200).json({
    success: true,
    message: 'Irrigation event retrieved successfully',
    data: { event }
  });
});

// Start irrigation
const startIrrigation = catchAsync(async (req, res) => {
  const { farmId, duration, zones, type = 'manual' } = req.body;
  
  // Verify farm exists and user has access
  const farm = await Farm.findById(farmId || req.user.farmId);
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to control irrigation for this farm', 403, 'UNAUTHORIZED');
  }
  
  // Check if there's already an active irrigation
  const activeIrrigation = await IrrigationEvent.findOne({
    farmId: farm._id,
    status: 'running'
  });
  
  if (activeIrrigation) {
    throw new AppError('Irrigation is already running for this farm', 400, 'IRRIGATION_ACTIVE');
  }
  
  // Create irrigation event
  const irrigationEvent = await IrrigationEvent.create({
    farmId: farm._id,
    type,
    status: 'running',
    duration: duration || 30, // Default 30 minutes
    zones: zones || ['all'],
    startedBy: req.user.userId,
    startTime: new Date()
  });
  
  // TODO: Send command to IoT device to start irrigation
  console.log(`Starting irrigation for farm ${farm.name} - Duration: ${duration} minutes`);
  
  res.status(201).json({
    success: true,
    message: 'Irrigation started successfully',
    data: { 
      event: irrigationEvent,
      estimatedEndTime: new Date(Date.now() + (duration || 30) * 60000)
    }
  });
});

// Stop irrigation
const stopIrrigation = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  
  const event = await IrrigationEvent.findById(eventId);
  
  if (!event) {
    throw new AppError('Irrigation event not found', 404, 'EVENT_NOT_FOUND');
  }
  
  // Check if user has access to this event
  const farm = await Farm.findById(event.farmId);
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to control this irrigation', 403, 'UNAUTHORIZED');
  }
  
  if (event.status !== 'running') {
    throw new AppError('Irrigation is not currently running', 400, 'IRRIGATION_NOT_RUNNING');
  }
  
  // Update event
  event.status = 'completed';
  event.endTime = new Date();
  event.actualDuration = Math.round((event.endTime - event.startTime) / 60000); // minutes
  await event.save();
  
  // TODO: Send command to IoT device to stop irrigation
  console.log(`Stopping irrigation for farm ${farm.name}`);
  
  res.status(200).json({
    success: true,
    message: 'Irrigation stopped successfully',
    data: { event }
  });
});

// Schedule irrigation
const scheduleIrrigation = catchAsync(async (req, res) => {
  const { farmId, scheduledTime, duration, zones, type = 'scheduled' } = req.body;
  
  // Verify farm exists and user has access
  const farm = await Farm.findById(farmId || req.user.farmId);
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to schedule irrigation for this farm', 403, 'UNAUTHORIZED');
  }
  
  // Create scheduled irrigation event
  const irrigationEvent = await IrrigationEvent.create({
    farmId: farm._id,
    type,
    status: 'pending',
    duration: duration || 30,
    zones: zones || ['all'],
    scheduledTime: new Date(scheduledTime),
    startedBy: req.user.userId
  });
  
  res.status(201).json({
    success: true,
    message: 'Irrigation scheduled successfully',
    data: { event: irrigationEvent }
  });
});

// Get irrigation recommendations
const getIrrigationRecommendations = catchAsync(async (req, res) => {
  const farmId = req.params.farmId || req.user.farmId;
  
  // Verify farm exists and user has access
  const farm = await Farm.findById(farmId);
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to access recommendations for this farm', 403, 'UNAUTHORIZED');
  }
  
  // Get sensors for this farm
  const sensors = await Sensor.find({ farmId }).populate('lastReading');
  
  // Calculate average moisture
  const moistureReadings = sensors
    .map(s => s.lastReading?.moisture)
    .filter(m => m !== undefined && m !== null);
  
  const averageMoisture = moistureReadings.length > 0
    ? moistureReadings.reduce((sum, m) => sum + m, 0) / moistureReadings.length
    : 0;
  
  // Simple recommendation logic
  let recommendation = 'No irrigation needed';
  let priority = 'low';
  let estimatedDuration = 0;
  
  if (averageMoisture < 30) {
    recommendation = 'Immediate irrigation required';
    priority = 'high';
    estimatedDuration = 45;
  } else if (averageMoisture < 50) {
    recommendation = 'Irrigation recommended within 24 hours';
    priority = 'medium';
    estimatedDuration = 30;
  } else if (averageMoisture < 70) {
    recommendation = 'Monitor moisture levels';
    priority = 'low';
    estimatedDuration = 15;
  }
  
  res.status(200).json({
    success: true,
    message: 'Irrigation recommendations retrieved successfully',
    data: {
      farmId,
      averageMoisture: Math.round(averageMoisture),
      recommendation,
      priority,
      estimatedDuration,
      sensorCount: sensors.length,
      lastUpdated: new Date()
    }
  });
});

module.exports = {
  getAllIrrigationEvents,
  getIrrigationEventById,
  startIrrigation,
  stopIrrigation,
  scheduleIrrigation,
  getIrrigationRecommendations
};
