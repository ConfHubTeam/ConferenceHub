const base64 = require("base-64");

const { PaymeError } = require("../enum/transaction.enum");
const { PaymeTransactionError } = require("./errorHandler");

const PAYME_MERCHANT_KEY =
  process.env.PAYME_MERCHANT_KEY || "zpcK%c1JZsPnGwqO09Wfx4CFU%wP2d9BqAmD";

exports.paymeCheckToken = (req, res, next) => {
  try {
    const { id } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    //console.log("PAYME-TOKEN:" + token);
    if (!token)
      throw new PaymeTransactionError(PaymeError.InvalidAuthorization, id);
    const data = base64.decode(token);
    //console.log("PAYME-DATA:" + data);
    if (!data.includes(PAYME_MERCHANT_KEY)) {
      throw new PaymeTransactionError(PaymeError.InvalidAuthorization, id);
    }
    next();
  } catch (err) {
    if (err.isTransactionError) {
      return res.status(200).json({
        error: {
          code: err.transactionErrorCode,
          message: err.transactionErrorMessage,
          data: err.transactionData || null,
        },
        id: err.transactionId,
        result: null,
      });
    }

    return res.status(500).json({
      error: {
        code: -32400,
        message: {
          uz: "Server xatoligi",
          ru: "Ошибка сервера",
          en: "Server error",
        },
        data: err.message,
      },
      id: null,
      result: null,
    });
  }
};
