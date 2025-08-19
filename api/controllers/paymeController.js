const paymeService = require("../services/paymeService");
const { getUserDataFromToken } = require("../middleware/auth");
const { PaymeMethod } = require('../enum/transaction.enum')
const base64 = require('base-64');
const { User, Booking } = require("../models");

/**
 * PAY
 */
const pay = async (req, res) => {
  let requestId = null; // Define outside try-catch for error handling
  
  try {
    const { method, params, id } = req.body;
    requestId = id; // Store for error handling

    switch (method) {
      case PaymeMethod.CheckPerformTransaction: {
        await paymeService.checkPerformTransaction(params, id);
        return res.json({ result: { allow: true } });
      }
      case PaymeMethod.CheckTransaction: {
        const result = await paymeService.checkTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.CreateTransaction: {
        const result = await paymeService.createTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.PerformTransaction: {
        const result = await paymeService.performTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.CancelTransaction: {
        const result = await paymeService.cancelTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.GetStatement: {
        const result = await paymeService.getStatement(params, id);
        return res.json({ result: { transactions: result } });
      }
    }
  } catch (error) {
    console.error('Payme webhook error:', error);
    
    // Handle PaymeTransactionError with proper JSON-RPC format
    if (error.isTransactionError) {
      const response = {
        error: {
          code: error.transactionErrorCode,
          message: error.transactionErrorMessage,
          data: error.transactionData || null
        },
        id: error.transactionId || requestId
      };
      return res.status(200).json(response); // Payme always expects 200 status
    }
    
    // Handle other errors
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode
    });
    
    // Generic error response in JSON-RPC format
    const response = {
      error: {
        code: -32000, // Server error
        message: {
          en: "Internal server error",
          ru: "Внутренняя ошибка сервера", 
          uz: "Ichki server xatosi"
        },
        data: null
      },
      id: requestId || null
    };

    res.status(200).json(response); // Payme always expects 200 status
  }
};

/**
 * Generates a Payme payment link for the booking.
 */
const checkout = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { bookingId, returnUrl } = req.body;

    console.log('Payme checkout request:', { bookingId, returnUrl, userId: userData.id });

    const MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
    if (!MERCHANT_ID) {
      console.error('PAYME_MERCHANT_ID not configured');
      return res.status(500).json({ error: "Payment system not configured" });
    }

    const user = await User.findByPk(userData.id);
    if (!user) {
      console.error('User not found:', userData.id);
      return res.status(404).json({ error: "User not found" });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify booking belongs to user
    if (booking.userId !== userData.id) {
      console.error('Booking access denied:', { bookingId, userId: userData.id, bookingUserId: booking.userId });
      return res.status(403).json({ error: "Access denied" });
    }

    // Amount in tiyin (multiply by 100)
    const amount = Math.round(booking.totalPrice * 100);
    
    // Create the account parameter for Payme
    const account = `booking_id=${bookingId}`;
    
    // Create the base64 encoded parameter
    const params = `m=${MERCHANT_ID};ac.${account};a=${amount};c=${returnUrl || 'https://airbnb-clone.uz/bookings'}`;
    const encodedParams = base64.encode(params);

    const paymentUrl = `https://checkout.paycom.uz/${encodedParams}`;

    console.log('Generated Payme payment URL:', {
      bookingId,
      amount,
      params,
      encodedParams,
      paymentUrl
    });

    return res.json({ 
      success: true,
      url: paymentUrl,
      bookingId,
      amount: booking.totalPrice
    });

  } catch (error) {
    console.error('Payme checkout error:', error);
    return res.status(500).json({ 
      error: "Failed to generate payment link",
      details: error.message
    });
  }
};

/**
 * Get user's phone number for Payme payments
 */
const getUserPhone = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    const user = await User.findByPk(userData.id, {
      attributes: ['id', 'phoneNumber', 'paymePhoneNumber']
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine which phone number to use
    const paymePhoneNumber = user.paymePhoneNumber;
    const profilePhoneNumber = user.phoneNumber;
    const phoneNumber = paymePhoneNumber || profilePhoneNumber;
    const hasPaymePhone = !!paymePhoneNumber;
    const isUsingProfilePhone = !paymePhoneNumber && !!profilePhoneNumber;

    res.json({
      success: true,
      phoneNumber,
      paymePhoneNumber,
      profilePhoneNumber,
      hasPaymePhone,
      isUsingProfilePhone
    });
  } catch (error) {
    console.error('Error fetching user phone:', error);
    res.status(500).json({ 
      error: "Failed to fetch phone number",
      details: error.message
    });
  }
};

/**
 * Update user's Payme phone number
 */
const updatePaymePhone = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const cleanPhone = phoneNumber.trim();

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        error: 'Please enter a valid phone number in international format (e.g., +998901234567)',
        code: 'INVALID_PHONE_FORMAT'
      });
    }

    const user = await User.findByPk(userData.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update or set the Payme phone number
    await user.update({ paymePhoneNumber: cleanPhone });

    res.json({
      success: true,
      message: "Payme phone number updated successfully",
      phoneNumber: cleanPhone
    });
  } catch (error) {
    console.error('Error updating Payme phone:', error);
    res.status(500).json({ 
      error: "Failed to update phone number",
      details: error.message
    });
  }
};

/**
 * Get Payme configuration for frontend
 */
const getConfig = async (req, res) => {
  try {
    const MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
    
    if (!MERCHANT_ID) {
      return res.status(500).json({ error: "Payme merchant ID not configured" });
    }

    res.json({
      success: true,
      merchantId: MERCHANT_ID,
      testMode: process.env.NODE_ENV === 'development'
    });
  } catch (error) {
    console.error('Error getting Payme config:', error);
    res.status(500).json({ 
      error: "Failed to get configuration",
      details: error.message
    });
  }
};

module.exports = {
  pay,
  checkout,
  getUserPhone,
  updatePaymePhone,
  getConfig,
};