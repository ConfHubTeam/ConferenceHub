const { ClickTransaction } = require("../models");

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
}

module.exports = TransactionService;
