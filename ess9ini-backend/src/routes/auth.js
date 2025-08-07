const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { userValidations } = require('../middleware/validation');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.post('/register', authLimiter, userValidations.register, authController.register);
router.post('/login', authLimiter, userValidations.login, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.use(authenticate); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.put('/profile', userValidations.updateProfile, authController.updateProfile);
router.put('/password', userValidations.changePassword, authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;
