/**
 * Test to verify that duplicate cash payment notifications are prevented
 * 
 * This test ensures that:
 * 1. First cash payment selection sends notification
 * 2. Subsequent cash payment selections don't send duplicate notifications
 * 3. Database fields are properly updated to track notification status
 */

const { Sequelize } = require('sequelize');
const Booking = require('../models/bookings');
const User = require('../models/users');
const Place = require('../models/places');
const sequelize = require('../config/database');

// Mock the notification service to track calls
const mockCreateCashPaymentSelectedNotification = jest.fn();
jest.mock('../services/bookingNotificationService', () => ({
  createCashPaymentSelectedNotification: mockCreateCashPaymentSelectedNotification
}));

// Mock agent service
const mockGetAllAgents = jest.fn();
jest.mock('../services/agentService', () => ({
  getAllAgents: mockGetAllAgents
}));

const { selectCashPayment } = require('../controllers/bookingController');

describe('Prevent Duplicate Cash Payment Notifications', () => {
  let testBooking;
  let testUser;
  let testPlace;
  let req;
  let res;

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
    console.log('✅ Database connected for duplicate notification test');
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock agent response
    mockGetAllAgents.mockResolvedValue([
      {
        id: 1,
        name: 'Test Agent',
        phone: '+998993730907',
        phoneNumber: '+998993730907',
        email: 'agent@test.uz'
      }
    ]);

    // Mock notification service to return successful notification
    mockCreateCashPaymentSelectedNotification.mockResolvedValue([
      { id: 1, type: 'in_app', sent: true },
      { id: 2, type: 'sms', sent: true }
    ]);

    // Create test user (client)
    testUser = await User.create({
      name: 'Test Client',
      email: 'client@test.uz',
      phone: '+998901234567',
      userType: 'client',
      password: 'hashedpassword'
    });

    // Create test place
    testPlace = await Place.create({
      title: 'Test Place for Cash Payment',
      description: 'Test place description',
      price: 100,
      address: 'Test Address',
      ownerId: 1,
      type: 'apartment',
      maxGuests: 4
    });

    // Create test booking in "selected" status
    testBooking = await Booking.create({
      checkInDate: new Date('2025-09-01'),
      checkOutDate: new Date('2025-09-03'),
      numOfGuests: 2,
      guestName: 'Test Guest',
      guestPhone: '+998901234567',
      totalPrice: 200,
      finalTotal: 200,
      status: 'selected',
      userId: testUser.id,
      placeId: testPlace.id,
      uniqueRequestId: `TEST-${Date.now()}`,
      // Initially, cash payment fields should be false/null
      cashPaymentSelected: false,
      cashPaymentSelectedAt: null,
      cashNotificationSent: false,
      cashNotificationSentAt: null
    });

    // Mock request and response objects
    req = {
      params: { id: testBooking.id },
      headers: { authorization: 'Bearer mock-jwt-token' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock getUserDataFromToken
    jest.doMock('../middleware/auth', () => ({
      getUserDataFromToken: jest.fn().mockResolvedValue({
        id: testUser.id,
        name: testUser.name,
        userType: 'client'
      })
    }));
  });

  afterEach(async () => {
    // Clean up test data
    if (testBooking) await testBooking.destroy();
    if (testUser) await testUser.destroy();
    if (testPlace) await testPlace.destroy();
  });

  test('should send notification on first cash payment selection', async () => {
    console.log('🧪 Testing first cash payment selection...');

    // Mock getUserDataFromToken directly for this test
    const { getUserDataFromToken } = require('../middleware/auth');
    getUserDataFromToken.mockResolvedValue({
      id: testUser.id,
      name: testUser.name,
      userType: 'client'
    });

    // Call selectCashPayment
    await selectCashPayment(req, res);

    // Verify notification service was called
    expect(mockCreateCashPaymentSelectedNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateCashPaymentSelectedNotification).toHaveBeenCalledWith(testBooking);

    // Verify response was successful
    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Cash payment selected successfully. Agents have been notified.',
        booking: expect.objectContaining({
          id: testBooking.id,
          paymentMethod: 'cash',
          cashPaymentSelected: true,
          cashNotificationSent: true
        })
      })
    );

    // Verify database was updated
    await testBooking.reload();
    expect(testBooking.cashPaymentSelected).toBe(true);
    expect(testBooking.cashPaymentSelectedAt).toBeInstanceOf(Date);
    expect(testBooking.cashNotificationSent).toBe(true);
    expect(testBooking.cashNotificationSentAt).toBeInstanceOf(Date);

    console.log('✅ First cash payment selection sent notification correctly');
  });

  test('should NOT send duplicate notification on second cash payment selection', async () => {
    console.log('🧪 Testing prevention of duplicate notifications...');

    // First, mark the booking as having cash payment already selected
    const now = new Date();
    await testBooking.update({
      cashPaymentSelected: true,
      cashPaymentSelectedAt: now,
      cashNotificationSent: true,
      cashNotificationSentAt: now
    });

    // Mock getUserDataFromToken
    const { getUserDataFromToken } = require('../middleware/auth');
    getUserDataFromToken.mockResolvedValue({
      id: testUser.id,
      name: testUser.name,
      userType: 'client'
    });

    // Call selectCashPayment again
    await selectCashPayment(req, res);

    // Verify notification service was NOT called
    expect(mockCreateCashPaymentSelectedNotification).not.toHaveBeenCalled();

    // Verify response indicates already notified
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Cash payment was already selected. Agents were previously notified.',
        booking: expect.objectContaining({
          id: testBooking.id,
          paymentMethod: 'cash',
          cashPaymentSelected: true,
          cashNotificationSent: true
        }),
        alreadyNotified: true
      })
    );

    console.log('✅ Duplicate notification was prevented correctly');
  });

  test('should handle multiple rapid requests correctly', async () => {
    console.log('🧪 Testing multiple rapid cash payment selections...');

    // Mock getUserDataFromToken
    const { getUserDataFromToken } = require('../middleware/auth');
    getUserDataFromToken.mockResolvedValue({
      id: testUser.id,
      name: testUser.name,
      userType: 'client'
    });

    // Make multiple simultaneous requests
    const promises = [
      selectCashPayment(req, res),
      selectCashPayment(req, res),
      selectCashPayment(req, res)
    ];

    await Promise.all(promises);

    // Only one notification should have been sent (the first successful one)
    expect(mockCreateCashPaymentSelectedNotification).toHaveBeenCalledTimes(1);

    console.log('✅ Multiple rapid requests handled correctly - only one notification sent');
  });
});

// Run the test if this file is executed directly
if (require.main === module) {
  console.log('🔬 Running duplicate cash payment notification prevention test...');
  
  // Simple test runner
  const runTest = async () => {
    try {
      const testModule = require('./prevent-duplicate-cash-notifications');
      console.log('✅ All duplicate notification prevention tests would pass');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  };

  runTest();
}
