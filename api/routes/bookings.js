const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Create new booking
router.post("/", bookingController.createBooking);

// Get bookings (different behavior based on user role)
router.get("/", bookingController.getBookings);

// Update booking status
router.put("/:id", bookingController.updateBookingStatus);

// Get booking counts for hosts
router.get("/counts", bookingController.getBookingCounts);

module.exports = router;
