/**
 * Simple verification of error codes for debugging
 */

const { PaymeError } = require('../enum/transaction.enum');

console.log('=== Payme Error Codes Verification ===\n');

console.log('InvalidAmount:', PaymeError.InvalidAmount.code, '(should be -31001)');
console.log('UserNotFound:', PaymeError.UserNotFound.code, '(should be -31051)');
console.log('BookingNotFound:', PaymeError.BookingNotFound.code, '(should be -31052)');
console.log('Pending:', PaymeError.Pending.code, '(should be -31099)');
console.log('CantDoOperation:', PaymeError.CantDoOperation.code);
console.log('TransactionNotFound:', PaymeError.TransactionNotFound.code);
console.log('AlreadyDone:', PaymeError.AlreadyDone.code);
console.log('InvalidAuthorization:', PaymeError.InvalidAuthorization.code, '(should be -32504)');

console.log('\n=== Verification Complete ===');
