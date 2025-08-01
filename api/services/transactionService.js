const { Transaction } = require("../models");

/**
 * TransactionService - Handles the core business logic for transactions.
 * Note: Click payments now use Merchant API and store data directly in Bookings table.
 */
class TransactionService {
  /**
   * Create a new payme transaction.
   */
  static async createPayme(data) {
    const {
      state,
      amount,
      performDate,
      cancelDate,
      createDate,
      paymeTransId,
      bookingId,
      userId
    } = data;

    return await Transaction.create({
      state,
      amount,
      performDate,
      cancelDate,
      createDate,
      provider: 'payme',
      paymeTransId: paymeTransId,
      bookingId: bookingId,
      userId: userId
    });
  }
}

module.exports = TransactionService;