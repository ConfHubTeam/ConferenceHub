const jwt = require('jsonwebtoken');

// Auth middleware to verify JWT tokens
module.exports = async (req, res, next) => {
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
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user ID to request object
    req.userId = decodedToken.id;
    req.userEmail = decodedToken.email;
    req.userType = decodedToken.userType;
    
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