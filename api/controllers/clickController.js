const clickService = require("../services/clickService");
const { getUserDataFromToken } = require("../middleware/auth");
const { User, Booking } = require("../models");

/**
 * Prepares and validates incoming Click transaction data.
 */
const prepare = async (req, res) => {
  try {
    const data = req.body;
    console.log("Click complete request:", data);
    const result = await clickService.prepare(data);
    console.log("Click complete result:", result);
    res
      .set({
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      })
      .send(result);
  } catch (error) {
    const statusCode = error.statusCode || 422;
    const response = { error: error.message };

    res.status(statusCode).json(response);
  }
};

/**
 * Finalizes the payment transaction after successful validation.
 */
const complete = async (req, res) => {
  try {
    const data = req.body;
    console.log("Click complete result:", data);
    const result = await clickService.complete(data);

    console.log("Click complete result:", result);
    res
      .set({
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      })
      .send(result);
  } catch (error) {
    const statusCode = error.statusCode || 422;
    const response = { error: error.message };

    res.status(statusCode).json(response);
  }
};

/**
 * Generates a Click payment link for the booking.
 */
const checkout = async (req, res) => {
  //const userData = await getUserDataFromToken(req);
  const { amount } = req.body;
  const bookingId = 2;
  const userId = 31;
  const MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
  const SERVICE_ID = process.env.CLICK_SERVICE_ID;
  const CHECKOUT_LINK = process.env.CLICK_CHECKOUT_LINK;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const fixedAmount = parseFloat(amount).toFixed(2);

  const clickPaymentLink = await clickService.makeClickPaymentLink({
    bookingId: bookingId,
    amount: fixedAmount,
    serviceId: SERVICE_ID,
    merchantId: MERCHANT_ID,
    baseUrl: CHECKOUT_LINK,
  });

  res.json({ url: clickPaymentLink });
};

module.exports = {
  prepare,
  complete,
  checkout,
};
