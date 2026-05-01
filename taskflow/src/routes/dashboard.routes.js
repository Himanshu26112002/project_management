const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboard.controller');

router.get('/', authenticate, getDashboard);

module.exports = router;
