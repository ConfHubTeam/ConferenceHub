const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

// Create new booking (requires authentication)
router.post("/", authenticateToken, bookingController.createBooking);

// Get bookings (different behavior based on user role)
router.get("/", authenticateToken, bookingController.getBookings);

// Get booking counts for hosts
router.get("/counts", authenticateToken, bookingController.getBookingCounts);

// Get competing bookings for the same time slots (for hosts to see competition)
router.get("/competing", authenticateToken, bookingController.getCompetingBookings);

// Check availability of time slots (no auth required)
router.get("/availability", bookingController.checkAvailability);

// Check timezone-aware availability for Uzbekistan (no auth required)
router.get("/availability/uzbekistan", bookingController.checkTimezoneAwareAvailability);

// Get single booking details  
router.get("/:id", authenticateToken, bookingController.getBookingById);

// Update booking status
router.put("/:id", authenticateToken, bookingController.updateBookingStatus);

// Mark booking as paid to host (agent-only)
router.post("/:id/paid-to-host", authenticateToken, bookingController.markPaidToHost);

module.exports = router;
