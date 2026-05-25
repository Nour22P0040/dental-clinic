const express = require('express');
const { getDoctors } = require('../controllers/doctorController');

const router = express.Router();

// Public route - anyone can see available doctors
router.get('/', getDoctors);

module.exports = router;
