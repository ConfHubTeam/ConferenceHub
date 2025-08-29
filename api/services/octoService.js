const crypto = require('crypto');

/**
 * Octo Service
 * Handles prepare_payment flow and callback verification for Octo payments
 */
class OctoService {
  constructor() {
    this.baseUrl = 'https://secure.octo.uz';
    this.shopId = parseInt(process.env.OCTO_SHOP_ID || '0', 10);
    this.secret = process.env.OCTO_SECRET;
    this.notifyUrl = process.env.OCTO_NOTIFY_URL || `${process.env.FRONTEND_URL?.replace(/\/$/, '') || ''}/api/octo/notify`;
  // Test flag is provided per call; default behavior lives in controller via OCTO_TEST/NODE_ENV
  }

  /**
   * Prepare a payment at Octo and return payment data
   * @param {Object} params
   * @param {Object} params.booking - Booking instance
   * @param {Object} params.user - User instance
   * @param {string} params.returnUrl - Full URL to return user after payment
   * @param {boolean} [params.test=true] - Whether to run in test mode
   */
  async preparePayment({ booking, user, returnUrl, test = true, language = 'uz', notifyUrl }) {
    if (!this.shopId || !this.secret) {
      throw new Error('Octo shop id/secret not configured');
    }

    const initTime = this._formatDate(new Date());
    const total = Number(booking.finalTotal || booking.totalPrice || 0);
    if (!total || total <= 0) throw new Error('Invalid booking amount');

    // Helper to append query parameters to a return URL
    const appendQuery = (urlStr, params) => {
      try {
        const u = new URL(urlStr);
        Object.entries(params || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            u.searchParams.set(k, String(v));
          }
        });
        return u.toString();
      } catch (_) {
        // Fallback simple concatenation
        const qp = Object.entries(params || {})
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&");
        const sep = urlStr.includes("?") ? "&" : "?";
        return qp ? `${urlStr}${sep}${qp}` : urlStr;
      }
    };

    // Build request payload
    const payload = {
      octo_shop_id: this.shopId,
      octo_secret: this.secret,
      shop_transaction_id: booking.uniqueRequestId || `booking_${booking.id}`,
      auto_capture: true,
      test: !!test,
      init_time: initTime,
      user_data: {
        user_id: String(user.id),
        phone: this._formatPhone(user.phoneNumber || user.clickPhoneNumber || user.telegramPhone || ''),
        email: user.email || undefined,
      },
      total_sum: total,
  currency: 'UZS',
  // Avoid touching booking.place/uniqueRequestId to prevent extra queries/locks
  description: 'Getspace',
      // Minimal basket omitted; can be added later
      // Limit to common methods; optional
      payment_methods: [
        { method: 'bank_card' },
        { method: 'uzcard' },
        { method: 'humo' }
  ],
  // include provider + identifiers so client can detect redirect and trigger a one-shot status check
  return_url: appendQuery(returnUrl, {
    provider: 'octo',
    booking_id: booking.id,
    shop_transaction_id: booking.uniqueRequestId || `booking_${booking.id}`
  }),
  notify_url: notifyUrl || this.notifyUrl,
      language,
      ttl: 15,
    };

    const res = await fetch(`${this.baseUrl}/prepare_payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Octo HTTP ${res.status}: ${text?.slice(0, 300)}`);
    }

    const data = await res.json();
    if (data.error !== 0) {
      const msg = data.errMessage || data.errorMessage || 'Octo error';
      throw new Error(msg);
    }

    return {
      shopTransactionId: payload.shop_transaction_id,
      octoPaymentUUID: data.data?.octo_payment_UUID,
      status: data.data?.status,
      payUrl: data.data?.octo_pay_url,
      totalSum: data.data?.total_sum,
      raw: data
    };
  }

  /**
   * Verify Octo callback signature.
   * Docs indicate sha1(unique_key, uuid, status). We'll compute sha1(unique_key + uuid + status) uppercase hex.
   */
  verifySignature({ uuid, status, signature }) {
    if (!this.secret) return false;
    const str = `${this.secret}${uuid}${status}`;
    const calc = crypto.createHash('sha1').update(str).digest('hex').toUpperCase();
    return calc === signature;
  }

  _formatDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${DD} ${hh}:${mm}:${ss}`;
  }

  _formatPhone(phone) {
    if (!phone) return undefined;
    // Keep digits only, ensure starts with country code (998) if looks like UZ local
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9) return `998${digits}`;
    return digits;
  }
}

module.exports = OctoService;
