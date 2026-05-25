const { auth, db } = require('../config/firebase');

/**
 * Middleware to protect routes - verify token (UID or Firebase ID token)
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // For custom tokens from our login, the token is actually the UID
      // Try to get user directly by UID first
      let userDoc;
      try {
        userDoc = await db.collection('users').doc(token).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          if (!userData.isActive) {
            return res.status(401).json({
              success: false,
              message: 'User account is inactive',
            });
          }

          // Attach user to request
          req.user = {
            uid: userDoc.id,
            ...userData,
          };

          return next();
        }
      } catch (error) {
        // Not a UID, try to verify as Firebase ID token
      }

      // If not a UID, try to verify as Firebase ID token
      try {
        const decodedToken = await auth.verifyIdToken(token);
        
        // Get user from Firestore
        userDoc = await db.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
          return res.status(401).json({
            success: false,
            message: 'User not found',
          });
        }

        const userData = userDoc.data();

        if (!userData.isActive) {
          return res.status(401).json({
            success: false,
            message: 'User account is inactive',
          });
        }

        // Attach user to request
        req.user = {
          uid: userDoc.id,
          ...userData,
        };

        next();
      } catch (verifyError) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token failed',
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

/**
 * Middleware to authorize specific roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
