const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

// Create new booking (requires authentication)
router.post("/", authenticateToken, bookingController.createBooking);

// Get bookings (different behavior based on user role)
router.get("/", authenticateToken, bookingController.getBookings);

// Update booking status
router.put("/:id", authenticateToken, bookingController.updateBookingStatus);

// Get booking counts for hosts
router.get("/counts", authenticateToken, bookingController.getBookingCounts);

// Get competing bookings for the same time slots (for hosts to see competition)
router.get("/competing", authenticateToken, bookingController.getCompetingBookings);

// Check availability of time slots (no auth required)
router.get("/availability", bookingController.checkAvailability);

module.exports = router;
