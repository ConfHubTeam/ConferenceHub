# Octo Payment Fix for Telegram-Authenticated Users

## Problem Description

When users authenticated through Telegram attempted to make payments via Octo, the `prepare` endpoint was returning a 500 error. However, users authenticated through email/password had no issues with Octo payments.

## Root Cause Analysis

### Database Structure
The `Users` table has the following relevant nullable columns:
- `email` (VARCHAR, nullable)
- `phoneNumber` (VARCHAR, nullable)
- `telegramPhone` (VARCHAR, nullable)
- `telegramId` (VARCHAR, nullable)
- `clickPhoneNumber` (VARCHAR, nullable)
- `paymePhoneNumber` (VARCHAR, nullable)

### The Issue

1. **Telegram Authentication Flow** (`api/controllers/telegramAuth.js`):
   - When users register/login via Telegram, they may not provide an email
   - The `User` record is created with `email: null` (or email field is omitted)
   - Telegram users have `telegramId`, `telegramUsername`, etc., but email is optional

2. **Octo Service Payload** (`api/services/octoService.js`):
   - The previous code was building the `user_data` object like this:
   ```javascript
   user_data: {
     user_id: String(user.id),
     phone: this._formatPhone(user.phoneNumber || user.clickPhoneNumber || user.telegramPhone || ''),
     email: user.email || undefined,  // ❌ PROBLEM: sending undefined
   }
   ```
   - When `user.email` was `null` or undefined, the code set `email: undefined`
   - The Octo API likely **rejects payloads with undefined values** or requires email to be omitted entirely if not available

3. **Email/Password Authentication**:
   - Email is a required field during registration (`api/controllers/authController.js`)
   - These users always have a valid email, so no issue occurred

## Solution Implemented

Modified `api/services/octoService.js` to conditionally include optional fields only when they have valid values:

```javascript
// Build request payload - only include fields that exist
const userData = {
  user_id: String(user.id),  // Always required
};

// Only add phone if user has one
const phone = this._formatPhone(user.phoneNumber || user.clickPhoneNumber || user.telegramPhone || '');
if (phone) {
  userData.phone = phone;
}

// Only add email if user has one (Telegram users might not have email)
if (user.email) {
  userData.email = user.email;
}

const payload = {
  octo_shop_id: this.shopId,
  octo_secret: this.secret,
  shop_transaction_id: booking.uniqueRequestId || `booking_${booking.id}`,
  auto_capture: true,
  test: !!test,
  init_time: initTime,
  user_data: userData,  // ✅ Clean object without undefined values
  total_sum: total,
  // ... rest of payload
};
```

## Changes Made

### File: `api/services/octoService.js`

**Before:**
```javascript
user_data: {
  user_id: String(user.id),
  phone: this._formatPhone(user.phoneNumber || user.clickPhoneNumber || user.telegramPhone || ''),
  email: user.email || undefined,
}
```

**After:**
```javascript
const userData = {
  user_id: String(user.id),
};

const phone = this._formatPhone(user.phoneNumber || user.clickPhoneNumber || user.telegramPhone || '');
if (phone) {
  userData.phone = phone;
}

if (user.email) {
  userData.email = user.email;
}
```

## Benefits

1. **Telegram Users Can Pay**: Users authenticated via Telegram can now successfully initiate Octo payments
2. **Cleaner API Calls**: No undefined values sent to Octo API
3. **Backward Compatible**: Email/password users continue to work as before
4. **Follows Best Practices**: Only sends fields that have actual values
5. **Flexible**: Handles multiple phone number sources (phoneNumber, clickPhoneNumber, telegramPhone)

## Testing Recommendations

### Manual Testing
1. Create/login a user via Telegram authentication
2. Create a booking as that user
3. Attempt to pay using Octo
4. Verify the payment preparation succeeds and returns a payment URL

### Automated Testing
Consider adding unit tests for `OctoService.preparePayment()` with:
- User with email and phone
- User with only phone (Telegram user)
- User with only email
- User with neither (edge case)

## Related Files

- `api/services/octoService.js` - Payment service (modified)
- `api/controllers/octoController.js` - Payment controller
- `api/controllers/telegramAuth.js` - Telegram authentication
- `api/controllers/authController.js` - Email/password authentication
- `api/models/users.js` - User model

## Notes

- The `_formatPhone()` method already handles undefined/empty phone gracefully by returning `undefined`
- The Octo API appears to require clean JSON without undefined values
- Consider adding email collection during Telegram registration flow (optional UX improvement)
