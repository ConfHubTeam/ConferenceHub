const express = require("express");
const router = express.Router();
const placeController = require("../controllers/placeController");

// Submit new place form
router.post("/", placeController.createPlace);

// Get all places (agent only)
router.get("/", placeController.getAllPlaces);

// Get places for current user
router.get("/user-places", placeController.getUserPlaces);

// Get filtered places for homepage
router.get("/home", placeController.getHomePlaces);

// Get specific place by ID
router.get("/:id", placeController.getPlaceById);

// Get specific booking for a place
router.get("/:placeId/:bookingId", placeController.getBookingForPlace);

// Update place
router.put("/", placeController.updatePlace);

// Delete a place
router.delete("/:id", placeController.deletePlace);

module.exports = router;
