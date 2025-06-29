const transactionService = require("../services/transactionService");
const {
  PaymeError,
  PaymeData,
  TransactionState,
} = require("../enum/transaction.enum");
const { User, Booking, PaymeTransaction } = require("../models");
const { PaymeTransactionError } = require("../middleware/errorHandler");

class PaymeService {
  /**
   * Validates the parameters for performing a transaction.
   */
  async checkPerformTransaction(params, id) {
    let { account, amount } = params;

    const booking = await this._getBookingContext(account.booking_id, id);

    amount = Math.floor(amount / 100);

    if (amount !== booking.totalPrice) {
      throw new PaymeTransactionError(PaymeError.InvalidAmount, id);
    }
  }

  /**
   * Checks the transaction status based on the provided parameters.
   */
  async checkTransaction(params, id) {
    const transaction = await PaymeTransaction.findOne({
      paymeTransId: params.id,
    });
    if (!transaction) {
      throw new PaymeTransactionError(PaymeError.TransactionNotFound, id);
    }

    return {
      create_time: transaction.createDate,
      perform_time: transaction.performDate,
      cancel_time: transaction.cancelDate,
      transaction: transaction.paymeTransId,
      state: transaction.state,
      reason: null,
    };
  }

  /**
   * Creates a new transaction based on the provided parameters.
   */
  async createTransaction(params, id) {
    let { account, time, amount } = params;

    amount = Math.floor(amount / 100);

    await this.checkPerformTransaction(params, id);

    let transaction = await PaymeTransaction.findOne({
      paymeTransId: params.id,
    });

    // If the transaction already exists, check its state
    if (transaction) {
      if (transaction.state !== TransactionState.Pending) {
        throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
      }

      const currentTime = Date.now();

      const expirationTime =
        (currentTime - transaction.createDate) / 60000 < 12;
      if (!expirationTime) {
        await PaymeTransaction.findOneAndUpdate(
          { paymeTransId: params.id },
          { state: TransactionState.PendingCanceled, reason: 4 }
        );
        throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
      }

      return {
        create_time: transaction.createDate,
        transaction: transaction.paymeTransId,
        state: TransactionState.Pending,
      };
    }

    const booking = await Booking.findById(account.booking_id);
    if (!booking) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        requestId,
        PaymeData.BookingId
      );
    }

    transaction = await PaymeTransaction.findOne({
      userId: booking.userId,
      bookingId: account.booking_id,
    });
    if (transaction) {
      if (transaction.state === TransactionState.Paid)
        throw new PaymeTransactionError(PaymeError.AlreadyDone, id);
      if (transaction.state === TransactionState.Pending)
        throw new PaymeTransactionError(PaymeError.Pending, id);
    }

    // Create a new transaction
    const newTransaction = await transactionService.createPayme({
      paymeTransId: params.id,
      performDate: null,
      cancelDate: null,
      createDate: new Date(time),
      bookingId: account.booking_id,
      state: TransactionState.Pending,
      amount: amount,
      userId: booking.userId,
    });

    return {
      transaction: newTransaction.paymeTransId,
      state: TransactionState.Pending,
      create_time: time,
    };
  }

  /**
   * Performs a transaction based on the provided parameters.
   */
  async performTransaction(params, id) {
    const currentTime = Date.now();

    // 1. Find transaction by Payme transaction ID
    const transaction = await PaymeTransaction.findOne({
      paymeTransId: params.id,
    });
    if (!transaction) {
      throw new PaymeTransactionError(PaymeError.TransactionNotFound, id);
    }

    if (transaction.state !== TransactionState.Pending) {
      if (transaction.state !== TransactionState.Paid) {
        throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
      }

      return {
        perform_time: transaction.performDate,
        transaction: transaction.id,
        state: TransactionState.Paid,
      };
    }

    // 4. Check expiration based on createDate (not cancelDate!)
    const isNotExpired = (currentTime - transaction.createDate) / 60000 < 12;
    if (!isNotExpired) {
      await PaymeTransaction.findOneAndUpdate(
        { paymeTransId: params.id },
        {
          state: TransactionState.PendingCanceled,
          cancelDate: currentTime,
        }
      );

      throw new PaymeTransactionError(PaymeError.CantDoOperation, id);
    }

    // 5. Mark transaction as paid
    await PaymeTransaction.findOneAndUpdate(
      { paymeTransId: params.id },
      {
        state: TransactionState.Paid,
        performDate: currentTime,
      }
    );

    return {
      perform_time: currentTime,
      transaction: transaction.paymeTransId,
      state: TransactionState.Paid,
    };
  }

  /**
   * Cancels a transaction based on the provided parameters.
   */
  async cancelTransaction(params, id) {
    const transaction = await PaymeTransaction.findOne({
      paymeTransId: params.id,
    });

    if (!transaction) {
      throw new PaymeTransactionError(PaymeError.TransactionNotFound, id);
    }

    const currentTime = Date.now();

    if (transaction.state > 0) {
      await PaymeTransaction.findOneAndUpdate(
        { paymeTransId: params.id },
        {
          state: -Math.abs(transaction.state),
          cancelDate: currentTime,
        }
      );
    }

    return {
      cancel_time: transaction.cancelDate || currentTime,
      transaction: transaction.id,
      state: -Math.abs(transaction.state),
    };
  }

  /**
   * Retrieves a statement of transactions within a specified time range.
   */
  async getStatement(params) {
    const { from, to } = params;

    const transactions = await PaymeTransaction.find({
      createDate: { $gte: from, $lte: to }
    });

    return transactions.map((transaction) => ({
      id: transaction.paymeTransId,
      time: transaction.createDate,
      amount: transaction.amount,
      account: {
        booking_id: transaction.bookingId
      },
      create_time: transaction.createDate,
      perform_time: transaction.performDate,
      cancel_time: transaction.cancelDate,
      transaction: transaction.paymeTransId,
      state: transaction.state
    }));
  }

  /**
   * Retrieves the booking context based on the booking ID.
   */
  static async _getBookingContext(bookingId, id) {
    if (!Number.isInteger(bookingId)) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new PaymeTransactionError(
        PaymeError.BookingNotFound,
        id,
        PaymeData.BookingId
      );
    }

    const user = await User.findById(booking.userId);
    if (!user) {
      throw new PaymeTransactionError(PaymeError.UserNotFound, id);
    }

    return booking;
  }
}

module.exports = new PaymeService();