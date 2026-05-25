const { db } = require('../config/firebase');

/**
 * @desc    Get dashboard analytics
 * @route   GET /api/analytics/dashboard
 * @access  Private (Doctor/Admin)
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    // Get total patients
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'patient')
      .where('isActive', '==', true)
      .get();
    const totalPatients = usersSnapshot.size;

    // Get total appointments (if collection exists)
    let totalVisits = 0;
    let upcomingAppointments = 0;
    try {
      const appointmentsSnapshot = await db.collection('appointments')
        .where('status', '==', 'completed')
        .get();
      totalVisits = appointmentsSnapshot.size;

      const upcomingSnapshot = await db.collection('appointments')
        .where('status', 'in', ['scheduled', 'confirmed'])
        .get();
      upcomingAppointments = upcomingSnapshot.size;
    } catch (error) {
      // Appointments collection doesn't exist yet
    }

    // Get financial data (if collection exists)
    let totalIncome = 0;
    let totalExpenses = 0;
    try {
      const incomeSnapshot = await db.collection('transactions')
        .where('type', '==', 'income')
        .where('status', '==', 'completed')
        .get();
      
      incomeSnapshot.forEach(doc => {
        totalIncome += doc.data().amount || 0;
      });

      const expenseSnapshot = await db.collection('transactions')
        .where('type', '==', 'expense')
        .where('status', '==', 'completed')
        .get();
      
      expenseSnapshot.forEach(doc => {
        totalExpenses += doc.data().amount || 0;
      });
    } catch (error) {
      // Transactions collection doesn't exist yet
    }

    const balance = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(2) : '0.00';

    // Get recent appointments
    let recentAppointments = [];
    try {
      const recentSnapshot = await db.collection('appointments')
        .orderBy('appointmentDate', 'desc')
        .limit(10)
        .get();
      
      recentAppointments = await Promise.all(
        recentSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          // Get patient and doctor details
          let patient = null;
          let doctor = null;
          
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
          
          if (data.doctor) {
            const doctorDoc = await db.collection('users').doc(data.doctor).get();
            if (doctorDoc.exists) {
              const doctorData = doctorDoc.data();
              doctor = {
                firstName: doctorData.firstName,
                lastName: doctorData.lastName,
              };
            }
          }
          
          return {
            _id: doc.id,
            ...data,
            patient,
            doctor,
          };
        })
      );
    } catch (error) {
      // Appointments collection doesn't exist yet
    }

    const analytics = {
      overview: {
        totalPatients,
        totalVisits,
        upcomingAppointments,
        financial: {
          totalIncome,
          totalExpenses,
          balance,
          profitMargin,
        },
      },
      appointments: {
        byStatus: {},
        recent: recentAppointments,
      },
      financial: {
        revenueByCategory: [],
        monthlyTrend: [],
      },
      patients: {
        topSpending: [],
        growthTrend: [],
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
      dateRange: {
        startDate: 'All time',
        endDate: 'Present',
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get patient-specific analytics
 * @route   GET /api/analytics/patient/:patientId
 * @access  Private
 */
const getPatientAnalytics = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Authorization check
    if (
      req.user.role === 'patient' &&
      req.user.uid !== patientId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this patient data',
      });
    }

    // Get patient details
    const patientDoc = await db.collection('users').doc(patientId).get();
    
    if (!patientDoc.exists || patientDoc.data().role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const patientData = patientDoc.data();

    const analytics = {
      patient: {
        id: patientDoc.id,
        name: `${patientData.firstName} ${patientData.lastName}`,
        email: patientData.email,
        phone: patientData.phone,
        visitCount: patientData.visitCount || 0,
        lastVisit: patientData.lastVisitDate,
        totalSpent: patientData.totalMoneySpent || 0,
      },
      appointments: {
        total: 0,
        byType: [],
        history: [],
      },
      financial: {
        totalSpent: patientData.totalMoneySpent || 0,
        transactions: [],
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Patient analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient analytics',
    });
  }
};

/**
 * @desc    Get doctor performance analytics
 * @route   GET /api/analytics/doctor/:doctorId
 * @access  Private (Admin or Own Doctor)
 */
const getDoctorAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Authorization check
    if (
      req.user.role === 'doctor' &&
      req.user.uid !== doctorId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this doctor data',
      });
    }

    const doctorDoc = await db.collection('users').doc(doctorId).get();
    
    if (!doctorDoc.exists || doctorDoc.data().role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const doctorData = doctorDoc.data();

    const analytics = {
      doctor: {
        id: doctorDoc.id,
        name: `${doctorData.firstName} ${doctorData.lastName}`,
        specialization: doctorData.specialization,
      },
      performance: {
        totalAppointments: 0,
        completedAppointments: 0,
        uniquePatients: 0,
        completionRate: '0.00',
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Doctor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor analytics',
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getPatientAnalytics,
  getDoctorAnalytics,
};
