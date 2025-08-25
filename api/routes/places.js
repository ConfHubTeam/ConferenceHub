const express = require("express");
const router = express.Router();
const placeController = require("../controllers/placeController");
const { isAuthenticated } = require("../middleware/auth");

// Submit new place form
router.post("/", isAuthenticated, placeController.createPlace);

// Get all places (agent only)
router.get("/", isAuthenticated, placeController.getAllPlaces);

// Get places for current user
router.get("/user-places", isAuthenticated, placeController.getUserPlaces);

// Get filtered places for homepage
router.get("/home", placeController.getHomePlaces);

// US-LOCK-002 Optimized endpoints
router.post("/check-availability", placeController.checkPlaceAvailability);
router.get("/lock-monitoring", placeController.getLockMonitoringReport);
router.post("/clear-cache", placeController.clearOptimizationCache);

// Get specific place by ID
router.get("/:id", placeController.getPlaceById);

// Get specific booking for a place
router.get("/:placeId/:bookingId", isAuthenticated, placeController.getBookingForPlace);

// Update place
router.put("/", isAuthenticated, placeController.updatePlace);

// Delete a place
router.delete("/:id", isAuthenticated, placeController.deletePlace);

module.exports = router;
