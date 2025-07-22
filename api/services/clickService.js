const {
  Booking,
  Place,
  User,
  Transaction,
} = require("../models");

const {
  ClickError,
  ClickAction,
  TransactionState,
} = require("../enum/transaction.enum");

const clickCheckToken = require("../utils/clickUtil");
const transactionService = require("../services/transactionService");
/**
 * ClickService - Handles the core business logic for Click payment integration.
 */
class ClickService {
  /**
   * Prepares and validates incoming Click transaction data.
   */
  static async prepare(data) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = data;

    const booking = await this._getBookingContext(merchant_trans_id);
    console.log('Booking:', booking);
    if (booking.error) return booking;

    const userId = booking.booking.userId;
    const bookingId = booking.booking.id;

    const signatureData = {
      click_trans_id,
      service_id,
      bookingId,
      amount,
      action,
      sign_time,
    };
    
    console.log('📝 Prepare - Checking signature:', signatureData);
    const checkSignature = clickCheckToken(signatureData, sign_string);
    if (!checkSignature) {
      return { error: ClickError.SignFailed, error_note: "Invalid sign" };
    }

    // Get the correct total amount (same logic as in controller)
    const bookingAmount = booking.booking.finalTotal
    const expectedAmount = parseFloat(bookingAmount).toFixed(2);
    const receivedAmount = parseFloat(amount).toFixed(2);

    if (receivedAmount !== expectedAmount) {
      return {
        error: ClickError.InvalidAmount,
        error_note: `Incorrect parameter amount. Expected: ${expectedAmount}, Received: ${receivedAmount}`,
      };
    }

    if (parseInt(action) !== ClickAction.Prepare) {
      return {
        error: ClickError.ActionNotFound,
        error_note: "Action not found",
      };
    }
    
    console.log("Amount from click:", amount);
    console.log("Booking price:", booking.totalPrice);
    // ------------------- TRANSACTION CHECK -------------------
    const validationError = await this._validationTransaction({
      click_trans_id,
      bookingId,
      userId,
    });
    console.log(validationError)
    if (validationError) return validationError;

    // ------------------- TRANSACTION CREATE -------------------
    const time = new Date().getTime();

    try{
    await transactionService.createClick({
      clickTransId: click_trans_id,
      performDate: null,
      cancelDate: null,
      createDate: new Date(time),
      bookingId: bookingId,
      prepareId: time,
      state: TransactionState.Pending,
      amount: amount,
      userId: userId,
    });
  console.log("Transaction written to DB");
  } catch (err) {
    console.error("Transaction save error:", err);
  }

    // Capture prepare response for testing/debugging
    const prepareResponse = {
      timestamp: new Date(),
      action: 'prepare',
      click_response: data,
      status: 'prepared'
    };

    // Update booking with prepare response (this will overwrite previous responses)
    await booking.booking.update({
      paymentResponse: prepareResponse
    });

    console.log('📝 Prepare response captured for booking:', booking.booking.id, prepareResponse);

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: time,
      error: ClickError.Success,
      error_note: "Success",
    };
  }

  /**
   * Finalizes the payment transaction after successful validation.
   */
  static async complete(data) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
      sign_string,
      error,
    } = data;

    const booking = await this._getBookingContext(merchant_trans_id);
    if (booking.error) return booking;

    const userId = booking.booking.userId;
    const bookingId = booking.booking.id;

    const signatureData = {
      click_trans_id,
      service_id,
      bookingId,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
    };

    console.log('📝 Complete - Checking signature:', signatureData);
    const checkSignature = clickCheckToken(signatureData, sign_string);

    if (!checkSignature) {
      return { error: ClickError.SignFailed, error_note: "Invalid sign" };
    }

    // Get the correct total amount (same logic as in controller and prepare)
    const bookingAmount = booking.booking.finalTotal || booking.booking.totalPrice;
    const expectedAmount = parseFloat(bookingAmount).toFixed(2);
    const receivedAmount = parseFloat(amount).toFixed(2);

    if (receivedAmount !== expectedAmount) {
      return {
        error: ClickError.InvalidAmount,
        error_note: `Incorrect parameter amount. Expected: ${expectedAmount}, Received: ${receivedAmount}`,
      };
    }

    if (parseInt(action) !== ClickAction.Complete) {
      return {
        error: ClickError.ActionNotFound,
        error_note: "Action not found",
      };
    }

    // ------------------- TRANSACTION CHECK -------------------
    const isPrepared = await Transaction.findOne({
      where: {
        prepareId: merchant_prepare_id,
      },
    });

    if (!isPrepared) {
      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }

    const validation = await this._validationTransaction({
      click_trans_id,
      bookingId,
      userId,
    });
    if (validation) return validation;

    const time = new Date().getTime();

    // IF ERROR IS NEGATIVE, IT MEANS THE TRANSACTION WAS CANCELED
    const clickTransaction = await Transaction.findOne({
      where: { clickTransId: click_trans_id }
    });

    if (error < 0) {
      if (clickTransaction) {
          await clickTransaction.update({
            cancelDate: new Date(time),
            state: TransactionState.Canceled,
          });
      }

      // Capture failed payment response for testing/debugging
      const failedPaymentResponse = {
        timestamp: new Date(),
        action: 'complete',
        click_response: data,
        status: 'failed',
        error_code: error
      };

      // Update booking with failed payment response
      await booking.booking.update({
        paymentResponse: failedPaymentResponse
      });

      console.log('❌ Failed payment response captured for booking:', booking.booking.id, failedPaymentResponse);

      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }

    // THAT SUCCESSFUL PAYMENT
    await clickTransaction.update({
      performDate: new Date(time),
      state: TransactionState.Paid,
    });

    // Capture payment response for testing/debugging
    const paymentResponse = {
      timestamp: new Date(),
      action: 'complete',
      click_response: data,
      status: 'success'
    };

    // Update booking status to approved after successful payment
    await booking.booking.update({
      status: 'approved',
      paymentStatus: 'paid',
      approvedAt: new Date(),
      paymentResponse: paymentResponse
    });

    console.log('💰 Payment successful! Booking status updated to approved:', booking.booking.id, paymentResponse);

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: time,
      error: ClickError.Success,
      error_note: "Success",
    };
  }

    /**
   * Generates a Click payment link for the booking.
   */
  static async makeClickPaymentLink(data) {
    const { bookingId, bookingReference, amount, serviceId, merchantId, baseUrl, clientBaseUrl } = data;

    console.log(`🔗 Generating Click payment link:`, {
      bookingId,
      bookingReference,
      amount,
      serviceId,
      merchantId,
      baseUrl,
      clientBaseUrl
    });

    // Validate that amount is not NaN
    if (!amount || isNaN(parseFloat(amount))) {
      console.error('❌ Invalid amount for payment link:', amount);
      throw new Error(`Invalid amount: ${amount}`);
    }

    // Validate that bookingReference exists
    if (!bookingReference) {
      console.error('❌ Missing unique booking reference:', bookingReference);
      throw new Error('Booking reference (uniqueRequestId) is required');
    }

    // Validate that bookingId exists for return URL
    if (!bookingId) {
      console.error('❌ Missing booking ID for return URL:', bookingId);
      throw new Error('Booking ID is required for return URL');
    }

    // Build the payment URL with return_url parameter
    const returnUrl = `${clientBaseUrl || process.env.CLIENT_BASE_URL}/account/bookings/${bookingId}`;
    const url = `${baseUrl}/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${bookingReference}&return_url=${encodeURIComponent(returnUrl)}`;
    
    console.log(`✅ Generated Click payment URL with return URL: ${url}`);
    console.log(`📍 Return URL: ${returnUrl}`);
    
    return url;
  }

  /**
   * Retrieves the booking context based on unique request ID only.
   */
  static async _getBookingContext(identifier) {
    // Find booking only by uniqueRequestId
    const booking = await Booking.findOne({
      where: {
        uniqueRequestId: identifier
      }
    });

    if (!booking) {
      console.error(`❌ Booking not found for unique request ID: ${identifier}`);
      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }

    const user = await User.findByPk(booking.userId);
    if (!user) {
      return { error: ClickError.UserNotFound, error_note: "User not found" };
    }

    const place = await Place.findByPk(booking.placeId);
    if (!place) {
      return { error: ClickError.BadRequest, error_note: "Place not found" };
    }

    console.log(`✅ Found booking: ID=${booking.id}, UniqueID=${booking.uniqueRequestId}, Status=${booking.status}`);
    return { booking };
  }

  /**
   * Validates the Click transaction.
   */
  static async _validationTransaction(data) {
    const { click_trans_id, bookingId, userId } = data;

    const isAlreadyPaid = await Transaction.findOne({
      where: {
        bookingId: bookingId,
        userId: userId,
        state: TransactionState.Paid,
      }
    });

    if (isAlreadyPaid) {
      return { error: ClickError.AlreadyPaid, error_note: "Already paid" };
    }

    const clickTransaction = await Transaction.findOne({
      where: { clickTransId: click_trans_id },
    });

    if (
      clickTransaction &&
      clickTransaction.state === TransactionState.Canceled
    ) {
      return {
        error: ClickError.TransactionCanceled,
        error_note: "Transaction canceled",
      };
    }
  }
}

module.exports = ClickService;
