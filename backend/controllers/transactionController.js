const { db } = require('../config/firebase');

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private (Doctor/Admin)
 */
const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      patientId,
      appointmentId,
      description,
      paymentMethod,
      transactionDate,
      referenceNumber,
      notes,
    } = req.body;

    // Validate required fields
    if (!type || !amount || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate patient for income transactions
    if (type === 'income' && !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient is required for income transactions',
      });
    }

    // Verify patient exists if provided
    if (patientId) {
      const patientDoc = await db.collection('users').doc(patientId).get();
      if (!patientDoc.exists || patientDoc.data().role !== 'patient') {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
    }

    // Generate reference number if not provided
    const refNumber = referenceNumber || `${type === 'income' ? 'INV' : 'EXP'}-${Date.now()}`;

    // Create transaction
    const transactionData = {
      type,
      amount: parseFloat(amount),
      category,
      patient: patientId || null,
      appointment: appointmentId || null,
      description,
      paymentMethod: paymentMethod || null,
      transactionDate: transactionDate || new Date().toISOString(),
      referenceNumber: refNumber,
      notes: notes || '',
      status: 'completed',
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const transactionRef = await db.collection('transactions').add(transactionData);

    // Update patient's total money spent if income transaction
    if (type === 'income' && patientId) {
      const patientDoc = await db.collection('users').doc(patientId).get();
      const currentTotal = patientDoc.data().totalMoneySpent || 0;
      await db.collection('users').doc(patientId).update({
        totalMoneySpent: currentTotal + parseFloat(amount),
        updatedAt: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        _id: transactionRef.id,
        ...transactionData,
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create transaction',
    });
  }
};

/**
 * @desc    Get all transactions
 * @route   GET /api/transactions
 * @access  Private (Doctor/Admin)
 */
const getTransactions = async (req, res) => {
  try {
    const { type, category, status, startDate, endDate, patientId } = req.query;

    let query = db.collection('transactions');

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (patientId) {
      query = query.where('patient', '==', patientId);
    }

    const snapshot = await query.get();

    let transactions = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get patient details if exists
        let patient = null;
        if (data.patient) {
          const patientDoc = await db.collection('users').doc(data.patient).get();
          if (patientDoc.exists) {
            const patientData = patientDoc.data();
            patient = {
              firstName: patientData.firstName,
              lastName: patientData.lastName,
              email: patientData.email,
            };
          }
        }

        // Get creator details
        let createdBy = null;
        if (data.createdBy) {
          const creatorDoc = await db.collection('users').doc(data.createdBy).get();
          if (creatorDoc.exists) {
            const creatorData = creatorDoc.data();
            createdBy = {
              firstName: creatorData.firstName,
              lastName: creatorData.lastName,
            };
          }
        }

        return {
          _id: doc.id,
          ...data,
          patient,
          createdBy,
        };
      })
    );

    // Filter by date range if provided
    if (startDate || endDate) {
      transactions = transactions.filter(txn => {
        const txnDate = new Date(txn.transactionDate);
        if (startDate && txnDate < new Date(startDate)) return false;
        if (endDate && txnDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
};

/**
 * @desc    Get transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = async (req, res) => {
  try {
    const transactionDoc = await db.collection('transactions').doc(req.params.id).get();

    if (!transactionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: transactionDoc.id,
        ...transactionDoc.data(),
      },
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
    });
  }
};

/**
 * @desc    Get transactions for a specific patient
 * @route   GET /api/transactions/patient/:patientId
 * @access  Private
 */
const getPatientTransactions = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Authorization check
    if (
      req.user.role === 'patient' &&
      req.user.uid !== patientId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these transactions',
      });
    }

    const snapshot = await db.collection('transactions')
      .where('patient', '==', patientId)
      .get();

    const transactions = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data(),
    }));

    // Calculate summary
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    };

    transactions.forEach((transaction) => {
      if (transaction.type === 'income' && transaction.status === 'completed') {
        summary.totalIncome += transaction.amount;
      } else if (transaction.type === 'expense' && transaction.status === 'completed') {
        summary.totalExpenses += transaction.amount;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpenses;

    // Sort by date
    transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    res.status(200).json({
      success: true,
      count: transactions.length,
      summary,
      data: transactions,
    });
  } catch (error) {
    console.error('Get patient transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient transactions',
    });
  }
};

/**
 * @desc    Update transaction
 * @route   PUT /api/transactions/:id
 * @access  Private (Doctor/Admin)
 */
const updateTransaction = async (req, res) => {
  try {
    const transactionDoc = await db.collection('transactions').doc(req.params.id).get();

    if (!transactionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const allowedUpdates = ['status', 'notes', 'description'];
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = new Date().toISOString();

    await db.collection('transactions').doc(req.params.id).update(updates);

    const updatedDoc = await db.collection('transactions').doc(req.params.id).get();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        _id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
    });
  }
};

/**
 * @desc    Get financial summary
 * @route   GET /api/transactions/summary
 * @access  Private (Doctor/Admin)
 */
const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const snapshot = await db.collection('transactions')
      .where('status', '==', 'completed')
      .get();

    let transactions = snapshot.docs.map(doc => doc.data());

    // Filter by date range if provided
    if (startDate || endDate) {
      transactions = transactions.filter(txn => {
        const txnDate = new Date(txn.transactionDate);
        if (startDate && txnDate < new Date(startDate)) return false;
        if (endDate && txnDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    const byCategory = {};

    transactions.forEach(txn => {
      if (txn.type === 'income') {
        totalIncome += txn.amount;
      } else if (txn.type === 'expense') {
        totalExpenses += txn.amount;
      }

      // Group by category
      const key = `${txn.type}-${txn.category}`;
      if (!byCategory[key]) {
        byCategory[key] = {
          type: txn.type,
          category: txn.category,
          total: 0,
          count: 0,
        };
      }
      byCategory[key].total += txn.amount;
      byCategory[key].count += 1;
    });

    const balance = totalIncome - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance,
        byCategory: Object.values(byCategory),
      },
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getPatientTransactions,
  updateTransaction,
  getFinancialSummary,
};
