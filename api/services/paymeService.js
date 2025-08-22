const PaymeApiService = require('./paymeApiService');
const TransactionService = require('./transactionService');
const {
  PaymeError,
  PaymeData,
  PaymentStatus,
} = require('../enum/transaction.enum');
const { User, Booking, Transaction } = require('../models');
const { PaymeTransactionError } = require('../middleware/errorHandler');

// Define Payme-specific transaction states
const PaymeTransactionState = {
  Paid: 2,
  Pending: 1,
  PendingCanceled: -1,
  PaidCanceled: -2,
};

class PaymeService {
  constructor() {
    // Initialize the API service for making calls TO Payme
    this.apiService = new PaymeApiService(
      process.env.PAYME_MERCHANT_ID,
      process.env.PAYME_TEST_KEY || process.env.PAYME_KEY,
      process.env.PAYME_BASE_URL || 'https://checkout.paycom.uz',
      process.env.NODE_ENV !== 'production'
    );
  }

  /**
   * Check if transaction is expired based on booking check-in date
   * Payment should be valid until the booking check-in date passes
   * @param {Object} booking - Booking object with checkInDate
   * @returns {boolean} True if payment period has expired
   */
  _isPaymentExpired(booking) {
    const currentTime = new Date();
    const checkInDate = new Date(booking.checkInDate);
    
    // Payment is valid until the end of check-in date
    const expirationDate = new Date(checkInDate);
    expirationDate.setHours(23, 59, 59, 999); // End of check-in day
    
    return currentTime > expirationDate;
  }

  /**
   * Validates the parameters for performing a transaction.
   * Called by Payme via webhook to check if transaction can be performed
   */
  async checkPerformTransaction(params, id) {
    let { account, amount } = params;

    // Handle both order_id and booking_id for compatibility
    const rawBookingId = account.order_id || account.booking_id;
    if (!rawBookingId) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    // Extract booking ID from order format (e.g., "booking_126_1755611258912" -> 126)
    const bookingId = this._extractBookingId(rawBookingId);
    const booking = await this._getBookingContext(bookingId, id);

    // Convert booking amount from UZS to tiyin for comparison
    // 1 UZS = 100 tiyin
    const expectedAmountInTiyin = (booking.finalTotal || booking.totalPrice) * 100;

    if (amount !== expectedAmountInTiyin) {
      throw new PaymeTransactionError(PaymeError.InvalidAmount, id);
    }

    return {
      allow: true
    };
  }

  /**
   * Checks the transaction status based on the provided parameters.
   * Called by Payme via webhook to get transaction status
   */
  async checkTransaction(params, id) {
    // Use params.id (Payme transaction ID) not the JSON-RPC id
    const paymeTransactionId = params.id;
    
    const transaction = await TransactionService.getByProviderTransactionId(String(paymeTransactionId));

    if (!transaction) {
      throw new PaymeTransactionError(PaymeError.TransactionNotFound, id);
    }

    return {
      create_time: transaction.createDate ? transaction.createDate.getTime() : null,
      perform_time: transaction.performDate ? transaction.performDate.getTime() : 0,
      cancel_time: transaction.cancelDate ? transaction.cancelDate.getTime() : 0,
      transaction: String(paymeTransactionId),
      state: transaction.state,
      reason: transaction.providerData?.reason || null,
    };
  }

  /**
   * Creates a new transaction based on the provided parameters.
   * Called by Payme via webhook to create a new transaction
   * 
   * IMPORTANT: Must return consistent results for repeated calls with same transaction ID
   */
  async createTransaction(params, id) {
    let { account, time, amount } = params;
    
    // Use params.id as the Payme transaction ID (not the JSON-RPC id)
    const paymeTransactionId = params.id;

    // Handle both order_id and booking_id for compatibility
    const rawBookingId = account.order_id || account.booking_id;
    if (!rawBookingId) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    // Extract booking ID from order format (e.g., "booking_126_1755611258912" -> 126)
    const bookingId = this._extractBookingId(rawBookingId);

    // STEP 0.5: Check if booking already has a pending transaction FIRST
    // This prevents creating multiple transactions for the same booking
    const existingBookingTrans = await TransactionService.getPaymeTransactionByBooking(bookingId);
    
    if (existingBookingTrans && existingBookingTrans.providerTransactionId !== String(paymeTransactionId)) {
      if (existingBookingTrans.state === PaymeTransactionState.Paid) {
        throw new PaymeTransactionError(PaymeError.CantDoOperation, paymeTransactionId);
      }
      
      if (existingBookingTrans.state === PaymeTransactionState.Pending) {
        // Check if the existing transaction has expired
        const booking = await Booking.findByPk(bookingId);
        const isExpired = this._isPaymentExpired(booking);
        
        if (isExpired) {
          // Cancel the expired transaction and allow creating a new one
          await TransactionService.updateTransactionState(
            existingBookingTrans.providerTransactionId,
            PaymeTransactionState.PendingCanceled,
            { reason: 4, canceledAt: new Date(), expiredReason: 'Booking check-in date passed' }
          );
        } else {
          // According to Payme spec: return error in range -31099 to -31050 for account issues
          // Use -31050 for "Payment for the product is pending"
          throw new PaymeTransactionError(PaymeError.Pending, paymeTransactionId);
        }
      }
    }

    // STEP 1: Check if transaction with this exact Payme ID already exists
    // If yes, return the existing transaction (consistent results for repeated calls)
    let existingTransaction = await TransactionService.getByProviderTransactionId(String(paymeTransactionId));
    
    if (existingTransaction) {
      // Get booking to check expiration based on check-in date
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        throw new PaymeTransactionError(
          PaymeError.BookingNotFound,
          id,
          PaymeData.BookingId
        );
      }

      // Check if payment period has expired (based on booking check-in date)
      const isExpired = this._isPaymentExpired(booking);
      
      if (isExpired && existingTransaction.state === PaymeTransactionState.Pending) {
        // Cancel expired transaction
        await TransactionService.updateTransactionState(
          String(paymeTransactionId),
          PaymeTransactionState.PendingCanceled,
          { reason: 4, canceledAt: new Date(), expiredReason: 'Booking check-in date passed' }
        );
        throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
      }

      // Return existing transaction (consistent response)
      return {
        create_time: existingTransaction.createDate.getTime(),
        transaction: String(paymeTransactionId),
        state: existingTransaction.state,
      };
    }

    // STEP 2: Validate booking and amount (only for new transactions)
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    // Validate amount FIRST: convert booking amount from UZS to tiyin for comparison
    const expectedAmountInTiyin = (booking.finalTotal || booking.totalPrice) * 100;
    if (amount !== expectedAmountInTiyin) {
      throw new PaymeTransactionError(PaymeError.InvalidAmount, id);
    }

    // Validate booking status - must be 'selected' to allow payment
    if (booking.status !== 'selected') {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    // Check if payment period has expired (based on booking check-in date)
    const isExpired = this._isPaymentExpired(booking);
    
    if (isExpired) {
      throw new PaymeTransactionError(
        PaymeError.TransactionNotFound,
        id,
        PaymeData.BookingId
      );
    }

    // STEP 3: Check if booking already has a pending payment (different transaction ID)
    // According to Payme spec: return existing transaction, don't create multiple transactions
    const existingBookingTransaction = await TransactionService.getPaymeTransactionByBooking(bookingId);
    
    if (existingBookingTransaction) {
      if (existingBookingTransaction.state === PaymeTransactionState.Paid) {
        throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
      }
      
      if (existingBookingTransaction.state === PaymeTransactionState.Pending) {
        // Booking already has a pending transaction - check if it's expired
        const isExpired = this._isPaymentExpired(booking);
        
        if (isExpired) {
          // Cancel the expired transaction and allow creating a new one
          await TransactionService.updateTransactionState(
            existingBookingTransaction.providerTransactionId,
            PaymeTransactionState.PendingCanceled,
            { reason: 4, canceledAt: new Date(), expiredReason: 'Booking check-in date passed' }
          );
        } else {
          // Return the existing pending transaction instead of creating a new one
          return {
            create_time: existingBookingTransaction.createDate.getTime(),
            transaction: existingBookingTransaction.providerTransactionId,
            state: existingBookingTransaction.state,
          };
        }
      }
    }

    // STEP 4: Create new transaction
    const amountInUzs = Math.floor(amount / 100);
    
    const newTransaction = await TransactionService.createTransaction({
      provider: 'payme',
      providerTransactionId: String(paymeTransactionId),
      amount: amountInUzs,
      currency: 'UZS',
      bookingId: bookingId,
      userId: booking.userId,
      state: PaymeTransactionState.Pending,
      providerData: {
        account: account,
        originalAmount: amount, // Keep original tiyin amount
        payme_time: time || Date.now(),
        merchant_reference: booking.uniqueRequestId,
        createdAt: new Date()
      }
    });

    return {
      create_time: newTransaction.createDate.getTime(),
      transaction: String(paymeTransactionId),
      state: PaymeTransactionState.Pending,
    };
  }

  /**
   * Performs a transaction based on the provided parameters.
   * Called by Payme via webhook to confirm/perform the transaction
   */
  async performTransaction(params, id) {
    const currentTime = Date.now();
    const paymeTransactionId = params.id;

    // Find transaction using TransactionService
    const transaction = await TransactionService.getByProviderTransactionId(String(paymeTransactionId));

    if (!transaction) {
      throw new PaymeTransactionError(PaymeError.TransactionNotFound, id);
    }

    if (transaction.state !== PaymeTransactionState.Pending) {
      if (transaction.state !== PaymeTransactionState.Paid) {
        throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
      }

      return {
        perform_time: transaction.performDate.getTime(),
        transaction: String(paymeTransactionId),
        state: PaymeTransactionState.Paid,
      };
    }

    // Check expiration (12 minutes from creation)
    const isNotExpired = (currentTime - transaction.createDate.getTime()) / 60000 < 12;
    if (!isNotExpired) {
      await TransactionService.updateTransactionState(
        String(paymeTransactionId),
        PaymeTransactionState.PendingCanceled,
        { reason: 4, expiredAt: new Date() }
      );

      throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
    }

    // Mark transaction as paid using TransactionService
    const performTime = currentTime; // Store the exact timestamp we'll return
    await TransactionService.updateTransactionState(
      String(paymeTransactionId),
      PaymeTransactionState.Paid,
      {
        performedAt: new Date(performTime), // Store in providerData for reference
        payment_response: {
          provider: 'payme',
          transaction_id: String(paymeTransactionId),
          amount: transaction.amount,
          perform_time: performTime
        }
      }
    );

    // Update the performDate field directly to our specific timestamp
    await TransactionService.updateById(transaction.id, {
      performDate: new Date(performTime)
    });

    // Update booking status to paid
    const booking = await Booking.findByPk(transaction.bookingId);
    if (booking) {
      await booking.update({
        status: 'approved',
        paidAt: new Date(performTime), // Use the same timestamp
        approvedAt: new Date(performTime), // Set approved timestamp
        paymentResponse: {
          provider: 'payme',
          transaction_id: String(paymeTransactionId),
          amount: transaction.amount,
          perform_time: performTime
        }
      });
    }

    return {
      perform_time: performTime, // Return the same timestamp we stored
      transaction: String(paymeTransactionId),
      state: PaymeTransactionState.Paid,
    };
  }

  /**
   * Cancels a transaction based on the provided parameters.
   * Called by Payme via webhook to cancel the transaction
   */
  async cancelTransaction(params, id) {
    const paymeTransactionId = params.id;
    
    const transaction = await TransactionService.getByProviderTransactionId(String(paymeTransactionId));

    if (!transaction) {
      throw new PaymeTransactionError(PaymeError.TransactionNotFound, id);
    }

    const currentTime = Date.now();
    const reason = params.reason || 1;

    // Only update if transaction is not already cancelled (state > 0)
    if (transaction.state > 0) {
      await TransactionService.updateTransactionState(
        String(paymeTransactionId),
        -Math.abs(transaction.state),
        { 
          reason: reason,
          cancelledAt: new Date(currentTime)
        }
      );
      
      // Return response for newly cancelled transaction
      return {
        cancel_time: currentTime,
        transaction: String(paymeTransactionId),
        state: -Math.abs(transaction.state),
      };
    } else {
      // Transaction is already cancelled, return existing cancelled state
      return {
        cancel_time: transaction.cancelDate ? transaction.cancelDate.getTime() : currentTime,
        transaction: String(paymeTransactionId),
        state: transaction.state, // Already negative
      };
    }
  }

  /**
   * Retrieves a statement of transactions within a specified time range.
   * Called by Payme via webhook to get transaction history
   */
  async getStatement(params) {
    const { from, to } = params;

    // Use TransactionService to get transactions with proper filtering
    const transactions = await Transaction.findAll({
      where: {
        provider: 'payme',
        createDate: {
          [require('sequelize').Op.gte]: new Date(from),
          [require('sequelize').Op.lte]: new Date(to)
        }
      },
      include: [{
        model: Booking,
        as: 'booking',
        required: false
      }]
    });

    return {
      transactions: transactions.map((transaction) => ({
        id: transaction.providerTransactionId,
        time: transaction.createDate.getTime(),
        amount: transaction.providerData?.originalAmount || (transaction.amount * 100),
        account: {
          booking_id: transaction.bookingId.toString()
        },
        create_time: transaction.createDate.getTime(),
        perform_time: transaction.performDate ? transaction.performDate.getTime() : 0,
        cancel_time: transaction.cancelDate ? transaction.cancelDate.getTime() : 0,
        transaction: transaction.providerTransactionId,
        state: transaction.state,
        reason: transaction.providerData?.reason || null
      }))
    };
  }

  /**
   * Retrieves the booking context based on the booking ID.
   * Internal helper method
   */
  async _getBookingContext(bookingId, id) {
    // Handle both string and number booking IDs
    const bookingIdNum = parseInt(bookingId);
    if (!Number.isInteger(bookingIdNum) || bookingIdNum <= 0) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    const booking = await Booking.findByPk(bookingIdNum);
    if (!booking) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    const user = await User.findByPk(booking.userId);
    if (!user) {
      throw new PaymeTransactionError(PaymeError.UserNotFound, id);
    }

    return booking;
  }

  /**
   * Extracts the booking ID from various order ID formats.
   * Handles formats like:
   * - "booking_126_1755611258912" -> 126
   * - "126" -> 126
   * - 126 -> 126
   */
  _extractBookingId(rawBookingId) {
    // If it's already a number, return it
    if (typeof rawBookingId === 'number') {
      return rawBookingId;
    }

    // If it's a string, try to extract booking ID
    const str = String(rawBookingId);
    
    // Check if it's in the format "booking_ID_timestamp"
    const bookingMatch = str.match(/^booking_(\d+)_\d+$/);
    if (bookingMatch) {
      return parseInt(bookingMatch[1]);
    }
    
    // Check if it's just a number string
    const numMatch = str.match(/^\d+$/);
    if (numMatch) {
      return parseInt(str);
    }
    
    // If no pattern matches, try to parse as integer
    const parsed = parseInt(str);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
    
    // If all else fails, throw error (this will be caught by the calling method)
    throw new Error(`Invalid booking ID format: ${rawBookingId}`);
  }

  /**
   * API methods for making calls TO Payme (using PaymeApiService)
   */

  /**
   * Create a payment URL for a booking
   */
  async createPaymentUrl(booking, user, returnUrl) {
    const amount = this.apiService.convertToTiyin(booking.finalTotal);
    const account = this.apiService.createAccountObject(booking, user);
    const transactionId = `payment-${booking.id}-${Date.now()}`;

    return this.apiService.generateCheckoutUrl(transactionId, returnUrl);
  }

  /**
   * Check if a payment can be performed (internal API call)
   */
  async checkPaymentAvailability(booking, user) {
    const amount = this.apiService.convertToTiyin(booking.finalTotal);
    const account = this.apiService.createAccountObject(booking, user);

    try {
      const result = await this.apiService.checkPerformTransaction(amount, account);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PaymeService();