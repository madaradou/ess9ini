const express = require('express');
const { authenticate, checkSensorAccess } = require('../middleware/auth');
const { sensorDataLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Placeholder routes - will be implemented later
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sensors endpoint - Coming soon',
    data: []
  });
});

router.get('/:id', checkSensorAccess, (req, res) => {
  res.json({
    success: true,
    message: 'Get sensor by ID - Coming soon',
    data: null
  });
});

router.post('/:id/readings', sensorDataLimiter, checkSensorAccess, (req, res) => {
  res.json({
    success: true,
    message: 'Add sensor reading - Coming soon',
    data: null
  });
});

module.exports = router;
