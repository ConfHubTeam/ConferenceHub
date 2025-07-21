const clickService = require("../services/clickService");
const { getUserDataFromToken } = require("../middleware/auth");
const { User, Booking } = require("../models");

/**
 * Prepares and validates incoming Click transaction data.
 * Must respond with exact format as per Click.uz documentation
 */
const prepare = async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Click PREPARE request:", JSON.stringify(data, null, 2));
    
    // Validate required fields for PREPARE
    const requiredFields = ['click_trans_id', 'service_id', 'merchant_trans_id', 'amount', 'action', 'sign_time', 'sign_string'];
    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
    
    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      const errorResponse = {
        error: -8,
        error_note: `Missing required fields: ${missingFields.join(', ')}`
      };
      return res.status(200).json(errorResponse);
    }

    const result = await clickService.prepare(data);
    console.log("📤 Click PREPARE result:", JSON.stringify(result, null, 2));
    
    // Ensure response has all required fields
    const response = {
      click_trans_id: result.click_trans_id,
      merchant_trans_id: result.merchant_trans_id,
      merchant_prepare_id: result.merchant_prepare_id,
      error: result.error,
      error_note: result.error_note
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error("💥 Click PREPARE exception:", error);
    const errorResponse = { 
      error: -8, 
      error_note: "Internal server error" 
    };
    res.status(200).json(errorResponse);
  }
};

/**
 * Finalizes the payment transaction after successful validation.
 * Must respond with exact format as per Click.uz documentation
 */
const complete = async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Click COMPLETE request:", JSON.stringify(data, null, 2));
    
    // Validate required fields for COMPLETE
    const requiredFields = ['click_trans_id', 'service_id', 'merchant_trans_id', 'merchant_prepare_id', 'amount', 'action', 'sign_time', 'sign_string', 'error'];
    const missingFields = requiredFields.filter(field => data[field] === undefined);
    
    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      const errorResponse = {
        error: -8,
        error_note: `Missing required fields: ${missingFields.join(', ')}`
      };
      return res.status(200).json(errorResponse);
    }

    const result = await clickService.complete(data);
    console.log("📤 Click COMPLETE result:", JSON.stringify(result, null, 2));
    
    // Ensure response has all required fields
    const response = {
      click_trans_id: result.click_trans_id,
      merchant_trans_id: result.merchant_trans_id,
      merchant_confirm_id: result.merchant_confirm_id,
      error: result.error,
      error_note: result.error_note
    };
    
    res
      .status(200)
      .set({
        "Content-Type": "application/json; charset=UTF-8",
      })
      .json(response);
  } catch (error) {
    console.error("💥 Click COMPLETE exception:", error);
    const errorResponse = { 
      error: -8, 
      error_note: "Internal server error" 
    };
    res.status(200).json(errorResponse);
  }
};

/**
 * Generates a Click payment link for the booking.
 */
const checkout = async (req, res) => {
  try {
    // Extract user data from authentication token
    const userData = await getUserDataFromToken(req);
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        error: "Booking ID is required" 
      });
    }

    const userId = userData.id;
    const MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
    const SERVICE_ID = process.env.CLICK_SERVICE_ID;
    const CHECKOUT_LINK = process.env.CLICK_CHECKOUT_LINK;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify booking exists and belongs to user (or user has access)
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    // Ensure the booking belongs to the authenticated user
    if (booking.userId !== userId) {
      return res.status(403).json({ 
        error: "Access denied. You can only create payment links for your own bookings" 
      });
    }

    // Verify booking is in a payable state (selected)
    if (booking.status !== 'selected') {
      return res.status(400).json({ 
        error: "Payment is only available for selected bookings" 
      });
    }

    // Calculate total amount from booking data - use finalTotal if available, otherwise totalPrice
    const bookingAmount = booking.finalTotal || booking.totalPrice;
    
    if (!bookingAmount || isNaN(bookingAmount)) {
      return res.status(400).json({ 
        error: "Invalid booking amount. Cannot process payment." 
      });
    }
    
    const totalAmount = parseFloat(bookingAmount).toFixed(2);

    // Generate Click payment link
    const clickPaymentLink = await clickService.makeClickPaymentLink({
      bookingId: bookingId,
      bookingReference: booking.uniqueRequestId,
      amount: totalAmount,
      serviceId: SERVICE_ID,
      merchantId: MERCHANT_ID,
      baseUrl: CHECKOUT_LINK,
      clientBaseUrl: process.env.CLIENT_BASE_URL,
    });

    res.json({ 
      success: true,
      url: clickPaymentLink,
      amount: totalAmount,
      bookingId: bookingId
    });
    
  } catch (error) {
    console.error("💥 Click checkout exception:", error);
    res.status(500).json({ 
      error: "Failed to generate payment link",
      details: error.message
    });
  }
};

module.exports = {
  prepare,
  complete,
  checkout,
};
