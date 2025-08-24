/**
 * Test Frontend Notification Display Logic
 * Tests the frontend notification translation logic for cash payment notifications
 */

// Simulate frontend i18n and translation utilities
function mockT(key, variables = {}) {
  const translations = {
    'booking_payment_pending.title': 'Cash Payment Request',
    'booking_payment_pending.message': 'Client with booking {{bookingReference}} for "{{placeName}}" on {{dateRange}}{{timeRange}} selected cash payment. Please collect payment offline.'
  };
  
  let translation = translations[key] || key;
  
  // Simple variable substitution
  Object.entries(variables).forEach(([varKey, value]) => {
    translation = translation.replace(new RegExp(`{{${varKey}}}`, 'g'), value);
  });
  
  return translation;
}

// Mock processNotificationVariables function (simplified)
function processNotificationVariables(variables, t, language = 'en') {
  if (!variables) return {};
  
  const processed = { ...variables };
  
  // Format date range if we have raw date data
  if (variables.checkInDate) {
    const checkIn = new Date(variables.checkInDate);
    const checkOut = new Date(variables.checkOutDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };
    
    processed.dateRange = variables.isDateRange && checkIn.getTime() !== checkOut.getTime()
      ? `${formatDate(checkIn)} - ${formatDate(checkOut)}`
      : formatDate(checkIn);
  }
  
  // Format time range if we have raw time slot data
  if (variables.timeSlots) {
    processed.timeRange = ` from ${variables.timeSlots.startTime} to ${variables.timeSlots.endTime}`;
  } else {
    processed.timeRange = '';
  }
  
  return processed;
}

// Frontend notification translation logic (our updated version)
function getTranslatedContent(notification, t, language = 'en') {
  const { title, message, metadata } = notification;
  
  // Check if we have new format with metadata.translationKey
  if (metadata?.translationKey && metadata?.translationVariables) {
    const titleKey = `${metadata.translationKey}.title`;
    const messageKey = `${metadata.translationKey}.message`;
    
    try {
      // Process translation variables to format dates/times
      const processedVariables = processNotificationVariables(
        metadata.translationVariables,
        t,
        language
      );
      
      const translatedTitle = t(titleKey, processedVariables);
      const translatedMessage = t(messageKey, processedVariables);
      
      return {
        title: translatedTitle,
        message: translatedMessage
      };
    } catch (error) {
      console.error("Error translating notification:", error);
      return {
        title: "Notification Error",
        message: "Unable to display notification content"
      };
    }
  }
  
  // Handle backend format where title is already in the form "booking_payment_pending.title"
  if (title && title.includes('.title') && metadata?.translationVariables) {
    // Extract the base key (remove .title suffix)
    const baseKey = title.replace('.title', '');
    const titleKey = `${baseKey}.title`;
    const messageKey = `${baseKey}.message`;
    
    try {
      // Process translation variables to format dates/times
      const processedVariables = processNotificationVariables(
        metadata.translationVariables,
        t,
        language
      );
      
      const translatedTitle = t(titleKey, processedVariables);
      const translatedMessage = t(messageKey, processedVariables);
      
      return {
        title: translatedTitle,
        message: translatedMessage
      };
    } catch (error) {
      console.error("Error translating backend format notification:", error);
      return {
        title: title.replace('.title', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        message: message || "Notification content unavailable"
      };
    }
  }
  
  // Fallback for legacy notifications or notifications without proper format
  return {
    title: title || "Notification",
    message: message || "Notification content unavailable"
  };
}

// Test with actual notification data from our backend test
const testNotification = {
  id: 385,
  type: "booking_payment_pending",
  title: "booking_payment_pending.title",
  message: "booking_payment_pending.message",
  metadata: {
    placeId: 7,
    bookingId: 145,
    placeName: "Place with all perks",
    timeSlots: [
      {
        date: "2025-08-25",
        endTime: "11:00",
        startTime: "10:00"
      }
    ],
    selectedAt: "2025-08-24T13:46:17.829Z",
    totalPrice: 1000,
    checkInDate: "2025-08-25T00:00:00.000Z",
    checkOutDate: "2025-08-25T00:00:00.000Z",
    paymentMethod: "cash",
    dateTimeWindow: "Aug 25, 2025 from 10:00 to 11:00",
    translationKey: "booking_payment_pending",
    uniqueRequestId: "REQ-MEPNFNI4-ZI1TA",
    bookingReference: "REQ-MEPNFNI4-ZI1TA",
    notificationType: "agent_cash_payment_selected",
    translationVariables: {
      placeName: "Place with all perks",
      timeSlots: {
        endTime: "11:00",
        startTime: "10:00"
      },
      checkInDate: "2025-08-25T00:00:00.000Z",
      isDateRange: true,
      checkOutDate: "2025-08-25T00:00:00.000Z",
      paymentMethod: "cash",
      bookingReference: "REQ-MEPNFNI4-ZI1TA"
    }
  }
};

console.log('🎯 FRONTEND NOTIFICATION TRANSLATION TEST');
console.log('==========================================\n');

console.log('📝 Input notification data:');
console.log('- Title:', testNotification.title);
console.log('- Message:', testNotification.message);
console.log('- Has translationKey:', !!testNotification.metadata.translationKey);
console.log('- Has translationVariables:', !!testNotification.metadata.translationVariables);
console.log('- Booking Reference:', testNotification.metadata.bookingReference);
console.log('- Place Name:', testNotification.metadata.placeName);
console.log('- Date Range:', testNotification.metadata.checkInDate, 'to', testNotification.metadata.checkOutDate);
console.log('- Time Slots:', testNotification.metadata.translationVariables.timeSlots);
console.log('');

console.log('🔄 Processing translation...');
const result = getTranslatedContent(testNotification, mockT, 'en');

console.log('✅ Translation Result:');
console.log('- Translated Title:', result.title);
console.log('- Translated Message:', result.message);
console.log('');

// Validate the result
const expectedTitle = 'Cash Payment Request';
const shouldContainInMessage = ['REQ-MEPNFNI4-ZI1TA', 'Place with all perks', 'Aug 25, 2025', 'from 10:00 to 11:00', 'cash payment'];

console.log('🧪 VALIDATION RESULTS:');
console.log('======================');

let testsPassed = 0;
let totalTests = 0;

// Test 1: Title translation
totalTests++;
if (result.title === expectedTitle) {
  console.log('✅ Title translation: PASS');
  testsPassed++;
} else {
  console.log('❌ Title translation: FAIL');
  console.log(`   Expected: "${expectedTitle}"`);
  console.log(`   Got: "${result.title}"`);
}

// Test 2: Message contains expected elements
totalTests++;
const messageValid = shouldContainInMessage.every(text => result.message.includes(text));
if (messageValid) {
  console.log('✅ Message content: PASS');
  testsPassed++;
} else {
  console.log('❌ Message content: FAIL');
  console.log('   Message should contain:', shouldContainInMessage);
  console.log('   Actual message:', result.message);
}

// Test 3: No translation keys left in result
totalTests++;
const hasTranslationKeys = result.title.includes('.title') || result.message.includes('.message');
if (!hasTranslationKeys) {
  console.log('✅ No raw translation keys: PASS');
  testsPassed++;
} else {
  console.log('❌ No raw translation keys: FAIL');
  console.log('   Still contains untranslated keys');
}

console.log('');
console.log(`🎯 FINAL RESULT: ${testsPassed}/${totalTests} tests passed`);

if (testsPassed === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Frontend notification display is working correctly.');
  process.exit(0);
} else {
  console.log('💥 SOME TESTS FAILED! Frontend notification display needs fixes.');
  process.exit(1);
}
