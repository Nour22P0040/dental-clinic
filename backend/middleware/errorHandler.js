/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    const message = getFirebaseAuthErrorMessage(err.code);
    error = { message, statusCode: 401 };
  }

  // Firestore errors
  if (err.code === 'permission-denied') {
    const message = 'Permission denied';
    error = { message, statusCode: 403 };
  }

  if (err.code === 'not-found') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Get user-friendly error message for Firebase Auth errors
 */
const getFirebaseAuthErrorMessage = (code) => {
  const errorMessages = {
    'auth/email-already-exists': 'Email already in use',
    'auth/invalid-email': 'Invalid email address',
    'auth/invalid-password': 'Password must be at least 6 characters',
    'auth/user-not-found': 'User not found',
    'auth/wrong-password': 'Invalid credentials',
    'auth/id-token-expired': 'Token expired',
    'auth/invalid-id-token': 'Invalid token',
  };

  return errorMessages[code] || 'Authentication error';
};

module.exports = { errorHandler };
