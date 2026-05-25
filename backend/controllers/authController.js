const { auth, db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role = 'patient',
      dateOfBirth,
      gender,
      address,
      specialization,
      licenseNumber,
      doctorRegistrationCode,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
      });
    }

    // Validate role-specific fields
    if (role === 'patient' && (!dateOfBirth || !gender)) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth and gender are required for patients',
      });
    }

    if (role === 'doctor') {
      // Verify doctor registration code
      const DOCTOR_REGISTRATION_CODE = process.env.DOCTOR_REGISTRATION_CODE || 'DENTAL2024';
      
      if (!doctorRegistrationCode || doctorRegistrationCode !== DOCTOR_REGISTRATION_CODE) {
        return res.status(403).json({
          success: false,
          message: 'Invalid doctor registration code. Please contact the administrator.',
        });
      }

      if (!specialization || !licenseNumber) {
        return res.status(400).json({
          success: false,
          message: 'Specialization and license number are required for doctors',
        });
      }
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Hash password for storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user document in Firestore
    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add role-specific fields
    if (role === 'patient') {
      userData.dateOfBirth = dateOfBirth;
      userData.gender = gender;
      userData.address = address || {};
      userData.medicalHistory = {
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        previousDentalProcedures: [],
        notes: '',
      };
      userData.visitCount = 0;
      userData.totalMoneySpent = 0;
      userData.lastVisitDate = null;
    }

    if (role === 'doctor') {
      userData.specialization = specialization;
      userData.licenseNumber = licenseNumber;
    }

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Generate custom token
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          uid: userRecord.uid,
          firstName,
          lastName,
          email,
          role,
        },
        token: customToken,
        authToken: userRecord.uid,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const userData = userDoc.data();

    // Check if account is active
    if (!userData.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.',
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, userData.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate custom token with user data as claims
    const customToken = await auth.createCustomToken(userRecord.uid, {
      role: userData.role,
      email: userData.email,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: userRecord.uid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          phone: userData.phone,
        },
        token: customToken,
        // Also send the uid as token for our middleware
        authToken: userRecord.uid,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'emergencyContact'];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = new Date().toISOString();

    await db.collection('users').doc(req.user.uid).update(updates);

    const updatedDoc = await db.collection('users').doc(req.user.uid).get();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { uid: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    // Get user document
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password in Firebase Auth
    await auth.updateUser(req.user.uid, {
      password: newPassword,
    });

    // Hash and update password in Firestore
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').doc(req.user.uid).update({
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
