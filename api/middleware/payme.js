const base64 = require("base-64");

const { PaymeError } = require("../enum/transaction.enum");
const { PaymeTransactionError } = require("./errorHandler");

// Use the correct environment variable names from .env
// Choose test key for development/sandbox, production key for production
const PAYME_MERCHANT_KEY = process.env.NODE_ENV === 'production' 
  ? process.env.PAYME_SECRET_KEY 
  : process.env.PAYME_TEST_KEY;

console.log('Payme middleware initialized:', {
  environment: process.env.NODE_ENV,
  usingTestKey: process.env.NODE_ENV !== 'production',
  hasTestKey: !!process.env.PAYME_TEST_KEY,
  hasProductionKey: !!process.env.PAYME_SECRET_KEY,
  selectedKey: PAYME_MERCHANT_KEY ? '[PRESENT]' : '[MISSING]'
});

exports.paymeCheckToken = (req, res, next) => {
  try {
    const { id } = req.body;
    const authHeader = req.headers.authorization;
    
    console.log('Payme webhook auth check:', {
      hasAuth: !!authHeader,
      hasMerchantKey: !!PAYME_MERCHANT_KEY,
      method: req.body.method,
      id: id
    });

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      console.error('No authorization token provided');
      throw new PaymeTransactionError(PaymeError.InvalidAuthorization, id);
    }

    const data = base64.decode(token);
    console.log('Decoded auth data:', data);

    if (!data.includes(PAYME_MERCHANT_KEY)) {
      console.error('Invalid merchant key in authorization');
      throw new PaymeTransactionError(PaymeError.InvalidAuthorization, id);
    }

    console.log('Payme authorization successful');
    next();
  } catch (err) {
    console.error('Payme auth error:', err);
    
    // Handle PaymeTransactionError with proper JSON-RPC format
    if (err.isTransactionError) {
      const response = {
        error: {
          code: err.transactionErrorCode,
          message: err.transactionErrorMessage,
          data: err.transactionData || null
        },
        id: err.transactionId || null
      };
      return res.status(200).json(response); // Payme always expects 200 status
    }
    
    // Fallback for other errors (shouldn't happen in auth middleware)
    res.status(err.statusCode || 422).json(err.message);
  }
};
