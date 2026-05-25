const { db } = require('../config/firebase');

/**
 * @desc    Get all patients
 * @route   GET /api/patients
 * @access  Private (Doctor/Admin)
 */
const getPatients = async (req, res) => {
  try {
    const { search, sortBy = 'createdAt', order = 'desc' } = req.query;

    let query = db.collection('users')
      .where('role', '==', 'patient')
      .where('isActive', '==', true);

    const snapshot = await query.get();

    let patients = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    // Search functionality (client-side since Firestore doesn't support OR queries easily)
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(patient => 
        patient.firstName?.toLowerCase().includes(searchLower) ||
        patient.lastName?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.phone?.includes(search)
      );
    }

    // Sort
    patients.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
    });
  }
};

/**
 * @desc    Get patient by ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
const getPatientById = async (req, res) => {
  try {
    const patientDoc = await db.collection('users').doc(req.params.id).get();

    if (!patientDoc.exists || patientDoc.data().role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const patient = patientDoc.data();

    // Authorization check
    if (
      req.user.role === 'patient' &&
      req.user.uid !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this patient data',
      });
    }

    // Get recent appointments
    const appointmentsSnapshot = await db.collection('appointments')
      .where('patient', '==', req.params.id)
      .limit(10)
      .get();

    const appointments = await Promise.all(
      appointmentsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get doctor details
        let doctor = null;
        if (data.doctor) {
          const doctorDoc = await db.collection('users').doc(data.doctor).get();
          if (doctorDoc.exists) {
            const doctorData = doctorDoc.data();
            doctor = {
              firstName: doctorData.firstName,
              lastName: doctorData.lastName,
              specialization: doctorData.specialization,
            };
          }
        }

        return {
          _id: doc.id,
          ...data,
          doctor,
        };
      })
    );

    // Sort appointments by date
    appointments.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    // Get recent transactions
    const transactionsSnapshot = await db.collection('transactions')
      .where('patient', '==', req.params.id)
      .limit(10)
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data(),
    }));

    // Sort transactions by date
    transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    res.status(200).json({
      success: true,
      data: {
        patient: {
          uid: patientDoc.id,
          ...patient,
        },
        recentAppointments: appointments,
        recentTransactions: transactions,
      },
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
    });
  }
};

/**
 * @desc    Update patient information
 * @route   PUT /api/patients/:id
 * @access  Private (Doctor/Admin or Own Patient)
 */
const updatePatient = async (req, res) => {
  try {
    const patientDoc = await db.collection('users').doc(req.params.id).get();

    if (!patientDoc.exists || patientDoc.data().role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Authorization check
    const isOwnProfile = req.user.uid === req.params.id;
    const isAuthorized = req.user.role === 'doctor' || req.user.role === 'admin' || isOwnProfile;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this patient',
      });
    }

    // Define allowed updates based on role
    const allowedUpdates = isOwnProfile
      ? ['firstName', 'lastName', 'phone', 'address', 'emergencyContact']
      : ['firstName', 'lastName', 'phone', 'address', 'emergencyContact', 'medicalHistory', 'isActive'];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = new Date().toISOString();

    await db.collection('users').doc(req.params.id).update(updates);

    const updatedDoc = await db.collection('users').doc(req.params.id).get();

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        uid: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
    });
  }
};

/**
 * @desc    Update patient medical history
 * @route   PUT /api/patients/:id/medical-history
 * @access  Private (Doctor/Admin)
 */
const updateMedicalHistory = async (req, res) => {
  try {
    const patientDoc = await db.collection('users').doc(req.params.id).get();

    if (!patientDoc.exists || patientDoc.data().role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const { allergies, chronicConditions, currentMedications, previousDentalProcedures, notes } = req.body;

    const patient = patientDoc.data();
    const currentHistory = patient.medicalHistory || {};

    const updatedHistory = {
      allergies: allergies || currentHistory.allergies || [],
      chronicConditions: chronicConditions || currentHistory.chronicConditions || [],
      currentMedications: currentMedications || currentHistory.currentMedications || [],
      previousDentalProcedures: previousDentalProcedures || currentHistory.previousDentalProcedures || [],
      notes: notes !== undefined ? notes : currentHistory.notes || '',
    };

    await db.collection('users').doc(req.params.id).update({
      medicalHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await db.collection('users').doc(req.params.id).get();

    res.status(200).json({
      success: true,
      message: 'Medical history updated successfully',
      data: {
        uid: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Update medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medical history',
    });
  }
};

/**
 * @desc    Delete/Deactivate patient
 * @route   DELETE /api/patients/:id
 * @access  Private (Admin only)
 */
const deletePatient = async (req, res) => {
  try {
    const patientDoc = await db.collection('users').doc(req.params.id).get();

    if (!patientDoc.exists || patientDoc.data().role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Soft delete - deactivate account
    await db.collection('users').doc(req.params.id).update({
      isActive: false,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Patient account deactivated successfully',
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
    });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  updatePatient,
  updateMedicalHistory,
  deletePatient,
};
