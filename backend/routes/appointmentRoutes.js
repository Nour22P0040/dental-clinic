const express = require('express');
const {
  bookAppointment,
  getAppointments,
  getUpcomingAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Book appointment (patients)
router.post('/book', authorize('patient'), bookAppointment);

// Get all appointments
router.get('/', getAppointments);

// Get upcoming appointments
router.get('/upcoming', getUpcomingAppointments);

// Get, update, cancel specific appointment
router
  .route('/:id')
  .get(getAppointmentById)
  .put(updateAppointment)
  .delete(cancelAppointment);

module.exports = router;
