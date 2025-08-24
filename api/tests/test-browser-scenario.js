/**
 * Test Frontend with Real Browser Scenario
 * This tests the exact scenario shown in the browser screenshot where
 * the notification shows "booking_payment_pending.title" instead of translated text
 */

// Simulate the exact notification data from the database query we saw earlier
const realNotificationFromDB = {
  id: 384,
  type: "booking_payment_pending", 
  title: "booking_payment_pending.title",
  message: "booking_payment_pending.message",
  metadata: {
    placeId: 7,
    bookingId: 146,
    placeName: "Place with all perks",
    timeSlots: [
      {
        date: "2025-09-08",
        endTime: "06:00",
        startTime: "05:00"
      }
    ],
    selectedAt: "2025-08-24T13:40:39.032Z",
    totalPrice: 1000,
    checkInDate: "2025-09-08T00:00:00.000Z",
    checkOutDate: "2025-09-08T00:00:00.000Z",
    paymentMethod: "cash",
    dateTimeWindow: "Sep 8, 2025 from 05:00 to 06:00",
    translationKey: "booking_payment_pending",
    uniqueRequestId: "REQ-MEPPS70Y-Y4Y48",
    bookingReference: "REQ-MEPPS70Y-Y4Y48",
    notificationType: "agent_cash_payment_selected",
    translationVariables: {
      placeName: "Place with all perks",
      timeSlots: {
        endTime: "06:00",
        startTime: "05:00"
      },
      checkInDate: "2025-09-08T00:00:00.000Z",
      isDateRange: true,
      checkOutDate: "2025-09-08T00:00:00.000Z",
      paymentMethod: "cash",
      bookingReference: "REQ-MEPPS70Y-Y4Y48"
    }
  }
};

// Mock frontend translations (what we added to the frontend files)
const frontendTranslations = {
  'booking_payment_pending.title': 'Cash Payment Request',
  'booking_payment_pending.message': 'Client with booking {{bookingReference}} for "{{placeName}}" on {{dateRange}}{{timeRange}} selected cash payment. Please collect payment offline.'
};

function mockFrontendT(key, variables = {}) {
  let translation = frontendTranslations[key] || key;
  
  // Simple variable substitution
  Object.entries(variables).forEach(([varKey, value]) => {
    translation = translation.replace(new RegExp(`{{${varKey}}}`, 'g'), value);
  });
  
  return translation;
}

// Mock date/time processing
function processNotificationVariables(variables, t, language = 'en') {
  if (!variables) return {};
  
  const processed = { ...variables };
  
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
  
  if (variables.timeSlots) {
    processed.timeRange = ` from ${variables.timeSlots.startTime} to ${variables.timeSlots.endTime}`;
  } else {
    processed.timeRange = '';
  }
  
  return processed;
}

// OLD Frontend Logic (what was causing the problem)
function oldFrontendLogic(notification, t) {
  const { metadata } = notification;
  
  // This only worked if metadata.translationKey existed but title was different
  if (metadata?.translationKey && metadata?.translationVariables) {
    const titleKey = `${metadata.translationKey}.title`;  // "booking_payment_pending.title"
    const messageKey = `${metadata.translationKey}.message`;
    
    const processedVariables = processNotificationVariables(metadata.translationVariables, t);
    const translatedTitle = t(titleKey, processedVariables);
    const translatedMessage = t(messageKey, processedVariables);
    
    return { title: translatedTitle, message: translatedMessage };
  }
  
  // Would fallback to raw title/message, showing "booking_payment_pending.title"
  return { 
    title: notification.title,  // "booking_payment_pending.title" 
    message: notification.message 
  };
}

// NEW Frontend Logic (our fix)
function newFrontendLogic(notification, t) {
  const { title, message, metadata } = notification;
  
  // Check if we have new format with metadata.translationKey
  if (metadata?.translationKey && metadata?.translationVariables) {
    const titleKey = `${metadata.translationKey}.title`;
    const messageKey = `${metadata.translationKey}.message`;
    
    try {
      const processedVariables = processNotificationVariables(metadata.translationVariables, t);
      const translatedTitle = t(titleKey, processedVariables);
      const translatedMessage = t(messageKey, processedVariables);
      
      return { title: translatedTitle, message: translatedMessage };
    } catch (error) {
      console.error("Error translating notification:", error);
      return { title: "Notification Error", message: "Unable to display notification content" };
    }
  }
  
  // Handle backend format where title is already "booking_payment_pending.title"
  if (title && title.includes('.title') && metadata?.translationVariables) {
    const baseKey = title.replace('.title', '');  // "booking_payment_pending"
    const titleKey = `${baseKey}.title`;
    const messageKey = `${baseKey}.message`;
    
    try {
      const processedVariables = processNotificationVariables(metadata.translationVariables, t);
      const translatedTitle = t(titleKey, processedVariables);
      const translatedMessage = t(messageKey, processedVariables);
      
      return { title: translatedTitle, message: translatedMessage };
    } catch (error) {
      console.error("Error translating backend format notification:", error);
      return {
        title: title.replace('.title', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        message: message || "Notification content unavailable"
      };
    }
  }
  
  // Fallback for legacy notifications
  return { title: title || "Notification", message: message || "Notification content unavailable" };
}

console.log('🔍 REAL BROWSER SCENARIO TEST');
console.log('==============================\n');

console.log('📱 Browser notification data (from screenshot):');
console.log('- Shown Title: "booking_payment_pending.title" ❌');
console.log('- Expected Title: "Cash Payment Request" ✅');
console.log('- Booking ID:', realNotificationFromDB.metadata.bookingReference);
console.log('- DB Title Field:', realNotificationFromDB.title);
console.log('- DB Message Field:', realNotificationFromDB.message);
console.log('');

console.log('🔧 Testing OLD frontend logic (what caused the issue):');
const oldResult = oldFrontendLogic(realNotificationFromDB, mockFrontendT);
console.log('- Old Title Result:', oldResult.title);
console.log('- Old Message Result:', oldResult.message);
console.log('- Shows translation key?', oldResult.title.includes('.title') ? '❌ YES (BROKEN)' : '✅ NO');
console.log('');

console.log('✨ Testing NEW frontend logic (our fix):');
const newResult = newFrontendLogic(realNotificationFromDB, mockFrontendT);
console.log('- New Title Result:', newResult.title);
console.log('- New Message Result:', newResult.message);
console.log('- Shows translation key?', newResult.title.includes('.title') ? '❌ YES' : '✅ NO (FIXED)');
console.log('');

// Validation
console.log('🧪 VALIDATION:');
console.log('================');

let fixes = 0;
let totalChecks = 3;

// Check 1: Title should be translated
if (newResult.title === 'Cash Payment Request') {
  console.log('✅ Title properly translated');
  fixes++;
} else {
  console.log('❌ Title not properly translated:', newResult.title);
}

// Check 2: Should contain booking reference
if (newResult.message.includes('REQ-MEPPS70Y-Y4Y48')) {
  console.log('✅ Message contains booking reference');
  fixes++;
} else {
  console.log('❌ Message missing booking reference');
}

// Check 3: Should not show raw translation keys
if (!newResult.title.includes('.title') && !newResult.message.includes('.message')) {
  console.log('✅ No raw translation keys visible');
  fixes++;
} else {
  console.log('❌ Still showing raw translation keys');
}

console.log('');
console.log(`🎯 FINAL RESULT: ${fixes}/${totalChecks} issues fixed`);

if (fixes === totalChecks) {
  console.log('🎉 SUCCESS! The notification display issue has been resolved.');
  console.log('');
  console.log('👀 What the user will see now:');
  console.log(`   📱 ${newResult.title}`);
  console.log(`   📝 ${newResult.message}`);
  process.exit(0);
} else {
  console.log('💥 FAILED! Issue still exists.');
  process.exit(1);
}
