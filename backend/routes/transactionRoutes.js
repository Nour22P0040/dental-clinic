const express = require('express');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  getPatientTransactions,
  updateTransaction,
  getFinancialSummary,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Financial summary
router.get('/summary', authorize('doctor', 'admin'), getFinancialSummary);

// Patient transactions
router.get('/patient/:patientId', getPatientTransactions);

// Create and get all transactions
router
  .route('/')
  .post(authorize('doctor', 'admin'), createTransaction)
  .get(authorize('doctor', 'admin'), getTransactions);

// Transaction by ID
router
  .route('/:id')
  .get(getTransactionById)
  .put(authorize('doctor', 'admin'), updateTransaction);

module.exports = router;
