# Epic: Payme Payment Integration for Booking System

**Epic ID:** EPIC-PAY-001  
**Created:** August 16, 2025  
**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 8-10 sprints  

## Epic Overview

Integrate Payme payment gateway into the existing booking system, following the established Click payment patterns and maintaining consistency with the current payment architecture.

## Business Value

- **Multi-payment Options**: Provide customers with additional payment choices to increase booking conversion rates
- **Market Expansion**: Support Uzbekistan's popular Payme payment system to capture broader market share
- **System Reliability**: Reduce dependency on single payment provider by offering alternatives
- **Competitive Advantage**: Match competitors offering multiple payment options

## Epic Goals

- Provide Payme as an additional payment option alongside Click
- Maintain payment provider abstraction and extensibility
- Ensure consistent user experience across payment methods
- Leverage existing transaction management and booking flow
- Follow SOLID principles and DRY patterns

## Technical Context

### Current System Architecture
- **Payment Providers**: Click.uz (fully implemented)
- **Transaction Management**: Unified `TransactionService` supporting multiple providers
- **Booking Flow**: Selected → Payment → Approved workflow
- **Frontend**: React with payment method selection and status tracking
- **Backend**: Express.js with PERN stack

### Existing Payme Infrastructure
- Basic Payme controller with merchant API integration
- Payme middleware for authentication
- Transaction enum supporting Payme states
- Basic webhook handling structure

## Payme API Technical Specifications

### API Protocol Overview
Payme uses JSON-RPC protocol for all merchant API communications. All requests and responses follow a standardized format for consistency and reliability.

### Request Format Specification

#### RPC Request Structure
All requests to Payme merchant API must follow this JSON-RPC format:

```json
{
  "method": "MethodName",
  "params": {
    // Method-specific parameters
  },
  "id": 12345
}
```

**Request Fields:**
- `method` (String, Required): The API method name (e.g., "CheckPerformTransaction", "CreateTransaction")
- `params` (Object, Required): Method-specific parameters
- `id` (Integer, Required): Unique request identifier for tracking

#### HTTP Headers Required
```http
POST https://merchant.example.com/payme HTTP/1.1
Content-Type: application/json; charset=UTF-8
Authorization: Basic <base64_encoded_credentials>
```

#### Authentication
- **Method**: HTTP Basic Authentication
- **Format**: `Authorization: Basic <base64(merchant_id:secret_key)>`
- **Credentials**: Provided by Payme during merchant onboarding

#### Example Request
```json
{
  "method": "CreateTransaction",
  "params": {
    "id": "53327b3fc92af52c0b72b695",
    "time": 1399114284039,
    "amount": 500000,
    "account": {
      "booking_id": "12345",
      "phone": "998901234567"
    }
  },
  "id": 2032
}
```

### Response Format Specification

#### Successful Response Structure
```json
{
  "result": {
    // Method-specific result data
  },
  "id": 2032
}
```

#### Error Response Structure
```json
{
  "error": {
    "code": -31050,
    "message": {
      "ru": "Ошибка на русском",
      "uz": "Xatolik o'zbekcha",
      "en": "Error in English"
    },
    "data": "additional_error_info"
  },
  "id": 2032
}
```

**Response Fields:**
- `result` (Object): Present only on successful operations
- `error` (Object): Present only on failed operations
- `id` (Integer): Matches the request ID

### Error Codes Reference

#### Common System Errors
| Code | Description |
|------|-------------|
| -32300 | Request method is not POST |
| -32700 | JSON parsing error |
| -32600 | Missing required fields or invalid field types |
| -32601 | Requested method not found |
| -32504 | Insufficient privileges |
| -32400 | Internal system error |

#### Business Logic Errors
| Code | Description | Action Required |
|------|-------------|-----------------|
| -31050 | Phone number not found | Validate account information |
| -31051 | Account not found | Check booking/account details |
| -31052 | Transaction not found | Verify transaction ID |
| -31053 | Invalid amount | Validate payment amount |
| -31054 | Transaction expired | Handle timeout scenarios |

### Key Payme Methods for Implementation

#### 1. CheckPerformTransaction
**Purpose**: Validate if transaction can be performed
**When to Use**: Before creating actual transaction

```json
{
  "method": "CheckPerformTransaction",
  "params": {
    "amount": 500000,
    "account": {
      "booking_id": "12345"
    }
  },
  "id": 1
}
```

#### 2. CreateTransaction
**Purpose**: Create new payment transaction
**When to Use**: After successful validation

```json
{
  "method": "CreateTransaction",
  "params": {
    "id": "unique_transaction_id",
    "time": 1625097600000,
    "amount": 500000,
    "account": {
      "booking_id": "12345"
    }
  },
  "id": 2
}
```

#### 3. PerformTransaction
**Purpose**: Execute the payment transaction
**When to Use**: After user completes payment in Payme app

```json
{
  "method": "PerformTransaction",
  "params": {
    "id": "transaction_id"
  },
  "id": 3
}
```

#### 4. CheckTransaction
**Purpose**: Check transaction status
**When to Use**: For polling payment status

```json
{
  "method": "CheckTransaction",
  "params": {
    "id": "transaction_id"
  },
  "id": 4
}
```

#### 5. CancelTransaction
**Purpose**: Cancel pending transaction
**When to Use**: When payment needs to be cancelled

```json
{
  "method": "CancelTransaction",
  "params": {
    "id": "transaction_id",
    "reason": 1
  },
  "id": 5
}
```

### Amount Format
- **Unit**: Tiyin (1/100 of UZS)
- **Example**: 50,000 tiyin = 500 UZS
- **Conversion**: `amount_in_uzs * 100 = amount_in_tiyin`

### Transaction States
- **State 1**: Transaction created, waiting for payment
- **State 2**: Transaction completed successfully
- **State -1**: Transaction cancelled due to timeout
- **State -2**: Transaction cancelled by user/system

### Security Considerations
1. **HTTPS Required**: All API communications must use HTTPS
2. **Credential Protection**: Store merchant credentials securely
3. **Request Validation**: Validate all incoming webhook requests
4. **Idempotency**: Handle duplicate requests safely
5. **Timeout Handling**: Implement proper timeout mechanisms

### Integration Best Practices
1. **Retry Logic**: Implement exponential backoff for failed requests
2. **Logging**: Log all API requests/responses for debugging
3. **Monitoring**: Track API response times and error rates
4. **Fallback**: Provide alternative payment methods if Payme fails
5. **Testing**: Use Payme sandbox environment for development

### Sandbox Environment Configuration

#### Authentication Differences
**Important**: The sandbox environment uses `test_key` instead of `key` for request authorization.

- **Production**: `Authorization: Basic base64(merchant_id:key)`
- **Sandbox**: `Authorization: Basic base64(merchant_id:test_key)`

#### Environment Variables Setup
```bash
# Production Environment
PAYME_MERCHANT_ID=your_merchant_id
PAYME_SECRET_KEY=your_production_key
PAYME_WEBHOOK_URL=https://yourdomain.com/api/payme/pay

# Development/Sandbox Environment  
PAYME_MERCHANT_ID=your_merchant_id
PAYME_TEST_KEY=your_test_key
PAYME_TEST_WEBHOOK_URL=https://your-ngrok-domain.ngrok-free.app/api/payme/pay
```

#### Test Environment Setup
The Payme sandbox provides comprehensive testing scenarios that must be validated:

1. **Transaction Creation and Cancellation**: CreateTransaction → CancelTransaction
2. **Transaction Creation and Confirmation**: CreateTransaction → PerformTransaction  
3. **Full Transaction Lifecycle**: CreateTransaction → PerformTransaction → CancelTransaction
4. **Authentication Failure Testing**: Invalid credentials handling
5. **Invalid Account Testing**: Non-existent account scenarios

#### Account Types Configuration
- **One-time Account**: Can be paid only once (e.g., booking orders)
- **Accumulative Account**: Can be paid multiple times (e.g., balance top-up)

#### Account Status Options
- **Awaiting Payment**: Account can be paid
- **In Process**: Account locked, awaiting payment confirmation
- **Blocked**: Account already paid, cannot be paid again
- **Does Not Exist**: Account not found

#### Transaction States in Testing
- **State 1**: Transaction created, awaiting confirmation
- **State 2**: Transaction successfully completed
- **State -1**: Transaction cancelled (from state 1)
- **State -2**: Transaction cancelled after completion (from state 2)
- **Does Not Exist**: Transaction never created

### Account Structure for Booking Platform

Since Payme API primarily uses phone numbers for account identification, booking platforms need to adapt their integration:

#### Standard Payme Account
```json
{
  "account": {
    "phone": "903595731"
  }
}
```

#### Extended Account for Booking Platform
```json
{
  "account": {
    "phone": "903595731",
    "booking_id": "12345",
    "user_id": "67890"
  }
}
```

**Important Notes:**
- `phone` is the primary identifier required by Payme
- Additional fields like `booking_id` can be included for merchant reference
- Phone numbers should be cleaned (digits only, no country code prefix)
- Phone validation should happen before creating transactions

#### Phone Number Formatting
```javascript
// Clean phone number for Payme
function formatPhoneForPayme(phone) {
  // Remove all non-digits
  const cleaned = phone.replace(/[^0-9]/g, '');
  
  // Remove country code if present (998 for Uzbekistan)
  if (cleaned.startsWith('998') && cleaned.length === 12) {
    return cleaned.slice(3);
  }
  
  return cleaned;
}

// Example usage
const paymePhone = formatPhoneForPayme('+998 90 123 45 67'); // Returns: 901234567
```

---

## User Stories

### US-PAY-001: Enhanced Payme Service Architecture
**As a** developer  
**I want to** refactor the existing Payme service to follow the same patterns as Click  
**So that** the payment system is consistent and maintainable

**Acceptance Criteria:**
- Create `EnhancedPaymeService` similar to `EnhancedClickService`
- Implement payment provider abstraction interface
- Use dependency injection for Payme API services
- Maintain backward compatibility with existing Payme merchant API
- Follow Single Responsibility Principle for each service method

**Technical Details:**
- Leverage existing `TransactionService` patterns
- Use same state management as Click (Pending: 1, Paid: 2, Cancelled: -1)
- Implement same error handling patterns
- Create `PaymeMerchantApiService` similar to `ClickMerchantApiService`
- Follow Payme JSON-RPC protocol specifications
- Implement proper authentication using Basic Auth with merchant credentials

**Implementation Specifications:**
```javascript
// Example Payme Service Structure
class EnhancedPaymeService {
  constructor(merchantId, secretKey, baseUrl, isTestMode = false) {
    this.merchantId = merchantId;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
    this.isTestMode = isTestMode;
    this.authHeader = this.generateAuthHeader();
  }

  async checkPerformTransaction(amount, account) {
    const request = {
      method: 'CheckPerformTransaction',
      params: { amount, account },
      id: this.generateRequestId()
    };
    return this.makeRpcRequest(request);
  }

  async createTransaction(transactionId, amount, account) {
    const request = {
      method: 'CreateTransaction',
      params: {
        id: transactionId,
        time: Date.now(),
        amount,
        account
      },
      id: this.generateRequestId()
    };
    return this.makeRpcRequest(request);
  }

  generateAuthHeader() {
    // Important: Use test_key for sandbox, key for production
    const credentials = `${this.merchantId}:${this.secretKey}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  generateRequestId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  async makeRpcRequest(requestData) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': this.authHeader
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Environment Configuration
const paymeService = new EnhancedPaymeService(
  process.env.PAYME_MERCHANT_ID,
  process.env.NODE_ENV === 'production' 
    ? process.env.PAYME_SECRET_KEY 
    : process.env.PAYME_TEST_KEY, // Use test_key for sandbox
  process.env.NODE_ENV === 'production'
    ? 'https://merchant.paycom.uz'
    : 'https://test.paycom.uz',
  process.env.NODE_ENV !== 'production'
);
```

**Definition of Done:**
- [ ] Enhanced Payme service created with same interface as Click
- [ ] Unit tests written for all service methods
- [ ] Service follows SOLID principles
- [ ] Documentation updated with service API

### US-PAY-002: Unified Transaction Management
**As a** developer  
**I want to** extend the existing transaction service to handle Payme transactions consistently  
**So that** all payment providers use the same data model and state management

**Acceptance Criteria:**
- Update `TransactionService.createPayme()` to use unified transaction pattern
- Use `booking.uniqueRequestId` for merchant references (same as Click)
- Implement `getPaymeTransactionByBooking()` method
- Support provider-specific data storage in `providerData` field
- Maintain existing Payme transaction ID format for backward compatibility

**Technical Details:**
- Provider: 'payme'
- ProviderTransactionId: Payme transaction ID from API
- ProviderData: Store Payme account, merchant reference, and API response data
- Use same state codes as Click for consistency
- Map Payme states (1: created, 2: completed, -1: cancelled) to unified states

**Implementation Specifications:**
```javascript
// Transaction Data Structure for Payme
const paymeTransactionData = {
  provider: 'payme',
  providerTransactionId: 'payme_transaction_id_from_api',
  amount: booking.finalTotal * 100, // Convert to tiyin
  currency: 'UZS',
  state: 1, // Pending
  providerData: {
    merchant_id: process.env.PAYME_MERCHANT_ID,
    account: {
      booking_id: booking.id,
      phone: user.phone
    },
    payme_time: Date.now(),
    merchant_reference: booking.uniqueRequestId
  },
  bookingId: booking.id,
  userId: user.id
};

// State Mapping
const PAYME_STATE_MAPPING = {
  1: 1,   // Created -> Pending
  2: 2,   // Completed -> Paid
  [-1]: -1, // Cancelled due to timeout -> Cancelled
  [-2]: -1  // Cancelled by user/system -> Cancelled
};
```

**Definition of Done:**
- [ ] Transaction service supports unified Payme transactions
- [ ] Provider data structure documented
- [ ] Migration script for existing Payme transactions
- [ ] Integration tests for transaction consistency

### US-PAY-003: Payme Invoice Creation
**As a** client  
**I want to** create Payme payment invoices for my bookings  
**So that** I can pay using Payme alongside existing Click option

**Acceptance Criteria:**
- Create Payme payment invoice for bookings in 'selected' status
- Validate user authorization (booking ownership)
- Generate Payme checkout URL using merchant API
- Store invoice information in booking and transaction records
- Prevent duplicate invoice creation for same booking
- Return consistent response format matching Click implementation

**Technical Details:**
- Endpoint: `POST /api/payme/create-invoice`
- Authentication required
- Amount validation against `booking.finalTotal`
- Use Payme checkout URL format with base64 encoding
- Store `paymeInvoiceId` in booking record
- Follow Payme JSON-RPC protocol for CreateTransaction

**Implementation Specifications:**
```javascript
// Invoice Creation Flow
async function createPaymeInvoice(bookingId, userId) {
  // 1. Validate booking and user authorization
  const booking = await validateBookingOwnership(bookingId, userId);
  
  // 2. Check if payment can be performed
  const checkResult = await paymeService.checkPerformTransaction(
    booking.finalTotal * 100, // Convert to tiyin
    { 
      phone: user.phone.replace(/[^0-9]/g, ''), // Clean phone number
      booking_id: booking.id // Optional: include for reference
    }
  );
  
  if (checkResult.error) {
    throw new PaymeValidationError(checkResult.error);
  }
  
  // 3. Create transaction in Payme
  const transactionId = generateUniqueTransactionId();
  const createResult = await paymeService.createTransaction(
    transactionId,
    booking.finalTotal * 100,
    { 
      phone: user.phone.replace(/[^0-9]/g, ''),
      booking_id: booking.id
    }
  );
  
  // 4. Store transaction in database
  await transactionService.createPayme({
    bookingId,
    userId,
    providerTransactionId: transactionId,
    amount: booking.finalTotal,
    providerData: createResult.result
  });
  
  // 5. Generate checkout URL
  const checkoutUrl = generatePaymeCheckoutUrl(transactionId);
  
  return {
    success: true,
    checkoutUrl,
    transactionId,
    amount: booking.finalTotal
  };
}

// Checkout URL Generation
function generatePaymeCheckoutUrl(transactionId) {
  const paymentData = {
    merchant: process.env.PAYME_MERCHANT_ID,
    transaction: transactionId,
    return_url: `${process.env.CLIENT_URL}/booking/payment-success`
  };
  
  const encoded = Buffer.from(JSON.stringify(paymentData)).toString('base64');
  return `https://checkout.paycom.uz/${encoded}`;
}
```

**Error Handling:**
- Validate booking exists and user has permission
- Check for existing pending Payme transactions
- Handle Payme API errors (account not found, invalid amount, etc.)
- Implement retry logic for network failures
- Log all API interactions for debugging

**Definition of Done:**
- [ ] API endpoint created and tested
- [ ] Invoice creation logic implemented
- [ ] Duplicate prevention mechanism in place
- [ ] Error handling for all failure scenarios

### US-PAY-004: Payme Payment Status Checking
**As a** client/system  
**I want to** check Payme payment status for bookings  
**So that** I can track payment progress and update booking status

**Acceptance Criteria:**
- Implement payment status checking using Payme merchant API
- Support both immediate and polling-based status checks
- Update transaction and booking records when payment confirmed
- Return standardized payment status response
- Handle Payme-specific status codes and error conditions

**Technical Details:**
- Endpoint: `GET /api/payme/payment-status/:bookingId`
- Use same response format as Click status checking
- Map Payme states to unified transaction states
- Trigger booking approval workflow on successful payment
- Implement polling mechanism for real-time updates

**Implementation Specifications:**
```javascript
// Payment Status Checking
async function checkPaymePaymentStatus(bookingId, userId) {
  // 1. Get transaction from database
  const transaction = await transactionService.getPaymeTransactionByBooking(bookingId);
  
  if (!transaction) {
    throw new TransactionNotFoundError('Payme transaction not found');
  }
  
  // 2. Check current status with Payme API
  const statusResult = await paymeService.checkTransaction(
    transaction.providerTransactionId
  );
  
  if (statusResult.error) {
    throw new PaymeApiError(statusResult.error);
  }
  
  // 3. Map Payme state to unified state
  const unifiedState = mapPaymeStateToUnified(statusResult.result.state);
  
  // 4. Update transaction if state changed
  if (transaction.state !== unifiedState) {
    await transactionService.updateTransactionState(
      transaction.id,
      unifiedState,
      statusResult.result
    );
    
    // 5. Trigger booking approval if payment completed
    if (unifiedState === 2) { // Paid
      await bookingService.approveBooking(bookingId);
      await notificationService.sendPaymentSuccessNotification(bookingId);
    }
  }
  
  return {
    status: getStatusName(unifiedState),
    state: unifiedState,
    amount: transaction.amount,
    transactionId: transaction.providerTransactionId,
    createdAt: transaction.createdAt,
    paidAt: unifiedState === 2 ? statusResult.result.perform_time : null
  };
}

// State Mapping Function
function mapPaymeStateToUnified(paymeState) {
  const stateMap = {
    1: 1,   // Created -> Pending
    2: 2,   // Completed -> Paid
    [-1]: -1, // Cancelled -> Cancelled
    [-2]: -1  // User cancelled -> Cancelled
  };
  return stateMap[paymeState] || 0; // Unknown state
}

// Status Names for Frontend
function getStatusName(state) {
  const statusNames = {
    0: 'unknown',
    1: 'pending',
    2: 'paid',
    [-1]: 'cancelled'
  };
  return statusNames[state] || 'unknown';
}
```

**Polling Implementation:**
```javascript
// Frontend polling logic (similar to Click)
const pollPaymentStatus = async (bookingId) => {
  const maxAttempts = 30; // 5 minutes with 10-second intervals
  let attempts = 0;
  
  const poll = async () => {
    try {
      const response = await api.get(`/payme/payment-status/${bookingId}`);
      
      if (response.data.state === 2) { // Paid
        return { success: true, data: response.data };
      } else if (response.data.state === -1) { // Cancelled
        return { success: false, cancelled: true, data: response.data };
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 10000); // Wait 10 seconds
      } else {
        return { success: false, timeout: true };
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
      return { success: false, error };
    }
  };
  
  return poll();
};
```

**Definition of Done:**
- [ ] Status checking endpoint implemented
- [ ] Status mapping logic created
- [ ] Polling mechanism integrated
- [ ] Booking workflow integration complete

### US-PAY-005: Payme Payment Verification
**As a** system  
**I want to** verify Payme payments against the merchant API  
**So that** payment confirmation is secure and reliable

**Acceptance Criteria:**
- Verify payment using Payme transaction ID
- Cross-validate amount and booking details
- Update booking status to 'approved' on successful verification
- Create audit trail for payment verification
- Handle verification failures and retry logic

**Technical Details:**
- Use Payme merchant API for verification
- Follow same verification pattern as Click
- Update `booking.paidAt` timestamp
- Create booking notification for successful payment

**Definition of Done:**
- [ ] Payment verification logic implemented
- [ ] Audit trail mechanism in place
- [ ] Retry logic for failed verifications
- [ ] Security validation comprehensive

### US-PAY-006: Unified Payment Controller
**As a** developer  
**I want to** create consistent payment endpoints for Payme  
**So that** frontend can use the same patterns for both Click and Payme

**Acceptance Criteria:**
- Create `PaymeController` with methods matching `ClickController`
- Implement: `createPaymentInvoice`, `checkPaymentStatus`, `getPaymentInfo`
- Use same authentication and authorization patterns
- Return consistent response formats
- Handle errors with same error response structure

**Technical Details:**
- Mirror Click controller method signatures
- Use same validation middleware
- Implement same rate limiting and security measures
- Support same query parameters and request formats

**Definition of Done:**
- [ ] Controller with consistent API created
- [ ] All endpoints tested for functionality
- [ ] Error handling standardized
- [ ] API documentation updated

### US-PAY-007: Frontend Payme Integration
**As a** client  
**I want to** use Payme payment option in the booking interface  
**So that** I have multiple payment choices

**Acceptance Criteria:**
- Add Payme button to payment methods section
- Implement Payme payment flow using existing patterns
- Show Payme payment status and progress
- Handle Payme-specific UI feedback and error messages
- Maintain consistent payment experience with Click

**Technical Details:**
- Leverage existing `PaymentMethodsSection` component
- Use same payment polling logic as Click
- Add Payme-specific styling and branding
- Implement same success/error notification patterns

**Definition of Done:**
- [ ] Payme payment option added to UI
- [ ] Payment flow fully functional
- [ ] Status tracking implemented
- [ ] Error handling user-friendly

### US-PAY-008: Payment Provider Abstraction
**As a** developer  
**I want to** implement a payment provider interface  
**So that** new payment methods can be easily added in the future

**Acceptance Criteria:**
- Create `PaymentProvider` interface or abstract class
- Implement interface for both Click and Payme providers
- Abstract common payment operations (create invoice, check status, verify payment)
- Support provider-specific configuration and validation
- Enable easy switching between payment providers

**Technical Details:**
- Follow Interface Segregation Principle
- Use Dependency Inversion for payment provider injection
- Implement Factory pattern for provider selection
- Support provider-specific error handling

**Definition of Done:**
- [ ] Payment provider interface defined
- [ ] Both providers implement interface
- [ ] Factory pattern implemented
- [ ] Configuration management abstracted

### US-PAY-009: Payme Webhook Integration
**As a** system  
**I want to** handle Payme webhooks for real-time payment updates  
**So that** payment status is updated immediately when transactions complete

**Acceptance Criteria:**
- Implement webhook endpoint for Payme notifications
- Validate webhook authenticity using Payme security measures
- Update transaction and booking status based on webhook data
- Handle duplicate webhook notifications (idempotency)
- Log webhook events for audit and debugging

**Technical Details:**
- Endpoint: `POST /api/payme/webhook`
- Implement webhook signature validation
- Use existing transaction update patterns
- Follow same security practices as Click webhooks
- Handle all Payme webhook methods (CheckPerformTransaction, CreateTransaction, etc.)

**Implementation Specifications:**
```javascript
// Webhook Handler Implementation
async function handlePaymeWebhook(req, res) {
  try {
    // 1. Validate request format and authentication
    const { method, params, id } = req.body;
    
    if (!validatePaymeAuth(req.headers.authorization)) {
      return sendRpcError(res, -32504, 'Insufficient privileges', id);
    }
    
    // 2. Route to appropriate handler
    let result;
    switch (method) {
      case 'CheckPerformTransaction':
        result = await handleCheckPerformTransaction(params);
        break;
      case 'CreateTransaction':
        result = await handleCreateTransaction(params);
        break;
      case 'PerformTransaction':
        result = await handlePerformTransaction(params);
        break;
      case 'CheckTransaction':
        result = await handleCheckTransaction(params);
        break;
      case 'CancelTransaction':
        result = await handleCancelTransaction(params);
        break;
      default:
        return sendRpcError(res, -32601, 'Method not found', id);
    }
    
    // 3. Send successful response
    res.json({ result, id });
    
  } catch (error) {
    console.error('Payme webhook error:', error);
    sendRpcError(res, -32400, 'Internal error', req.body.id);
  }
}

// Webhook Method Handlers
async function handleCheckPerformTransaction(params) {
  const { amount, account } = params;
  
  // For booking platform, account should contain phone and booking reference
  // Payme primarily uses phone for account identification
  if (!account.phone) {
    throw new RpcError(-31050, 'Phone number required');
  }
  
  // If booking_id is provided in account, validate it
  // Otherwise, you might need to identify booking through other means
  let booking;
  if (account.booking_id) {
    booking = await bookingService.getById(account.booking_id);
  } else {
    // Alternative: find booking by user phone and other criteria
    // This depends on your business logic
    throw new RpcError(-31051, 'Booking reference required');
  }
  
  if (!booking) {
    throw new RpcError(-31051, 'Booking not found');
  }
  
  if (booking.finalTotal * 100 !== amount) {
    throw new RpcError(-31053, 'Invalid amount');
  }
  
  if (booking.status !== 'selected') {
    throw new RpcError(-31050, 'Booking not available for payment');
  }
  
  return { allow: true };
}

async function handleCreateTransaction(params) {
  const { id, time, amount, account } = params;
  
  // Check if transaction already exists (idempotency)
  let transaction = await transactionService.getByProviderTransactionId(id);
  
  if (!transaction) {
    // Create new transaction
    transaction = await transactionService.createPayme({
      providerTransactionId: id,
      bookingId: account.booking_id,
      amount: amount / 100, // Convert from tiyin
      state: 1, // Created
      providerData: {
        payme_time: time,
        account,
        created_at: Date.now()
      }
    });
  }
  
  return {
    transaction: transaction.id.toString(),
    state: transaction.state,
    create_time: transaction.createdAt.getTime()
  };
}

async function handlePerformTransaction(params) {
  const { id } = params;
  
  const transaction = await transactionService.getByProviderTransactionId(id);
  if (!transaction) {
    throw new RpcError(-31003, 'Transaction not found');
  }
  
  if (transaction.state === 2) {
    // Already performed
    return {
      transaction: transaction.id.toString(),
      state: 2,
      perform_time: transaction.updatedAt.getTime()
    };
  }
  
  // Update transaction state to completed
  await transactionService.updateTransactionState(transaction.id, 2);
  
  // Approve booking
  await bookingService.approveBooking(transaction.bookingId);
  
  // Send notification
  await notificationService.sendPaymentSuccessNotification(transaction.bookingId);
  
  return {
    transaction: transaction.id.toString(),
    state: 2,
    perform_time: Date.now()
  };
}

// RPC Error Response Helper
function sendRpcError(res, code, message, id = null) {
  res.json({
    error: {
      code,
      message: {
        ru: message,
        uz: message,
        en: message
      }
    },
    id
  });
}

// Authentication Validation
function validatePaymeAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  
  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [merchantId, secretKey] = credentials.split(':');
  
  return merchantId === process.env.PAYME_MERCHANT_ID && 
         secretKey === process.env.PAYME_SECRET_KEY;
}
```

**Security Considerations:**
- Validate all webhook requests with proper authentication
- Implement rate limiting for webhook endpoints
- Log all webhook activities for audit trail
- Handle idempotent operations to prevent duplicate processing
- Validate transaction amounts and booking states before processing

**Definition of Done:**
- [ ] Webhook endpoint implemented
- [ ] Security validation in place
- [ ] Idempotency handling implemented
- [ ] Comprehensive logging added

### US-PAY-010: Payment Method Selection Enhancement
**As a** client  
**I want to** see both Click and Payme options clearly  
**So that** I can choose my preferred payment method

**Acceptance Criteria:**
- Display both payment providers with equal prominence
- Show provider-specific information (fees, processing time, etc.)
- Remember user's preferred payment method
- Provide clear payment flow instructions for each provider
- Handle provider availability and maintenance modes

**Technical Details:**
- Update `getPaymentProviders()` helper function
- Add provider preference to user profile
- Implement provider status checking
- Use consistent UI patterns from existing implementation

**Definition of Done:**
- [ ] Payment method selection UI enhanced
- [ ] Provider information displayed
- [ ] User preferences saved
- [ ] Provider availability handled

### US-PAY-011: Enhanced Error Handling
**As a** system/user  
**I want** comprehensive error handling for Payme payments  
**So that** issues are properly communicated and can be resolved

**Acceptance Criteria:**
- Implement Payme-specific error codes and messages
- Provide user-friendly error messages for common issues
- Log detailed error information for debugging
- Support error recovery and retry mechanisms
- Maintain error handling consistency across payment providers

**Technical Details:**
- Extend existing `PaymeError` enum
- Use same error middleware patterns as Click
- Implement retry logic for transient failures
- Provide actionable error messages
- Map Payme error codes to user-friendly messages

**Implementation Specifications:**
```javascript
// Enhanced Error Handling for Payme
class PaymeErrorHandler {
  static mapErrorToUserMessage(errorCode, language = 'en') {
    const errorMessages = {
      // System errors
      [-32300]: {
        en: 'Payment request method not supported',
        ru: 'Метод запроса не поддерживается',
        uz: 'So\'rov usuli qo\'llab-quvvatlanmaydi'
      },
      [-32700]: {
        en: 'Payment data format error',
        ru: 'Ошибка формата данных платежа',
        uz: 'To\'lov ma\'lumotlari formati xatosi'
      },
      [-32600]: {
        en: 'Invalid payment request',
        ru: 'Неверный запрос платежа',
        uz: 'Noto\'g\'ri to\'lov so\'rovi'
      },
      [-32601]: {
        en: 'Payment method not available',
        ru: 'Способ оплаты недоступен',
        uz: 'To\'lov usuli mavjud emas'
      },
      [-32504]: {
        en: 'Payment not authorized',
        ru: 'Платеж не авторизован',
        uz: 'To\'lov tasdiqlanmagan'
      },
      [-32400]: {
        en: 'Payment system temporarily unavailable',
        ru: 'Система оплаты временно недоступна',
        uz: 'To\'lov tizimi vaqtincha mavjud emas'
      },
      
      // Business logic errors
      [-31050]: {
        en: 'Phone number not found in Payme',
        ru: 'Номер телефона не найден в Payme',
        uz: 'Telefon raqami Payme da topilmadi'
      },
      [-31051]: {
        en: 'Booking not found or not available for payment',
        ru: 'Бронирование не найдено или недоступно для оплаты',
        uz: 'Bron topilmadi yoki to\'lov uchun mavjud emas'
      },
      [-31052]: {
        en: 'Transaction not found',
        ru: 'Транзакция не найдена',
        uz: 'Tranzaksiya topilmadi'
      },
      [-31053]: {
        en: 'Payment amount is incorrect',
        ru: 'Сумма платежа неверна',
        uz: 'To\'lov miqdori noto\'g\'ri'
      },
      [-31054]: {
        en: 'Payment session expired',
        ru: 'Сессия платежа истекла',
        uz: 'To\'lov sessiyasi tugadi'
      }
    };
    
    const error = errorMessages[errorCode];
    if (!error) {
      return {
        en: 'Unknown payment error occurred',
        ru: 'Произошла неизвестная ошибка платежа',
        uz: 'Noma\'lum to\'lov xatosi yuz berdi'
      }[language];
    }
    
    return error[language] || error.en;
  }
  
  static shouldRetry(errorCode) {
    // Retry only for system/network errors, not business logic errors
    const retryableErrors = [-32400, -32300, -32700];
    return retryableErrors.includes(errorCode);
  }
  
  static getRetryDelay(attempt) {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }
}

// Retry Logic Implementation
async function executeWithRetry(operation, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !PaymeErrorHandler.shouldRetry(error.code)) {
        throw error;
      }
      
      const delay = PaymeErrorHandler.getRetryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Error Middleware
function paymeErrorMiddleware(error, req, res, next) {
  if (error.name === 'PaymeError') {
    const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const userMessage = PaymeErrorHandler.mapErrorToUserMessage(error.code, language);
    
    // Log detailed error for debugging
    console.error('Payme Error:', {
      code: error.code,
      message: error.message,
      data: error.data,
      request: {
        url: req.url,
        method: req.method,
        body: req.body
      },
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: userMessage,
        type: 'payment_error'
      }
    });
  }
  
  next(error);
}

// Custom Error Classes
class PaymeError extends Error {
  constructor(code, message, data = null) {
    super(message);
    this.name = 'PaymeError';
    this.code = code;
    this.data = data;
  }
}

class PaymeValidationError extends PaymeError {
  constructor(message) {
    super(-31051, message);
  }
}

class PaymeApiError extends PaymeError {
  constructor(apiError) {
    super(apiError.code, apiError.message.en || apiError.message, apiError.data);
  }
}
```

**Error Recovery Strategies:**
- **Network Errors**: Implement exponential backoff retry
- **Validation Errors**: Provide clear guidance to fix the issue
- **Authentication Errors**: Refresh credentials and retry
- **Rate Limiting**: Implement backoff and queue mechanisms
- **API Downtime**: Fallback to alternative payment methods

**Definition of Done:**
- [ ] Error handling comprehensive
- [ ] User-friendly error messages
- [ ] Retry mechanisms implemented
- [ ] Error logging detailed

### US-PAY-012: Payment Analytics and Monitoring
**As a** business stakeholder  
**I want to** track payment method usage and success rates  
**So that** I can optimize the payment experience

**Acceptance Criteria:**
- Track payment method selection frequency
- Monitor payment success rates by provider
- Generate payment performance reports
- Alert on payment system issues
- Support A/B testing for payment methods

**Technical Details:**
- Extend existing transaction logging
- Use same analytics patterns as Click
- Implement dashboard metrics
- Support real-time monitoring

**Definition of Done:**
- [ ] Analytics tracking implemented
- [ ] Performance monitoring in place
- [ ] Reporting dashboard available
- [ ] Alert system configured

---

## Implementation Sequence

### Phase 1: Core Infrastructure (Sprint 1-3)
1. **US-PAY-001**: Enhanced Payme Service Architecture
2. **US-PAY-002**: Unified Transaction Management
3. **US-PAY-008**: Payment Provider Abstraction

**Phase 1 Goals:**
- Establish consistent architecture patterns
- Create reusable payment provider framework
- Refactor existing Payme code to follow SOLID principles

### Phase 2: API Development (Sprint 4-6)
4. **US-PAY-003**: Payme Invoice Creation
5. **US-PAY-004**: Payme Payment Status Checking
6. **US-PAY-005**: Payme Payment Verification
7. **US-PAY-006**: Unified Payment Controller

**Phase 2 Goals:**
- Complete backend API for Payme payments
- Ensure feature parity with Click implementation
- Implement comprehensive testing suite

### Phase 3: Integration & UX (Sprint 7-8)
8. **US-PAY-007**: Frontend Payme Integration
9. **US-PAY-010**: Payment Method Selection Enhancement
10. **US-PAY-009**: Payme Webhook Integration

**Phase 3 Goals:**
- Complete user-facing payment functionality
- Ensure seamless payment experience
- Implement real-time payment updates

### Phase 4: Enhancement & Monitoring (Sprint 9-10)
11. **US-PAY-011**: Enhanced Error Handling
12. **US-PAY-012**: Payment Analytics and Monitoring

**Phase 4 Goals:**
- Optimize system reliability and monitoring
- Implement business intelligence features
- Prepare for production deployment

## Technical Considerations

### Leveraging Existing Functionality
- **TransactionService**: Extend existing methods for Payme support
- **BookingService**: Use existing payment confirmation workflow
- **Authentication**: Reuse existing JWT and authorization patterns
- **Validation**: Apply same booking validation rules
- **Notifications**: Use existing notification system for payment updates

### SOLID Principles Application
- **Single Responsibility**: Each service handles one payment provider
- **Open/Closed**: Payment system open for new providers, closed for modification
- **Liskov Substitution**: Payment providers interchangeable through interface
- **Interface Segregation**: Separate interfaces for different payment operations
- **Dependency Inversion**: Depend on abstractions, not concrete implementations

### DRY Implementation
- Reuse existing transaction state management
- Share common payment validation logic
- Use same error handling patterns
- Leverage existing booking workflow integration
- Maintain consistent API response formats

## Risk Assessment

### High Risk
- **Payment Security**: Ensure proper validation and encryption for financial transactions
- **Data Consistency**: Maintain transaction integrity across payment providers
- **API Reliability**: Handle Payme API downtime and rate limiting

### Medium Risk
- **User Experience**: Ensure smooth transition between payment methods
- **Performance**: Maintain system performance with additional payment provider
- **Testing Coverage**: Comprehensive testing of payment flows

### Low Risk
- **Code Maintenance**: Additional complexity in payment system
- **Documentation**: Keeping documentation updated with new features

## Success Criteria

### Technical Success
- [ ] All user stories completed and tested
- [ ] Zero critical bugs in payment functionality
- [ ] Performance meets existing benchmarks
- [ ] Code coverage >90% for payment modules

### Business Success
- [ ] Successful payment processing for both Click and Payme
- [ ] User adoption of new payment method >20%
- [ ] Payment conversion rate maintained or improved
- [ ] System reliability >99.9% uptime

## Dependencies

### External Dependencies
- Payme Merchant API availability and documentation
- Payme webhook infrastructure setup
- SSL certificates for secure payment processing

### Internal Dependencies
- Database migration capabilities
- Frontend deployment pipeline
- Monitoring and alerting infrastructure

## Key Corrections Made to Documentation

### 1. Account Structure Corrections
**Issue**: Initial examples used complex account objects with booking_id as primary field
**Correction**: Payme API primarily uses phone number for account identification
- Primary field: `phone` (required)
- Secondary fields: `booking_id`, `user_id` (optional, for merchant reference)

### 2. Transaction State Corrections
**Issue**: Unclear state mapping for cancelled transactions
**Correction**: Payme uses two cancellation states:
- State `-1`: Cancelled due to timeout
- State `-2`: Cancelled by user/system action

### 3. Response Format Corrections
**Issue**: Examples didn't match actual Payme API response structure
**Correction**: Updated all examples to match official API:
- Field order matches API documentation
- Response includes proper field names (e.g., `create_time`, `perform_time`)
- Added missing `GetStatement` method

### 4. Chain Payment Support
**Addition**: Documented chain payment feature for multi-receiver scenarios:
- Direct payment: All funds to platform account
- Chain payment: Split funds between multiple receivers
- Booking platforms typically use direct payment

### 5. Cancel Reason Codes
**Addition**: Added official cancel reason codes:
- `1`: Timeout
- `2`: User cancelled  
- `3`: System error
- `4`: Insufficient funds

## Payme API Reference Guide

### Complete Method Reference

#### 1. CheckPerformTransaction
**Purpose**: Validate transaction eligibility before creation  
**Called By**: Merchant system before creating transaction  

**Request:**
```json
{
  "method": "CheckPerformTransaction",
  "params": {
    "amount": 500000,
    "account": {
      "phone": "903595731"
    }
  },
  "id": 1
}
```

**Success Response:**
```json
{
  "result": {
    "allow": true
  },
  "id": 1
}
```

**Error Scenarios:**
- `-31051`: Account (booking) not found
- `-31053`: Invalid amount
- `-31050`: Phone number not registered in Payme

#### 2. CreateTransaction
**Purpose**: Create new payment transaction  
**Called By**: Merchant system after successful validation  

**Request:**
```json
{
  "method": "CreateTransaction",
  "params": {
    "id": "5305e3bab097f420a62ced0b",
    "time": 1399114284039,
    "amount": 500000,
    "account": {
      "phone": "903595731"
    }
  },
  "id": 2
}
```

**Success Response (Direct Payment):**
```json
{
  "result": {
    "create_time": 1399114284039,
    "transaction": "5123",
    "state": 1
  },
  "id": 2
}
```

**Success Response (Chain Payment with Multiple Receivers):**
```json
{
  "result": {
    "create_time": 1399114284039,
    "transaction": "5123",
    "state": 1,
    "receivers": [
      {
        "id": "5305e3bab097f420a62ced0b",
        "amount": 200000
      },
      {
        "id": "4215e6bab097f420a62ced01",
        "amount": 300000
      }
    ]
  },
  "id": 2
}
```

**Note**: For booking platform, typically use direct payment where all funds go to platform account.

#### 3. PerformTransaction
**Purpose**: Execute/complete the payment  
**Called By**: Payme system after user payment  

**Request:**
```json
{
  "method": "PerformTransaction",
  "params": {
    "id": "5305e3bab097f420a62ced0b"
  },
  "id": 3
}
```

**Success Response:**
```json
{
  "result": {
    "transaction": "5123",
    "perform_time": 1399114284039,
    "state": 2
  },
  "id": 3
}
```

#### 4. CheckTransaction
**Purpose**: Get current transaction status  
**Called By**: Both merchant and Payme systems  

**Request:**
```json
{
  "method": "CheckTransaction",
  "params": {
    "id": "5305e3bab097f420a62ced0b"
  },
  "id": 4
}
```

**Success Response:**
```json
{
  "result": {
    "create_time": 1399114284039,
    "perform_time": 1399114285002,
    "cancel_time": 0,
    "transaction": "5123",
    "state": 2,
    "reason": null
  },
  "id": 4
}
```

#### 5. CancelTransaction
**Purpose**: Cancel pending transaction  
**Called By**: Payme system for timeouts or user cancellation  

**Request:**
```json
{
  "method": "CancelTransaction",
  "params": {
    "id": "5305e3bab097f420a62ced0b",
    "reason": 1
  },
  "id": 5
}
```

**Success Response:**
```json
{
  "result": {
    "transaction": "5123",
    "cancel_time": 1399114284039,
    "state": -2
  },
  "id": 5
}
```

**Cancel Reason Codes:**
- `1`: Timeout
- `2`: User cancelled
- `3`: System error
- `4`: Insufficient funds

#### 6. GetStatement
**Purpose**: Get transaction history for a specific time period  
**Called By**: Merchant system for reconciliation and reporting  

**Request:**
```json
{
  "method": "GetStatement",
  "params": {
    "from": 1399114284039,
    "to": 1399120284000
  },
  "id": 6
}
```

**Success Response (No Transactions):**
```json
{
  "result": {
    "transactions": []
  },
  "id": 6
}
```

**Success Response (With Transactions):**
```json
{
  "result": {
    "transactions": [
      {
        "id": "5305e3bab097f420a62ced0b",
        "time": 1399114284039,
        "amount": 500000,
        "account": {
          "phone": "903595731"
        },
        "create_time": 1399114284039,
        "perform_time": 1399114285002,
        "cancel_time": 0,
        "transaction": "5123",
        "state": 2,
        "reason": null,
        "receivers": [
          {
            "id": "5305e3bab097f420a62ced0b",
            "amount": 200000
          },
          {
            "id": "4215e6bab097f420a62ced01",
            "amount": 300000
          }
        ]
      }
    ]
  },
  "id": 6
}
```

### Environment Configuration

#### Development Environment
```javascript
// .env.development
PAYME_MERCHANT_ID=your_test_merchant_id
PAYME_SECRET_KEY=your_test_secret_key
PAYME_BASE_URL=https://checkout.test.paycom.uz
PAYME_TIMEOUT=300000 // 5 minutes
```

#### Production Environment
```javascript
// .env.production
PAYME_MERCHANT_ID=your_prod_merchant_id
PAYME_SECRET_KEY=your_prod_secret_key
PAYME_BASE_URL=https://checkout.paycom.uz
PAYME_TIMEOUT=300000 // 5 minutes
```

### Testing Scenarios

#### Test Cards for Development
| Card Number | Description | Expected Result |
|-------------|-------------|-----------------|
| 8600 0000 0000 0000 | Successful payment | Transaction completes |
| 8600 0000 0000 0001 | Insufficient funds | Transaction fails |
| 8600 0000 0000 0002 | Card blocked | Transaction fails |
| 8600 0000 0000 0003 | Timeout simulation | Transaction times out |

#### Integration Test Cases
1. **Successful Payment Flow**
   - Create booking
   - Generate Payme invoice
   - Complete payment in test environment
   - Verify booking approval

2. **Failed Payment Scenarios**
   - Invalid amount validation
   - Expired transaction handling
   - Network failure recovery
   - Duplicate transaction prevention

3. **Webhook Testing**
   - Test all webhook methods
   - Verify idempotency
   - Test authentication validation
   - Error response handling

### Monitoring and Alerting

#### Key Metrics to Track
```javascript
// Metrics Configuration
const paymeMetrics = {
  // Transaction metrics
  transaction_count: 'Counter for total transactions',
  transaction_success_rate: 'Success rate percentage',
  transaction_amount_total: 'Total transaction amounts',
  
  // Performance metrics
  api_response_time: 'Payme API response times',
  webhook_processing_time: 'Webhook processing duration',
  
  // Error metrics
  error_rate_by_code: 'Error distribution by error codes',
  retry_attempts: 'Number of retry attempts',
  
  // Business metrics
  conversion_rate: 'Payment conversion rate',
  average_transaction_value: 'Average payment amount'
};
```

#### Alert Thresholds
- **High Error Rate**: >5% errors in 5-minute window
- **Slow Response**: >3 seconds average API response time
- **Low Success Rate**: <95% transaction success rate
- **High Retry Rate**: >10% of requests require retries

### Troubleshooting Guide

#### Common Issues and Solutions

**Issue**: Transaction creation fails with -31051
**Solution**: Verify booking exists and is in 'selected' status

**Issue**: Amount validation fails
**Solution**: Ensure amount is in tiyin (UZS * 100) and matches booking total

**Issue**: Authentication failures
**Solution**: Verify merchant credentials and Base64 encoding

**Issue**: Webhook not receiving calls
**Solution**: Check URL accessibility and SSL certificate validity

**Issue**: Duplicate transactions
**Solution**: Implement proper idempotency handling using transaction IDs

### Security Checklist

- [ ] All API communications use HTTPS
- [ ] Merchant credentials stored securely (environment variables)
- [ ] Webhook endpoints validate authentication
- [ ] Transaction amounts validated on both client and server
- [ ] Proper error handling prevents information leakage
- [ ] Request/response logging excludes sensitive data
- [ ] Rate limiting implemented for API endpoints
- [ ] Input validation prevents injection attacks
- [ ] Timeout handling prevents resource exhaustion
- [ ] Regular security audits scheduled

## Post-Implementation

### Monitoring Plan
- Payment success rates by provider
- Transaction processing times
- Error rates and types
- User payment method preferences

### Maintenance Plan
- Regular security audits
- API integration health checks
- Performance optimization reviews
- User feedback collection and analysis

---

**Document Version:** 1.0  
**Last Updated:** August 16, 2025  
**Next Review:** September 1, 2025  

This Epic ensures that Payme integration follows the established patterns in your system while providing a seamless experience for users and maintainable code for developers.
