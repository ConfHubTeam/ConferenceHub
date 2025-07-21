const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * Extract and verify user data from JWT token
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - The user data contained in the token
 */
const getUserDataFromToken = (req) => {
  return new Promise((resolve, reject) => {
    // Try to get token from cookies first
    let token = req.cookies.token;
    
    // If not in cookies, check Authorization header
    if (!token && req.headers.authorization) {
      // Extract token from Bearer token format
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return reject(new Error('No authentication token found'));
    }
    
    jwt.verify(token, authConfig.jwt.secret, {}, async (err, userData) => {
      if (err) reject(err);
      resolve(userData);
    });
  });
};

/**
 * Middleware to verify if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required. Please log in.'
      });
    }
    
    // Verify the token
    const decodedToken = jwt.verify(token, authConfig.jwt.secret);
    
    // Add user data to request object
    req.userData = decodedToken;
    req.userId = decodedToken.id;
    req.userEmail = decodedToken.email;
    req.userType = decodedToken.userType;
    req.user = decodedToken; // Add this for controllers expecting req.user
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        error: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok: false,
        error: 'Invalid authentication token. Please log in again.'
      });
    }
    
    // For any other errors
    return res.status(500).json({
      ok: false,
      error: 'Authentication error. Please try again later.'
    });
  }
};

/**
 * Middleware to verify if user has a specific role
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const hasRole = (roles) => {
  return async (req, res, next) => {
    try {
      // First make sure user is authenticated
      const userData = await getUserDataFromToken(req);
      
      // Check if user has one of the required roles
      if (roles.includes(userData.userType)) {
        req.userData = userData; // Attach the userData to the request object
        next();
      } else {
        res.status(403).json({ error: "Insufficient permissions" });
      }
    } catch (error) {
      res.status(401).json({ error: "Authentication required" });
    }
  };
};

/**
 * Middleware for optional authentication - doesn't reject if no token is present
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      // If no token, just continue without setting user
      req.user = null;
      return next();
    }
    
    // Verify token
    jwt.verify(token, authConfig.jwt.secret, {}, async (err, userData) => {
      if (err) {
        // Invalid token, but don't block access
        req.user = null;
        return next();
      }
      
      // Token is valid, set userData
      req.user = userData;
      next();
    });
  } catch (error) {
    // Error occurred, but don't block access
    req.user = null;
    next();
  }
};

/**
 * Middleware to check if user has admin role (userType: 'agent')
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated and has admin role
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }
    
    if (req.user.userType !== 'agent') {
      return res.status(403).json({
        ok: false,
        error: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Authorization check failed'
    });
  }
};

module.exports = {
  getUserDataFromToken,
  isAuthenticated,
  authenticateToken: isAuthenticated, // Alias for consistency
  hasRole,
  optionalAuth,
  isAdmin
};