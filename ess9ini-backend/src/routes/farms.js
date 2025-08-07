const express = require('express');
const { authenticate, checkFarmAccess } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Placeholder routes - will be implemented later
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Farms endpoint - Coming soon',
    data: []
  });
});

router.get('/:farmId', checkFarmAccess, (req, res) => {
  res.json({
    success: true,
    message: 'Get farm by ID - Coming soon',
    data: null
  });
});

module.exports = router;
