const { Transaction } = require("../models");

/**
 * TransactionService - Handles the core business.
 */
class TransactionService {
  /**
   * Create a new click transaction.
   */
  static async createClick(data) {
    const {
      state,
      amount,
      performDate,
      cancelDate,
      createDate,
      prepareId,
      clickTransId,
      bookingId,
      userId
    } = data;

    return await Transaction.create({
      state,
      amount,
      performDate,
      cancelDate,
      createDate,
      provider: 'click',
      prepareId,
      clickTransId,
      bookingId,
      userId: userId,
      paymeTransId: null
    });
  }

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
      prepareId: null,
      clickTransId: null,
      paymeTransId: paymeTransId,
      bookingId: bookingId,
      userId: userId
    });
  }
}

module.exports = TransactionService;