const UnifiedNotificationService = require("../services/unifiedNotificationService");

async function testSMSTemplate() {
  console.log("🔍 TESTING SMS TEMPLATE GENERATION");
  console.log("==================================");

  // Test metadata (matching what we have in the database)
  const metadata = {
    dates: "Jul 20, 2025",
    placeId: 21,
    bookingId: 999,
    placeName: "Test Refund Options",
    bookingReference: "REQ-TEST-123"
  };

  // Mock user
  const user = {
    id: 2,
    name: "Test User",
    phoneNumber: "+998901234567"
  };

  console.log("📋 Input metadata:", metadata);
  console.log("👤 User:", user);

  try {
    // Test the SMS message generation
    const smsMessage = await UnifiedNotificationService.generateSMSMessage(
      "booking_requested",
      metadata,
      user
    );

    console.log("📱 Generated SMS message:", smsMessage);

    // Test the template directly
    const template = UnifiedNotificationService.SMS_TEMPLATES.booking_requested;
    const directMessage = template({
      bookingReference: "REQ-TEST-123",
      placeName: "Test Refund Options",
      dates: "Jul 20, 2025"
    });

    console.log("📝 Direct template message:", directMessage);

    // Test enriched metadata
    const enrichedMetadata = await UnifiedNotificationService.enrichMetadataForSMS(metadata, user);
    console.log("🔄 Enriched metadata:", enrichedMetadata);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSMSTemplate();
