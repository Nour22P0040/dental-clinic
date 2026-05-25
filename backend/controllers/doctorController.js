const { db } = require('../config/firebase');

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public (anyone can see available doctors)
 */
const getDoctors = async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'doctor')
      .where('isActive', '==', true)
      .get();

    const doctors = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
      };
    });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
    });
  }
};

module.exports = {
  getDoctors,
};
