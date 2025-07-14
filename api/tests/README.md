# SMS Testing Guide

This folder contains test scripts for the Eskiz SMS integration.

## Test Scripts

### 1. `sms-test.js` - Basic SMS Test
Tests direct SMS sending using Eskiz API.

```bash
cd api/tests
node sms-test.js
```

**What it tests:**
- Authentication with Eskiz API
- SMS sending to test phone number
- Response handling

### 2. `account-check.js` - Account Status Check
Checks account details, balance, and capabilities.

```bash
cd api/tests
node account-check.js
```

**What it checks:**
- Account type (test/production)
- Available balance
- User profile information
- Available sender IDs

### 3. `sms-service-test.js` - Service Integration Test
Tests the main SMS service class used by the application.

```bash
cd api/tests
node sms-service-test.js
```

### 4. `notification-flow-test.js` - Full Application Flow Test
Tests the complete booking and review notification flow with SMS.

```bash
cd api/tests
node notification-flow-test.js
```

**What it tests:**
- Complete notification flow (booking confirmations, review alerts)
- In-app and SMS notification dispatch
- Error handling and fallbacks

### 5. `token-refresh-test.js` - Token Management Test
Tests the enhanced token refresh functionality and error handling.

```bash
cd api/tests
node token-refresh-test.js
```

**What it tests:**
- Automatic token authentication
- Token expiry detection
- Automatic token refresh on API calls
- Error handling for various authentication scenarios
- SMS sending with simulated token expiry
- Connection resilience and retry logic
- Booking confirmation SMS (to guest and host)
- Booking status update SMS
- Review notification SMS
- Review reply notification SMS
- Complete end-to-end notification flow

This test simulates the actual application flow but uses approved test messages. Once you upgrade to a paid account, the same logic will work with custom messages automatically.

## Test Account Limitations

Your current account is a **TEST ACCOUNT** with these restrictions:

### Message Content
Only these approved messages work:
- "This is test from Eskiz" ✅
- "Bu Eskiz dan test" ✅
- "Это тест от Eskiz" ✅

### Sender ID
- Only "4546" works ✅
- Custom sender IDs require paid account ❌

### Custom Messages
- Booking notifications with custom content require paid account ❌

## Upgrading for Production

To enable full SMS functionality for your Airbnb Clone:

1. **Upgrade to Paid Account** with Eskiz
2. **Top up Balance** for SMS sending
3. **Request Custom Sender ID** (like "AIRBNB")
4. **Remove test message restrictions** in code (see below)

### Removing Test Restrictions

Once you have a paid account, edit `api/services/eskizSMSService.js`:

```javascript
// Find the prepareMessage method and modify it:
prepareMessage(message) {
  // Comment out or remove the test account check
  /*
  if (this.token) {
    try {
      const tokenPayload = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString());
      if (tokenPayload.role === 'test') {
        console.log('Test account detected - using approved test message');
        return 'This is test from Eskiz';
      }
    } catch (error) {
      console.warn('Could not decode token to check account type');
    }
  }
  */
  
  // Return original message for paid accounts
  return message;
}
```

After this change, all your booking and review notifications will use custom messages!

## Usage in Application

Once you have a paid account, the SMS service will automatically:
- Send booking confirmation SMS
- Send booking status updates
- Send review notifications
- Use custom messages and sender ID

## Test Phone Number

Current test phone: `+998993730907` (host@gmail.com)

## Environment Variables

Make sure these are set in your `.env`:
```
ESKIZ_EMAIL=getspace855@gmail.com
ESKIZ_SECRET_CODE=zMJwxUyWwQISUH208Rptuajujnv86NAHeCnJhnvc
ESKIZ_BASE_URL=https://notify.eskiz.uz/api
ESKIZ_FROM=4546
```
