const express = require('express');
const {
  getDashboardAnalytics,
  getPatientAnalytics,
  getDoctorAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Dashboard analytics (doctor/admin only)
router.get('/dashboard', authorize('doctor', 'admin'), getDashboardAnalytics);

// Patient analytics
router.get('/patient/:patientId', getPatientAnalytics);

// Doctor analytics
router.get('/doctor/:doctorId', getDoctorAnalytics);

module.exports = router;
