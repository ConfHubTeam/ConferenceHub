````markdown
# Testing Guide

This folder contains test scripts for various integrations including SMS (Eskiz) and Payment (Payme) services.

## Payme Integration Testing

### Overview
Comprehensive integration tests for the Payme payment gateway that perform real API calls to Payme's sandbox environment.

### Running Payme Tests
```bash
# Using npm scripts (Recommended)
npm run test:payme

# Direct Jest execution
npm run test:payme-integration

# Manual execution
cd api
node tests/run-payme-integration-tests.js
```

### Prerequisites for Payme Tests
Set these environment variables in your `.env` file:
```bash
PAYME_MERCHANT_ID=your_merchant_id_from_payme_dashboard
PAYME_TEST_KEY=your_test_key_for_sandbox
PAYME_TEST_WEBHOOK_URL=https://your-ngrok-domain.ngrok-free.app/api/payme/pay
```

### What Payme Tests Cover
- ✅ API Authentication with test_key
- ✅ Transaction Lifecycle (Create → Check → Cancel)
- ✅ Enhanced Service Integration
- ✅ Database Integration
- ✅ Error Handling
- ✅ Phone Number Formatting
- ✅ Checkout URL Generation

### Expected Test Results
- 🔧 Configuration messages show environment setup
- ✅ Green checkmarks indicate successful tests
- ⚠️ Some API errors are expected in test environment (account not found, etc.)

## SMS Testing (Eskiz Integration)

### Test Scripts

#### 1. `sms-test.js` - Basic SMS Test
```bash
cd api/tests
node sms-test.js
```

#### 2. `account-check.js` - Account Status Check
```bash
cd api/tests
node account-check.js
```

#### 3. `comprehensive-sms-test.js` - Full Notification Flow
```bash
cd api/tests
node comprehensive-sms-test.js
```

#### 4. `token-refresh-test.js` - Token Management Test
```bash
cd api/tests
node token-refresh-test.js
```

### SMS Test Account Limitations
Current account is a **TEST ACCOUNT** with restrictions:
- Only approved messages work: "This is test from Eskiz", "Bu Eskiz dan test", "Это тест от Eskiz"
- Only sender ID "4546" works
- Custom messages require paid account upgrade

## All Available Test Scripts

### Payment Integration
- `services/paymeIntegration.test.js` - Payme API integration tests
- `run-payme-integration-tests.js` - Payme test runner with environment validation

### SMS Integration  
- `sms-test.js` - Basic SMS functionality
- `account-check.js` - Account status and balance
- `comprehensive-sms-test.js` - Complete notification flow
- `token-refresh-test.js` - Token management and refresh
- `multilingual-sms-test.js` - Multi-language SMS testing

### Booking Flow Tests
- `booking-flow-sms-test.js` - End-to-end booking with SMS
- `test-real-booking-notification.js` - Real booking notification test
- `test-real-users-flow.js` - Complete user interaction flow
- `debug-real-booking-sms-flow.js` - Booking SMS flow debugging

### Service Tests
- `services/placeAvailabilityService.test.js` - Place availability logic

## Environment Variables

### Required for All Tests
```bash
# Database
POSTGRES_DB=your_database_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=localhost

# JWT
JWT_SECRET=your_jwt_secret
```

### For Payme Tests
```bash
PAYME_MERCHANT_ID=68944508cab302211ad21b06
PAYME_TEST_KEY=your_test_key_from_payme
PAYME_TEST_WEBHOOK_URL=https://your-ngrok-domain.ngrok-free.app/api/payme/pay
```

### For SMS Tests
```bash
ESKIZ_EMAIL=getspace855@gmail.com
ESKIZ_SECRET_CODE=zMJwxUyWwQISUH208Rptuajujnv86NAHeCnJhnvc
ESKIZ_BASE_URL=https://notify.eskiz.uz/api
ESKIZ_FROM=4546
```

## Test Data Management

Tests automatically:
- Create temporary test users and bookings
- Clean up test data after completion
- Use isolated test transactions

## Troubleshooting

### Payme Test Issues
1. **Missing environment variables**: Add PAYME_MERCHANT_ID and PAYME_TEST_KEY to .env
2. **Database connection**: Ensure PostgreSQL is running
3. **Network issues**: Check connection to https://test.paycom.uz
4. **Invalid credentials**: Verify merchant ID and test key from Payme dashboard

### SMS Test Issues  
1. **Account type restrictions**: Test account only allows approved messages
2. **Balance issues**: Check account balance in Eskiz dashboard
3. **Token expiry**: Tests handle automatic token refresh

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:
```yaml
- name: Run Integration Tests
  run: |
    npm run test:payme-integration
  env:
    PAYME_MERCHANT_ID: ${{ secrets.PAYME_MERCHANT_ID }}
    PAYME_TEST_KEY: ${{ secrets.PAYME_TEST_KEY }}
```

## Production Readiness

### For Payme
- Tests validate sandbox integration
- Switch to production URLs and keys for live environment
- All test scenarios must pass before production deployment

### For SMS
- Upgrade to paid Eskiz account for custom messages
- Remove test message restrictions in SMS service
- Configure custom sender ID

````
