const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const CONSTANTS = require('../config/constants');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Placeholder routes - will be implemented later
router.get('/', authorize(CONSTANTS.USER_ROLES.ADMIN), (req, res) => {
  res.json({
    success: true,
    message: 'Users endpoint - Coming soon',
    data: []
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Get user by ID - Coming soon',
    data: null
  });
});

module.exports = router;
