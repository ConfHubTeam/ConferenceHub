const paymeService = require("../services/paymeService");
const { getUserDataFromToken } = require("../middleware/auth");
const { PaymeMethod } = require('../enum/transaction.enum')
const base64 = require('base-64');
const { User, Booking } = require("../models");

/**
 * PAY
 */
const pay = async (req, res) => {
  try {
    const { method, params, id } = req.body;

    switch (method) {
      case PaymeMethod.CheckPerformTransaction: {
        await paymeService.checkPerformTransaction(params, id);
        return res.json({ result: { allow: true } });
      }
      case PaymeMethod.CheckTransaction: {
        const result = await paymeService.checkTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.CreateTransaction: {
        const result = await paymeService.createTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.PerformTransaction: {
        const result = await paymeService.performTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.CancelTransaction: {
        const result = await paymeService.cancelTransaction(params, id);
        return res.json({ result, id });
      }
      case PaymeMethod.GetStatement: {
        const result = await paymeService.getStatement(params, id);
        return res.json({ result: { transactions: result } });
      }
    }
  } catch (error) {
    const statusCode = error.statusCode || 422;
    const response = { error: error.message };

    res.status(statusCode).json(response);
  }
};

/**
 * Generates a Payme payment link for the booking.
 */
const checkout = async (req, res) => {
  const userData = await getUserDataFromToken(req);
  const { bookingId, url } = data;

  const MERCHANT_ID = process.env.PAYME_MERCHANT_ID;

  const user = await User.findByPk(userData.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const amount = booking.totalPrice * 100;

  const result = base64.encode(`m=${MERCHANT_ID};ac.booking_id=${bookingId};a=${amount};c=${url}`);

  return res.json({url: `https://checkout.paycom.uz/${result}`});
};

module.exports = {
  pay,
  checkout,
};