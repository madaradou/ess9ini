const Farm = require('../models/Farm');
const User = require('../models/User');
const Sensor = require('../models/Sensor');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all farms
const getAllFarms = catchAsync(async (req, res) => {
  const farms = await Farm.find().populate('ownerId', 'firstName lastName email');
  
  res.status(200).json({
    success: true,
    message: 'Farms retrieved successfully',
    data: {
      farms,
      count: farms.length
    }
  });
});

// Get farm by ID
const getFarmById = catchAsync(async (req, res) => {
  const farm = await Farm.findById(req.params.id)
    .populate('ownerId', 'firstName lastName email')
    .populate('sensors');
  
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  res.status(200).json({
    success: true,
    message: 'Farm retrieved successfully',
    data: { farm }
  });
});

// Get farm overview (for dashboard)
const getFarmOverview = catchAsync(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  // Check if user has access to this farm
  if (req.user.role !== 'admin' && req.user.farmId?.toString() !== req.params.id) {
    throw new AppError('Not authorized to access this farm', 403, 'UNAUTHORIZED');
  }
  
  // Get sensors for this farm
  const sensors = await Sensor.find({ farmId: req.params.id });
  
  // Calculate statistics
  const totalSensors = sensors.length;
  const activeSensors = sensors.filter(s => s.status === 'active').length;
  const averageMoisture = sensors.length > 0 
    ? Math.round(sensors.reduce((sum, s) => sum + (s.lastReading?.moisture || 0), 0) / sensors.length)
    : 0;
  
  res.status(200).json({
    success: true,
    message: 'Farm overview retrieved successfully',
    data: {
      farmName: farm.name,
      farmId: farm._id,
      totalSensors,
      activeSensors,
      averageMoisture,
      cropType: farm.cropType,
      area: farm.area,
      location: farm.location
    }
  });
});

// Create new farm
const createFarm = catchAsync(async (req, res) => {
  const farmData = {
    ...req.body,
    ownerId: req.user.userId
  };
  
  const farm = await Farm.create(farmData);
  
  // Update user's farmId
  await User.findByIdAndUpdate(req.user.userId, { farmId: farm._id });
  
  res.status(201).json({
    success: true,
    message: 'Farm created successfully',
    data: { farm }
  });
});

// Update farm
const updateFarm = catchAsync(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  // Check if user has access to this farm
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to update this farm', 403, 'UNAUTHORIZED');
  }
  
  const updatedFarm = await Farm.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'Farm updated successfully',
    data: { farm: updatedFarm }
  });
});

// Delete farm
const deleteFarm = catchAsync(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  
  if (!farm) {
    throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
  }
  
  // Check if user has access to this farm
  if (req.user.role !== 'admin' && farm.ownerId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to delete this farm', 403, 'UNAUTHORIZED');
  }
  
  await Farm.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Farm deleted successfully'
  });
});

module.exports = {
  getAllFarms,
  getFarmById,
  getFarmOverview,
  createFarm,
  updateFarm,
  deleteFarm
};
