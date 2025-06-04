const { Booking, Place, User } = require("../models");
const { getUserDataFromToken } = require("../middleware/auth");

/**
 * Create a new booking
 */
const createBooking = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const {place, checkInDate, checkOutDate, 
      numOfGuests, guestName, guestPhone, totalPrice} = req.body;

    // Create booking with Sequelize
    const booking = await Booking.create({
      userId: userData.id, // Use userId instead of user
      placeId: place, // Use placeId instead of place
      checkInDate,
      checkOutDate, 
      numOfGuests, 
      guestName, 
      guestPhone, 
      totalPrice,
      status: 'pending' // Explicitly set status to pending
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
    
    // Check if logged in user is the host of the place
    if (userData.userType === 'host') {
      // Verify this host owns the place
      if (booking.place.ownerId !== userData.id) {
        return res.status(403).json({ error: "You can only manage bookings for your own places" });
      }
      
      booking.status = status;
      await booking.save();
      
      return res.json({ success: true, booking });
    } else if (userData.userType === 'agent') {
      // Agents can update booking status for any booking
      booking.status = status;
      await booking.save();
      
      return res.json({ success: true, booking });
    } else if (userData.userType === 'client' && booking.userId === userData.id) {
      // Client can cancel their own booking by setting status to 'rejected'
      if (status !== 'rejected') {
        return res.status(403).json({ error: "Clients can only cancel their bookings" });
      }
      
      booking.status = status;
      await booking.save();
      
      return res.json({ success: true, booking });
    } else {
      return res.status(403).json({ error: "Not authorized to update this booking" });
    }
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

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
  getBookingCounts
};
