/**
 * Custom error class for operational errors
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handler for catching async errors in middleware/controllers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

/**
 * Central error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error for debugging
  console.error(`[Error] ${err.name || 'Unknown Error'}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // If it's a Payme transaction error, handle it specifically
  if (err.isTransactionError) {
    return res.status(200).json({
      error: {
        code: err.transactionErrorCode,
        message: err.transactionErrorMessage,
        data: err.transactionData
      },
      id: err.transactionId,
      result: null
    });
  }

  // Handle specific errors
  if (err.name === 'SequelizeValidationError') {
    // Handle database validation errors
    const messages = err.errors.map(e => e.message).join(', ');
    err.statusCode = 422;
    err.message = `Validation error: ${messages}`;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    // Handle unique constraint errors
    err.statusCode = 409;
    err.message = 'This record already exists';
  } else if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Your session has expired';
  }

  // Send response based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production: Don't expose error stack
    return res.status(err.statusCode).json({
      error: err.message,
      ok: false
    });
  } else {
    // Development: Include error details
    return res.status(err.statusCode).json({
      error: err.message,
      stack: err.stack,
      ok: false
    });
  }
};

/**
 * Middleware for handling 404 Not Found
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
  // Skip API endpoints, they have their own error handling
  if (req.path.startsWith('/api/')) {
    return next(new ApiError(404, `API endpoint not found: ${req.path}`));
  }
  
  // For client routes, pass to the client router
  next();
};


/**
 * Custom error class for operational errors
 */
class PaymeTransactionError extends Error {
  constructor(paymeError, id, data) {
    // Extract the English message from the multilingual message object
    const message = paymeError.message?.en || paymeError.message || 'Unknown error';
    super(message);

    this.name = paymeError.name;
    this.statusCode = 200;
    this.transactionErrorCode = paymeError.code;
    this.transactionErrorMessage = paymeError.message;
    this.transactionData = data;
    this.transactionId = id;
    this.isTransactionError = true;
  }
}

module.exports = {
  ApiError,
  PaymeTransactionError,
  catchAsync,
  errorHandler,
  notFound
};
