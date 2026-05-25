const express = require('express');
const {
  getPatients,
  getPatientById,
  updatePatient,
  updateMedicalHistory,
  deletePatient,
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all patients (doctor/admin only)
router.get('/', authorize('doctor', 'admin'), getPatients);

// Patient-specific routes
router
  .route('/:id')
  .get(getPatientById)
  .put(updatePatient)
  .delete(authorize('admin'), deletePatient);

// Update medical history (doctor/admin only)
router.put(
  '/:id/medical-history',
  authorize('doctor', 'admin'),
  updateMedicalHistory
);

module.exports = router;
