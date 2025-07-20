const axios = require('axios');
const md5 = require('md5');

// Test configuration - UPDATE YOUR NGROK URL HERE
const TEST_CONFIG = {
  baseUrl: 'https://your-ngrok-url.ngrok-free.app', // ⚠️  UPDATE THIS!
  bookingId: 2,
  amount: 10000, // Amount in cents
  serviceId: process.env.CLICK_SERVICE_ID,
  secretKey: process.env.CLICK_SECRET_KEY
};

async function testClickPayment() {
  console.log('🧪 Testing Click.uz Payment Flow\n');

  // Check config
  if (!TEST_CONFIG.serviceId || !TEST_CONFIG.secretKey) {
    console.error('❌ Missing environment variables!');
    return;
  }

  if (TEST_CONFIG.baseUrl.includes('your-ngrok-url')) {
    console.error('❌ Update baseUrl with your actual ngrok URL!');
    return;
  }

  // Test data
  const click_trans_id = Date.now().toString();
  const sign_time = Math.floor(Date.now() / 1000);

  // Prepare request
  const prepareData = {
    click_trans_id,
    service_id: TEST_CONFIG.serviceId,
    merchant_trans_id: TEST_CONFIG.bookingId.toString(),
    amount: TEST_CONFIG.amount,
    action: 0,
    sign_time
  };

  // Generate signature for prepare
  const prepareSignature = `${click_trans_id}${TEST_CONFIG.serviceId}${TEST_CONFIG.secretKey}${TEST_CONFIG.bookingId}${TEST_CONFIG.amount}0${sign_time}`;
  prepareData.sign_string = md5(prepareSignature);

  console.log('📤 Testing PREPARE endpoint...');
  console.log('Data:', prepareData);

  try {
    const prepareResponse = await axios.post(`${TEST_CONFIG.baseUrl}/api/click/prepare`, prepareData);
    console.log('✅ PREPARE Response:', prepareResponse.data);

    if (prepareResponse.data.error === 0) {
      console.log('\n📤 Testing COMPLETE endpoint...');
      
      // Complete request
      const completeData = {
        click_trans_id,
        service_id: TEST_CONFIG.serviceId,
        merchant_trans_id: TEST_CONFIG.bookingId.toString(),
        merchant_prepare_id: prepareResponse.data.merchant_prepare_id,
        amount: TEST_CONFIG.amount,
        action: 1,
        sign_time,
        error: 0 // 0 = success, negative = cancelled
      };

      // Generate signature for complete
      const completeSignature = `${click_trans_id}${TEST_CONFIG.serviceId}${TEST_CONFIG.secretKey}${TEST_CONFIG.bookingId}${prepareResponse.data.merchant_prepare_id}${TEST_CONFIG.amount}1${sign_time}`;
      completeData.sign_string = md5(completeSignature);

      console.log('Data:', completeData);

      const completeResponse = await axios.post(`${TEST_CONFIG.baseUrl}/api/click/complete`, completeData);
      console.log('✅ COMPLETE Response:', completeResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testClickPayment();
