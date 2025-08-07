const User = require('../models/User');
const Farm = require('../models/Farm');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all users (admin only)
const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().populate('farmId', 'name location');
  
  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        farmId: user.farmId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      })),
      count: users.length
    }
  });
});

// Get user by ID
const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).populate('farmId', 'name location');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        farmId: user.farmId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        profile: user.profile,
        createdAt: user.createdAt
      }
    }
  });
});

// Update user
const updateUser = catchAsync(async (req, res) => {
  const { firstName, lastName, phone, language, profile } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Check if user can update this profile
  if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
    throw new AppError('Not authorized to update this user', 403, 'UNAUTHORIZED');
  }
  
  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (language) user.language = language;
  if (profile) user.profile = { ...user.profile, ...profile };
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        farmId: user.farmId,
        phone: user.phone,
        language: user.language,
        profile: user.profile,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

// Delete user (admin only)
const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  await User.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Get user statistics (admin only)
const getUserStats = catchAsync(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const verifiedUsers = await User.countDocuments({ emailVerified: true });
  const farmerCount = await User.countDocuments({ role: 'farmer' });
  const adminCount = await User.countDocuments({ role: 'admin' });
  const technicianCount = await User.countDocuments({ role: 'technician' });
  
  res.status(200).json({
    success: true,
    message: 'User statistics retrieved successfully',
    data: {
      totalUsers,
      activeUsers,
      verifiedUsers,
      roleDistribution: {
        farmers: farmerCount,
        admins: adminCount,
        technicians: technicianCount
      }
    }
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
};
