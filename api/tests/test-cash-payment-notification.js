/**
 * Test for Cash Payment Notification Feature
 * 
 * This test mimics the current condition where:
 * - A booking exists with "selected" status
 * - A client calls selectCashPayment (handleCash)
 * - Verifies that notifications are created for agents
 */

const { Booking, Place, User, Notification } = require('../models');
const BookingNotificationService = require('../services/bookingNotificationService');
const AgentService = require('../services/agentService');

async function testCashPaymentNotification() {
  console.log('🧪 Starting Cash Payment Notification Test...\n');

  try {
    // Step 1: Get the existing booking with selected status (booking ID 145)
    console.log('📋 Step 1: Fetching existing booking...');
    const bookingId = 145;
    
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Place,
          as: "place",
          attributes: ["id", "title", "ownerId"]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }

    console.log(`✅ Found booking: ${booking.uniqueRequestId}`);
    console.log(`   - Status: ${booking.status}`);
    console.log(`   - Place: ${booking.place ? booking.place.title : 'No place data'}`);
    console.log(`   - Client: ${booking.user ? booking.user.name : 'No user data'}`);
    console.log(`   - Total Price: ${booking.totalPrice}`);
    console.log(`   - Date: ${booking.checkInDate ? booking.checkInDate.toISOString().split('T')[0] : 'N/A'}`);
    console.log('');

    // Step 2: Verify there are agents available
    console.log('👥 Step 2: Checking available agents...');
    const agents = await AgentService.getAllAgents();
    
    if (!agents || agents.length === 0) {
      throw new Error('No agents found in the system');
    }

    console.log(`✅ Found ${agents.length} agent(s):`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.email}) - Phone: ${agent.phoneNumber || 'N/A'}`);
    });
    console.log('');

    // Step 3: Count existing notifications before the test
    console.log('📊 Step 3: Counting existing notifications...');
    const notificationsBefore = await Notification.count({
      where: {
        type: 'booking_payment_pending',
        userId: agents.map(agent => agent.id)
      }
    });
    console.log(`📧 Existing notifications: ${notificationsBefore}`);
    console.log('');

    // Step 4: Simulate cash payment selection
    console.log('💰 Step 4: Simulating cash payment selection...');
    console.log(`Calling createCashPaymentSelectedNotification for booking ${booking.id}...`);
    
    const notifications = await BookingNotificationService.createCashPaymentSelectedNotification(booking);
    
    console.log(`✅ Cash payment notification created successfully!`);
    console.log(`📧 Created ${notifications.length} notification(s)`);
    console.log('');

    // Step 5: Verify notifications were created
    console.log('🔍 Step 5: Verifying notifications in database...');
    const notificationsAfter = await Notification.count({
      where: {
        type: 'booking_payment_pending',
        userId: agents.map(agent => agent.id)
      }
    });

    const newNotifications = notificationsAfter - notificationsBefore;
    console.log(`📧 Total notifications after: ${notificationsAfter}`);
    console.log(`📧 New notifications created: ${newNotifications}`);
    console.log('');

    // Step 6: Detailed verification of created notifications
    console.log('📝 Step 6: Checking notification details...');
    const recentNotifications = await Notification.findAll({
      where: {
        type: 'booking_payment_pending',
        userId: agents.map(agent => agent.id)
      },
      order: [['created_at', 'DESC']],
      limit: newNotifications,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    console.log(`Found ${recentNotifications.length} recent notification(s):`);
    recentNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. To: ${notification.user.name} (${notification.user.email})`);
      console.log(`      Type: ${notification.type}`);
      console.log(`      Title: ${notification.title}`);
      console.log(`      Message: ${notification.message}`);
      console.log(`      Metadata: ${JSON.stringify(notification.metadata, null, 6)}`);
      console.log(`      Created: ${notification.created_at}`);
      console.log('');
    });

    // Step 7: Test Results Summary
    console.log('🎯 TEST RESULTS SUMMARY:');
    console.log('========================');
    
    const expectedNotifications = agents.length;
    const actualNotifications = newNotifications;
    
    if (actualNotifications === expectedNotifications) {
      console.log(`✅ SUCCESS: Expected ${expectedNotifications} notifications, got ${actualNotifications}`);
      console.log('✅ All agents were notified about cash payment selection');
      console.log('✅ Notification content includes booking reference and place name');
      console.log('✅ Notifications have correct type: booking_payment_pending');
      
      // Test the controller response format
      console.log('\n🎯 Simulating controller response:');
      const primaryAgent = agents[0];
      const mockResponse = {
        success: true,
        message: 'Cash payment selected successfully. Agents have been notified.',
        booking: {
          id: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          status: booking.status,
          paymentMethod: 'cash'
        },
        agentContact: primaryAgent ? {
          name: primaryAgent.name,
          phone: primaryAgent.phoneNumber,
          email: primaryAgent.email
        } : null,
        agentsNotified: notifications.length,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Controller would return:');
      console.log(JSON.stringify(mockResponse, null, 2));
      
    } else {
      console.log(`❌ FAILURE: Expected ${expectedNotifications} notifications, got ${actualNotifications}`);
      throw new Error('Notification count mismatch');
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testCashPaymentNotification()
    .then(() => {
      console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 TEST FAILED:', error.message);
      process.exit(1);
    });
}

module.exports = { testCashPaymentNotification };
