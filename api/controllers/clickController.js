const ClickMerchantApiService = require("../services/clickMerchantApiService");
const EnhancedClickService = require("../services/enhancedClickService");
const { getUserDataFromToken } = require("../middleware/auth");
const { User, Booking } = require("../models");

/**
 * Creates a Click invoice for the booking using Enhanced Click Service.
 * This is the main payment endpoint that replaces the old checkout method.
 */
const createPaymentInvoice = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { bookingId, clickPhoneNumber } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        error: "Booking ID is required" 
      });
    }

    const userId = userData.id;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ 
        error: "Access denied. You can only create payment invoices for your own bookings" 
      });
    }

    // Use the provided Click phone number or fall back to user's phone number
    const phoneForPayment = clickPhoneNumber || user.phoneNumber || user.telegramPhone;
    
    if (!phoneForPayment) {
      return res.status(400).json({
        error: "Phone number is required for Click payments. Please provide your Click account phone number."
      });
    }

    // Use Enhanced Click Service to create invoice
    const enhancedClickService = new EnhancedClickService();
    const result = await enhancedClickService.createPaymentInvoice({
      bookingId: bookingId,
      userPhone: phoneForPayment
    });

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to create payment invoice",
        details: result.error
      });
    }

    res.json({ 
      success: true,
      url: result.paymentUrl, // Frontend expects 'url'
      invoiceId: result.invoiceId,
      paymentUrl: result.paymentUrl, // Keep backward compatibility
      amount: result.amount,
      bookingId: bookingId,
      merchantTransId: result.merchantTransId,
      alreadyExists: result.alreadyExists || false
    });
    
  } catch (error) {
    console.error("💥 Create payment invoice exception:", error);
    res.status(500).json({ 
      error: "Failed to create payment invoice",
      details: error.message
    });
  }
};

/**
 * Checks the payment status of a booking using Enhanced Click Service.
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ 
        error: "Booking ID is required" 
      });
    }

    const userId = userData.id;

    // Verify booking exists and belongs to user
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ 
        error: "Access denied" 
      });
    }

    // Use Enhanced Click Service to verify payment
    const enhancedClickService = new EnhancedClickService();
    const result = await enhancedClickService.processPaymentVerification(bookingId);

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to check payment status",
        details: result.error
      });
    }

    res.json({
      success: true,
      isPaid: result.isPaid,
      paymentId: result.paymentId,
      bookingStatus: result.bookingStatus,
      message: result.message,
      alreadyProcessed: result.alreadyProcessed || false
    });
    
  } catch (error) {
    console.error("💥 Check payment status exception:", error);
    res.status(500).json({ 
      error: "Failed to check payment status",
      details: error.message
    });
  }
};

/**
 * Gets comprehensive payment information using Enhanced Click Service.
 */
const getPaymentInfo = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ 
        error: "Booking ID is required" 
      });
    }

    const userId = userData.id;

    // Verify booking exists and belongs to user
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ 
        error: "Access denied" 
      });
    }

    // Use Enhanced Click Service to get payment info
    const enhancedClickService = new EnhancedClickService();
    const result = await enhancedClickService.getPaymentInfo(bookingId);

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to get payment information",
        details: result.error
      });
    }

    res.json(result);
    
  } catch (error) {
    console.error("💥 Get payment info exception:", error);
    res.status(500).json({ 
      error: "Failed to get payment information",
      details: error.message
    });
  }
};

/**
 * Get user's phone number for Click payment verification
 */
const getUserPhoneForClick = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const userId = userData.id;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return available phone numbers (prioritize phoneNumber over telegramPhone)
    const primaryPhone = user.phoneNumber || user.telegramPhone;
    
    res.json({
      success: true,
      phoneNumber: primaryPhone,
      hasPhoneNumber: !!primaryPhone,
      alternativePhone: user.phoneNumber ? user.telegramPhone : user.phoneNumber
    });
    
  } catch (error) {
    console.error("💥 Get user phone exception:", error);
    res.status(500).json({ 
      error: "Failed to get user phone number",
      details: error.message
    });
  }
};

module.exports = {
  createPaymentInvoice,
  checkPaymentStatus,
  getPaymentInfo,
  getUserPhoneForClick
};
