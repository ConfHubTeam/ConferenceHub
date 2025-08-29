const OctoService = require('../services/octoService');
const TransactionService = require('../services/transactionService');
const { getUserDataFromToken } = require('../middleware/auth');
const { Booking, User } = require('../models');

// Map Octo statuses to our transaction states
function mapStatusToState(status) {
  switch ((status || '').toLowerCase()) {
    case 'succeeded':
      return 2; // Paid
    case 'created':
    case 'processing':
      return 1; // Pending
    case 'cancelled':
    case 'failed':
    default:
      return -1; // Cancelled/failed
  }
}

/**
 * POST /api/octo/prepare
 * Body: { bookingId, returnUrl }
 * Returns: { success, url, octoPaymentUUID, shopTransactionId }
 */
const prepare = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { bookingId, returnUrl, language = 'uz' } = req.body;

    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });
    if (!returnUrl) return res.status(400).json({ error: 'returnUrl is required' });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== userData.id) return res.status(403).json({ error: 'Access denied' });
    if (booking.status !== 'selected') return res.status(400).json({ error: 'Payment available only when booking is selected' });

    const user = await User.findByPk(userData.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const octo = new OctoService();

    // Prefer x-forwarded-host/proto for public callback URL, fallback to env FRONTEND_URL
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const base = host ? `${proto}://${host}` : (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const notifyUrl = `${base}/api/octo/notify`;

    const result = await octo.preparePayment({ booking, user, returnUrl, test: true, language, notifyUrl });

    // Idempotent behavior: update existing Octo transaction for this booking if present
    const existingTxn = await TransactionService.getOctoTransactionByBooking(booking.id);
    const newState = mapStatusToState(result.status);

    if (existingTxn) {
      const updatedTxn = await TransactionService.updateById(existingTxn.id, {
        providerTransactionId: result.octoPaymentUUID || existingTxn.providerTransactionId,
        state: newState,
        providerData: {
          ...(existingTxn.providerData || {}),
          shopTransactionId: result.shopTransactionId || (existingTxn.providerData || {}).shopTransactionId,
          payUrl: result.payUrl || (existingTxn.providerData || {}).payUrl,
          apiResponse: result.raw || (existingTxn.providerData || {}).apiResponse,
          refreshedAt: new Date()
        },
        performDate: newState === 2 ? new Date(result.raw?.payed_time || Date.now()) : existingTxn.performDate
      });

      // If payment already succeeded, mark booking as paid here too
      if (newState === 2) {
        const data = result.raw?.data || result.raw || {};
        const payed_time = data.payed_time || result.raw?.payed_time;
        if (booking.status !== 'approved' || !booking.paidAt) {
          await booking.update({
            status: 'approved',
            paidAt: updatedTxn.performDate || (payed_time ? new Date(payed_time) : new Date()),
            approvedAt: updatedTxn.performDate || (payed_time ? new Date(payed_time) : new Date()),
            paymentResponse: {
              provider: 'octo',
              octo_payment_UUID: result.octoPaymentUUID,
              shop_transaction_id: result.shopTransactionId,
              total_sum: data.total_sum,
              transfer_sum: data.transfer_sum,
              refunded_sum: data.refunded_sum || 0,
              status: data.status || 'succeeded',
              payed_time
            }
          });
        }
      }

      return res.json({
        success: true,
        url: result.payUrl,
        octoPaymentUUID: result.octoPaymentUUID,
        shopTransactionId: result.shopTransactionId
      });
    }

    // No existing transaction: create a new one
    await TransactionService.createTransaction({
      provider: 'octo',
      providerTransactionId: result.octoPaymentUUID,
      amount: booking.finalTotal || booking.totalPrice,
      currency: 'UZS',
      bookingId: booking.id,
      userId: booking.userId,
      state: newState,
      providerData: {
        payUrl: result.payUrl,
        amount: booking.finalTotal || booking.totalPrice
      }
    });

    return res.json({
      success: true,
      url: result.payUrl,
      octoPaymentUUID: result.octoPaymentUUID,
      shopTransactionId: result.shopTransactionId
    });
  } catch (error) {
    console.error('Octo prepare error:', error);
    return res.status(500).json({ error: 'Failed to prepare Octo payment', details: error.message });
  }
};

/**
 * POST /api/octo/notify
 * Octo callback handler
 * Body: per Octo docs, including status, octo_payment_UUID, shop_transaction_id, signature
 */
const notify = async (req, res) => {
  try {
    const {
      shop_transaction_id,
      octo_payment_UUID,
      status,
      signature,
      hash_key,
      total_sum,
      transfer_sum,
      refunded_sum,
      payed_time
    } = req.body || {};

    if (!octo_payment_UUID || !status) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const octo = new (require('../services/octoService'))();

    // Best-effort signature verification (depends on secret)
    const valid = octo.verifySignature({ uuid: octo_payment_UUID, status, signature });
    if (!valid) {
      console.warn('Octo signature verification failed');
    }

    // Find transaction
    const txn = await TransactionService.getByProviderTransactionId(octo_payment_UUID);
    if (!txn) {
      console.error('Octo transaction not found:', octo_payment_UUID);
      // Still 200 OK to acknowledge receipt, avoid retries storm
      return res.status(200).json({ ok: true });
    }

    const newState = mapStatusToState(status);
    const updatedTxn = await TransactionService.updateTransactionState(octo_payment_UUID, newState, {
      shopTransactionId: shop_transaction_id,
      status,
      transfer_sum,
      refunded_sum,
      payed_time,
      callbackAt: new Date(),
      rawCallback: req.body
    });

    // If succeeded, update booking as paid/approved similar to Click/Payme
    if (newState === 2) {
      const booking = await Booking.findByPk(updatedTxn.bookingId);
      if (booking && (booking.status !== 'approved' || !booking.paidAt)) {
        await booking.update({
          status: 'approved',
          paidAt: payed_time ? new Date(payed_time) : new Date(),
          approvedAt: new Date(),
          paymentResponse: {
            provider: 'octo',
            octo_payment_UUID,
            shop_transaction_id,
            total_sum,
            transfer_sum,
            refunded_sum,
            status
          }
        });
      }
    }

    // Respond OK as per webhook conventions
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Octo notify error:', error);
    // Still respond 200 to avoid retries storms unless Octo requires otherwise
    return res.status(200).json({ ok: false });
  }
};

module.exports = { prepare, notify };
