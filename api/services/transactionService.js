const { Transaction } = require("../models");

/**
 * TransactionService - Handles the core business logic for transactions.
 * Supports multiple payment providers: Payme, Click, and future providers.
 */
class TransactionService {
  /**
   * Create a new transaction for any provider
   */
  static async createTransaction(data) {
    const {
      provider,
      providerTransactionId,
      amount,
      currency = 'UZS',
      bookingId,
      userId,
      providerData = {},
      state = 1 // Default to pending state
    } = data;

    return await Transaction.create({
      state,
      amount,
      currency,
      provider,
      providerTransactionId,
      providerData,
      bookingId,
      userId,
      createDate: new Date()
    });
  }

  /**
   * Create a new payme transaction (backward compatibility and unified interface)
   */
  static async createPayme(data) {
    const {
      paymeTransId,
      providerTransactionId,
      amount,
      currency = 'UZS',
      bookingId,
      userId,
      state = 1,
      providerData = {}
    } = data;

    // Use unified interface but maintain backward compatibility
    return await this.createTransaction({
      provider: 'payme',
      providerTransactionId: providerTransactionId || paymeTransId,
      amount,
      currency,
      bookingId,
      userId,
      state,
      providerData: {
        ...providerData,
        // Store both for backward compatibility
        paymeTransId: paymeTransId || providerTransactionId
      }
    });
  }

  /**
   * Create a new Click transaction
   */
  static async createClick(data) {
    const {
      clickInvoiceId,
      amount,
      currency = 'UZS',
      bookingId,
      userId,
      merchantTransId,
      clickPhoneNumber,
      invoiceData = {}
    } = data;

    return await Transaction.create({
      state: 1, // Pending state
      amount,
      currency,
      provider: 'click',
      providerTransactionId: clickInvoiceId,
      providerData: {
        merchantTransId,
        clickPhoneNumber,
        invoiceData,
        createdAt: new Date()
      },
      bookingId,
      userId,
      createDate: new Date()
    });
  }

  /**
   * Update transaction state
   */
  static async updateTransactionState(providerTransactionId, state, additionalData = {}) {
    const updateData = { state };
    
    if (state === 2) { // Paid state
      updateData.performDate = new Date();
    } else if (state === -1 || state === -2) { // Cancelled or failed states
      updateData.cancelDate = new Date();
    }

    if (Object.keys(additionalData).length > 0) {
      // Merge with existing providerData
      const existingTransaction = await Transaction.findOne({
        where: { providerTransactionId }
      });
      
      if (existingTransaction && existingTransaction.providerData) {
        updateData.providerData = {
          ...existingTransaction.providerData,
          ...additionalData
        };
      } else {
        updateData.providerData = additionalData;
      }
    }

    const [affectedRows, updatedRows] = await Transaction.update(updateData, {
      where: { providerTransactionId },
      returning: true
    });

    return updatedRows[0];
  }

  /**
   * Get transaction by provider transaction ID
   */
  static async getByProviderTransactionId(providerTransactionId) {
    return await Transaction.findOne({
      where: { providerTransactionId }
    });
  }

  /**
   * Get transactions for booking
   */
  static async getTransactionsByBooking(bookingId) {
    return await Transaction.findAll({
      where: { bookingId },
      order: [['createDate', 'DESC']]
    });
  }

  /**
   * Get Click transaction by booking ID
   */
  static async getClickTransactionByBooking(bookingId) {
    return await Transaction.findOne({
      where: { 
        bookingId,
        provider: 'click'
      },
      order: [['createDate', 'DESC']]
    });
  }

  /**
   * Get Payme transaction by booking ID
   */
  static async getPaymeTransactionByBooking(bookingId) {
    return await Transaction.findOne({
      where: { 
        bookingId,
        provider: 'payme'
      },
      order: [['createDate', 'DESC']]
    });
  }

  /**
   * Get Octo transaction by booking ID
   */
  static async getOctoTransactionByBooking(bookingId) {
    return await Transaction.findOne({
      where: {
        bookingId,
        provider: 'octo'
      },
      order: [['createDate', 'DESC']]
    });
  }

  /**
   * Delete transaction by ID (for testing and cleanup)
   */
  static async deleteTransaction(transactionId) {
    return await Transaction.destroy({
      where: { id: transactionId }
    });
  }

  /**
   * Delete transactions by provider transaction ID
   */
  static async deleteByProviderTransactionId(providerTransactionId) {
    return await Transaction.destroy({
      where: { providerTransactionId }
    });
  }

  /**
   * Update transaction state by ID (alternative method)
   */
  static async updateById(transactionId, updateData) {
    const [affectedRows, updatedRows] = await Transaction.update(updateData, {
      where: { id: transactionId },
      returning: true
    });

    return updatedRows[0];
  }
}

module.exports = TransactionService;