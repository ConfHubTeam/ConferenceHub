const { ClickTransaction, PaymeTransaction } = require("../models");

/**
 * TransactionService - Handles the core business.
 */
class TransactionService {
  /**
   * Create a new click transaction.
   */
  static async createClick(data) {
    const {
      clickTransId,
      performDate,
      cancelDate,
      createDate,
      bookingId,
      prepareId,
      state,
      amount,
      userId
    } = data;

    return await ClickTransaction.create({
      clickTransId,
      performDate,
      cancelDate,
      createDate,
      bookingId,
      prepareId,
      state,
      amount,
      userId: userId
    });
  }

  /**
   * Create a new payme transaction.
   */
  static async createPayme(data) {
    const {
      paymeTransId,
      performDate,
      cancelDate,
      createDate,
      bookingId,
      state,
      amount,
      userId
    } = data;

    return await PaymeTransaction.create({
      paymeTransId: paymeTransId,
      performDate: performDate,
      cancelDate: cancelDate,
      createDate: createDate,
      bookingId: bookingId,
      state: state,
      amount: amount,
      userId: userId
    });
  }
}

module.exports = TransactionService;
