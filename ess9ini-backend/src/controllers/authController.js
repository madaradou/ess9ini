const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Farm = require('../models/Farm');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const CONSTANTS = require('../config/constants');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        farmId: user.farmId,
        language: user.language,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        profile: user.profile,
        createdAt: user.createdAt
      },
      token,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, phone, role, language } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400, 'USER_EXISTS'));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    role: role || CONSTANTS.USER_ROLES.FARMER,
    language: language || CONSTANTS.LANGUAGES.ARABIC
  });

  // If user is a farmer, create a default farm
  if (user.role === CONSTANTS.USER_ROLES.FARMER) {
    const defaultFarm = await Farm.create({
      name: `مزرعة ${firstName} ${lastName}`,
      nameEn: `${firstName} ${lastName}'s Farm`,
      owner: user._id,
      location: {
        address: 'قابس، تونس',
        city: 'Gabès',
        region: 'Gabès',
        coordinates: {
          latitude: 33.8815,
          longitude: 10.0982
        },
        area: 1.0,
        zones: [{
          id: 1,
          name: 'المنطقة الرئيسية',
          area: 1.0,
          cropType: CONSTANTS.CROP_TYPES.OLIVE_TREES
        }]
      },
      primaryCrop: CONSTANTS.CROP_TYPES.OLIVE_TREES,
      soilType: CONSTANTS.SOIL_TYPES.CLAY_LOAM,
      irrigationSystem: CONSTANTS.IRRIGATION_SYSTEMS.DRIP,
      establishedDate: new Date()
    });

    // Update user with farm reference
    user.farmId = defaultFarm._id;
    await user.save();
  }

  sendTokenResponse(user, 201, res, 'User registered successfully');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password').populate('farmId');

  if (!user) {
    return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account is temporarily locked due to multiple failed login attempts', 423, 'ACCOUNT_LOCKED'));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Account has been deactivated', 401, 'ACCOUNT_DEACTIVATED'));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.userId).populate('farmId');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = catchAsync(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    language: req.body.language,
    profile: req.body.profile
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  ).populate('farmId');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, password } = req.body;

  // Get user with password
  const user = await User.findById(req.user.userId).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD'));
  }

  // Update password
  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = catchAsync(async (req, res, next) => {
  // In a more sophisticated setup, you would:
  // 1. Add the token to a blacklist
  // 2. Store active sessions in Redis
  // 3. Invalidate the specific session

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED'));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
    }

    // Generate new access token
    const newToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with that email address', 404, 'USER_NOT_FOUND'));
  }

  // Generate reset token (in production, you'd send this via email)
  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  // Store reset token and expiry (in production, you'd hash this)
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // In production, send email with reset link
  // For now, just return the token (REMOVE IN PRODUCTION)
  res.status(200).json({
    success: true,
    message: 'Password reset token sent to email',
    // REMOVE THIS IN PRODUCTION:
    resetToken: resetToken
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.userId,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Password reset token is invalid or has expired', 400, 'INVALID_RESET_TOKEN'));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    return next(new AppError('Password reset token is invalid or has expired', 400, 'INVALID_RESET_TOKEN'));
  }
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({
      _id: decoded.userId,
      emailVerificationToken: token
    });

    if (!user) {
      return next(new AppError('Email verification token is invalid', 400, 'INVALID_VERIFICATION_TOKEN'));
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    return next(new AppError('Email verification token is invalid', 400, 'INVALID_VERIFICATION_TOKEN'));
  }
});
