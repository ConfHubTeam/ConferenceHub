const { Booking, Place, User } = require("../models");
const { getUserDataFromToken } = require("../middleware/auth");
const { Op } = require("sequelize");

/**
 * Create a new booking
 */
const createBooking = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const {
      place, 
      checkInDate, 
      checkOutDate, 
      selectedTimeSlots, // New field for time slot bookings
      numOfGuests, 
      guestName, 
      guestPhone, 
      totalPrice
    } = req.body;

    // Only clients can create bookings
    if (userData.userType !== 'client') {
      return res.status(403).json({ error: "Only clients can create bookings. Hosts and agents cannot make bookings." });
    }

    // Generate unique request ID
    const uniqueRequestId = `REQ-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    
    // Determine check-in/check-out dates
    // If time slots are provided, use first and last date from slots
    let finalCheckInDate = checkInDate;
    let finalCheckOutDate = checkOutDate;
    
    if (selectedTimeSlots && selectedTimeSlots.length > 0) {
      // Sort time slots by date
      const sortedDates = [...selectedTimeSlots].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      finalCheckInDate = sortedDates[0].date;
      finalCheckOutDate = sortedDates[sortedDates.length - 1].date;
    }

    // Create booking with Sequelize
    const booking = await Booking.create({
      userId: userData.id,
      placeId: place, 
      checkInDate: finalCheckInDate,
      checkOutDate: finalCheckOutDate, 
      numOfGuests, 
      guestName, 
      guestPhone, 
      totalPrice,
      status: 'pending',
      timeSlots: selectedTimeSlots || [], // Store the selected time slots
      uniqueRequestId // Add the unique request ID
    });
    
    res.json(booking);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get bookings based on user role and filters
 */
const getBookings = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { userId } = req.query;
    
    // For agents with userId parameter - get bookings for a specific user
    if (userData.userType === 'agent' && userId) {
      const userBookings = await Booking.findAll({
        where: { 
          userId: userId
        },
        include: [
          {
            model: Place,
            as: 'place',
            include: [{
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }],
            attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'ownerId']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      return res.json(userBookings);
    }
    
    // Agents can see all bookings across the system
    if (userData.userType === 'agent') {
      const allBookings = await Booking.findAll({
        include: [
          {
            model: Place,
            as: 'place',
            include: [{
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }],
            attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'ownerId']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      return res.json(allBookings);
    }
    
    if (userData.userType === 'host') {
      // For hosts: Find bookings for conference rooms they own
      const hostBookings = await Booking.findAll({
        include: [
          {
            model: Place,
            as: 'place',
            where: { ownerId: userData.id },
            attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      res.json(hostBookings);
    } else {
      // For clients: Find bookings made by this user
      // Exclude rejected/cancelled bookings
      const clientBookings = await Booking.findAll({
        where: { 
          userId: userData.id,
          status: ['pending', 'approved'] // Only return pending and approved bookings
        },
        include: {
          model: Place,
          as: 'place',
          attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut']
        },
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      res.json(clientBookings);
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Update booking status (approve/reject)
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userData = await getUserDataFromToken(req);
    
    // Verify status is valid
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    // Get the booking
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Place,
          as: 'place'
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Check authorization
    const isAuthorized = (
      (userData.userType === 'host' && booking.place.ownerId === userData.id) ||
      (userData.userType === 'agent') ||
      (userData.userType === 'client' && booking.userId === userData.id && status === 'rejected')
    );
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to update this booking" });
    }
    
    // Handle conflicts if approving a booking
    if (status === 'approved') {
      // Find pending bookings for the same place
      const pendingBookings = await Booking.findAll({
        where: {
          placeId: booking.placeId,
          status: 'pending',
          id: { [Op.ne]: booking.id }
        }
      });
      
      // Check for conflicts and reject conflicting bookings
      const conflictingBookings = [];
      
      for (const pendingBooking of pendingBookings) {
        if (!pendingBooking.timeSlots || !booking.timeSlots) continue;
        
        const hasConflict = pendingBooking.timeSlots.some(pendingSlot => 
          booking.timeSlots.some(approvedSlot => {
            if (pendingSlot.date !== approvedSlot.date) return false;
            
            const [pendingStart] = pendingSlot.startTime.split(':').map(Number);
            const [pendingEnd] = pendingSlot.endTime.split(':').map(Number);
            const [approvedStart] = approvedSlot.startTime.split(':').map(Number);
            const [approvedEnd] = approvedSlot.endTime.split(':').map(Number);
            
            return (pendingStart < approvedEnd && pendingEnd > approvedStart);
          })
        );
        
        if (hasConflict) {
          conflictingBookings.push(pendingBooking);
        }
      }
      
      // Reject all conflicting bookings
      if (conflictingBookings.length > 0) {
        for (const conflictBooking of conflictingBookings) {
          conflictBooking.status = 'rejected';
          await conflictBooking.save();
        }
      }
    }
    
    // Update booking status
    booking.status = status;
    await booking.save();
    
    return res.json({ 
      success: true, 
      booking,
      message: status === 'approved' ? 
        'Booking approved. Any conflicting bookings have been automatically rejected.' : 
        `Booking ${status} successfully.`
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get pending booking counts for hosts
 */
const getBookingCounts = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    if (userData.userType !== 'host') {
      return res.status(403).json({ error: "Only hosts can access booking counts" });
    }
    
    const pendingCount = await Booking.count({
      include: [
        {
          model: Place,
          as: 'place',
          where: { ownerId: userData.id },
          attributes: []
        }
      ],
      where: {
        status: 'pending'
      }
    });
    
    res.json({ pendingCount });
  } catch (error) {
    console.error("Error fetching booking counts:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Check availability of time slots for a place
 * This endpoint allows unauthenticated users to check availability
 */
const checkAvailability = async (req, res) => {
  try {
    const { placeId, date } = req.query;
    
    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    // Get the place
    const place = await Place.findByPk(placeId);
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }
    
    // Get bookings with approved status for this place
    const query = { 
      placeId, 
      status: 'approved' 
    };
    
    // Get all approved bookings
    const approvedBookings = await Booking.findAll({ where: query });
    
    // Extract booked time slots
    const bookedTimeSlots = [];
    
    approvedBookings.forEach(booking => {
      if (booking.timeSlots && booking.timeSlots.length > 0) {
        booking.timeSlots.forEach(slot => {
          // If no date specified or date matches
          if (!date || slot.date === date) {
            bookedTimeSlots.push(slot);
          }
        });
      }
    });
    
    // Build response
    const response = {
      placeId,
      placeName: place.title,
      bookedTimeSlots,
      operatingHours: {
        checkIn: place.checkIn || "09:00",
        checkOut: place.checkOut || "17:00",
        weekdayTimeSlots: place.weekdayTimeSlots || {},
        minimumHours: place.minimumHours || 1,
        cooldown: place.cooldown || 30
      },
      blockedDates: place.blockedDates || [],
      blockedWeekdays: place.blockedWeekdays || []
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(422).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
  getBookingCounts,
  checkAvailability,
  checkAvailability
};
