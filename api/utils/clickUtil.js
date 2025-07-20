const md5 = require('md5')

const clickCheckToken = (data, signString) => {
	const { click_trans_id, service_id, orderId, bookingId, merchant_prepare_id, amount, action, sign_time } = data

	const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY;
	const prepareId = merchant_prepare_id || '';
	const transactionId = orderId || bookingId; // Use either parameter

	const signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${transactionId}${prepareId}${amount}${action}${sign_time}`;
	const signatureHash = md5(signature);

	// Debug logging
	console.log('🔐 Signature Check:', {
		components: { click_trans_id, service_id, transactionId, prepareId, amount, action, sign_time },
		generated: signatureHash,
		received: signString,
		match: signatureHash === signString
	});

	return signatureHash === signString;
}

module.exports = clickCheckToken