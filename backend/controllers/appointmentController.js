const { db } = require('../config/firebase');

/**
 * @desc    Book a new appointment
 * @route   POST /api/appointments/book
 * @access  Private (Patient)
 */
const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      duration = 30,
      appointmentType,
      reason,
      patientNotes,
    } = req.body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Verify doctor exists and has correct role
    const doctorDoc = await db.collection('users').doc(doctorId).get();
    if (!doctorDoc.exists || doctorDoc.data().role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future',
      });
    }

    // Check for conflicts (double-booking prevention)
    const startTime = appointmentDateTime.getTime();
    const endTime = startTime + (duration * 60000);

    const conflictingAppointments = await db.collection('appointments')
      .where('doctor', '==', doctorId)
      .where('status', 'in', ['scheduled', 'confirmed', 'in-progress'])
      .get();

    let hasConflict = false;
    conflictingAppointments.forEach(doc => {
      const existingAppt = doc.data();
      const existingStart = new Date(existingAppt.appointmentDate).getTime();
      const existingEnd = existingStart + (existingAppt.duration * 60000);

      // Check for overlap
      if (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      ) {
        hasConflict = true;
      }
    });

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.',
      });
    }

    // Create appointment
    const appointmentData = {
      patient: req.user.uid,
      doctor: doctorId,
      appointmentDate: appointmentDate,
      duration,
      appointmentType,
      reason,
      patientNotes: patientNotes || '',
      status: 'scheduled',
      doctorNotes: '',
      treatmentProvided: '',
      prescription: '',
      followUpRequired: false,
      followUpDate: null,
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const appointmentRef = await db.collection('appointments').add(appointmentData);

    // Get patient and doctor details
    const patientDoc = await db.collection('users').doc(req.user.uid).get();
    const patientData = patientDoc.data();

    const doctorData = doctorDoc.data();

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        _id: appointmentRef.id,
        ...appointmentData,
        patient: {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
        },
        doctor: {
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          specialization: doctorData.specialization,
        },
      },
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book appointment',
    });
  }
};

/**
 * @desc    Get all appointments (with filters)
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query = db.collection('appointments');

    // Role-based filtering
    if (req.user.role === 'patient') {
      query = query.where('patient', '==', req.user.uid);
    } else if (req.user.role === 'doctor') {
      query = query.where('doctor', '==', req.user.uid);
    }

    // Status filter
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    let appointments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get patient details
        let patient = null;
        if (data.patient) {
          const patientDoc = await db.collection('users').doc(data.patient).get();
          if (patientDoc.exists) {
            const patientData = patientDoc.data();
            patient = {
              firstName: patientData.firstName,
              lastName: patientData.lastName,
              email: patientData.email,
              phone: patientData.phone,
            };
          }
        }

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
          patient,
          doctor,
        };
      })
    );

    // Filter by date range if provided
    if (startDate || endDate) {
      appointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        if (startDate && aptDate < new Date(startDate)) return false;
        if (endDate && aptDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by date
    appointments.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
    });
  }
};

/**
 * @desc    Get upcoming appointments for doctor
 * @route   GET /api/appointments/upcoming
 * @access  Private (Doctor)
 */
const getUpcomingAppointments = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const doctorId = req.user.role === 'doctor' ? req.user.uid : req.query.doctorId;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
      });
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const snapshot = await db.collection('appointments')
      .where('doctor', '==', doctorId)
      .where('status', 'in', ['scheduled', 'confirmed'])
      .get();

    let appointments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const aptDate = new Date(data.appointmentDate);

        // Filter by date range
        if (aptDate < now || aptDate > futureDate) {
          return null;
        }

        // Get patient details
        let patient = null;
        if (data.patient) {
          const patientDoc = await db.collection('users').doc(data.patient).get();
          if (patientDoc.exists) {
            const patientData = patientDoc.data();
            patient = {
              firstName: patientData.firstName,
              lastName: patientData.lastName,
              email: patientData.email,
              phone: patientData.phone,
            };
          }
        }

        return {
          _id: doc.id,
          ...data,
          patient,
        };
      })
    );

    // Filter out nulls and sort
    appointments = appointments.filter(apt => apt !== null);
    appointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming appointments',
    });
  }
};

/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = async (req, res) => {
  try {
    const appointmentDoc = await db.collection('appointments').doc(req.params.id).get();

    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const appointment = appointmentDoc.data();

    // Check authorization
    if (
      req.user.role === 'patient' &&
      appointment.patient !== req.user.uid
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment',
      });
    }

    if (
      req.user.role === 'doctor' &&
      appointment.doctor !== req.user.uid
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: appointmentDoc.id,
        ...appointment,
      },
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
    });
  }
};

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
const updateAppointment = async (req, res) => {
  try {
    const appointmentDoc = await db.collection('appointments').doc(req.params.id).get();

    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const appointment = appointmentDoc.data();

    // Check authorization
    const isPatient = req.user.role === 'patient' && appointment.patient === req.user.uid;
    const isDoctor = req.user.role === 'doctor' && appointment.doctor === req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment',
      });
    }

    // Determine allowed updates based on role
    const allowedUpdates = isDoctor
      ? ['status', 'doctorNotes', 'treatmentProvided', 'prescription', 'followUpRequired', 'followUpDate']
      : ['appointmentDate', 'duration', 'reason', 'patientNotes'];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = new Date().toISOString();

    await db.collection('appointments').doc(req.params.id).update(updates);

    const updatedDoc = await db.collection('appointments').doc(req.params.id).get();

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        _id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
    });
  }
};

/**
 * @desc    Cancel appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
const cancelAppointment = async (req, res) => {
  try {
    const appointmentDoc = await db.collection('appointments').doc(req.params.id).get();

    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const appointment = appointmentDoc.data();

    // Check authorization
    const isPatient = req.user.role === 'patient' && appointment.patient === req.user.uid;
    const isDoctor = req.user.role === 'doctor' && appointment.doctor === req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment',
      });
    }

    const { reason } = req.body;

    await db.collection('appointments').doc(req.params.id).update({
      status: 'cancelled',
      cancellationReason: reason || 'No reason provided',
      cancelledBy: req.user.uid,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await db.collection('appointments').doc(req.params.id).get();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        _id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
    });
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getUpcomingAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
};
