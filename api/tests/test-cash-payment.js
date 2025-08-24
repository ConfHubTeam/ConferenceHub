const BookingNotificationService = require('../services/bookingNotificationService');
const { Booking, Place, User } = require('../models');

async function testCashPayment() {
  try {
    console.log('Testing BookingNotificationService...');

    // Find a test booking
    const booking = await Booking.findByPk(145, {
      include: [
        {
          model: Place,
          attributes: ['id', 'title', 'userId']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) {
      console.log('Booking 145 not found');
      return;
    }

    console.log('Found booking 145:', booking.id);
    console.log('Testing cash payment notification...');
    
    const notifications = await BookingNotificationService.createCashPaymentSelectedNotification(booking);
    console.log('✅ Notifications created:', notifications ? notifications.length : 'none');

  } catch (err) {
    console.error('❌ Error creating notification:', err.message);
    console.error('Stack:', err.stack);
  }
}

testCashPayment();
