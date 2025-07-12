/**
 * Review Eligibility Service
 * Implements SOLID principles with single responsibility for determining review eligibility
 * Follows DRY principles with reusable eligibility checking logic
 * Provides review status instead of throwing errors for better UX
 */

const { Op } = require("sequelize");
const { Booking, Review } = require("../models");

/**
 * Review eligibility statuses
 */
const REVIEW_ELIGIBILITY_STATUS = {
  ELIGIBLE: "eligible",
  NO_BOOKING: "no_booking",
  BOOKING_NOT_APPROVED: "booking_not_approved", 
  BOOKING_NOT_COMPLETED: "booking_not_completed",
  ALREADY_REVIEWED: "already_reviewed",
  OWN_PLACE: "own_place"
};

/**
 * Check if user can review a specific place
 * Returns eligibility status instead of throwing errors
 * @param {number} userId - User ID
 * @param {number} placeId - Place ID
 * @param {number} placeOwnerId - Place owner ID
 * @returns {Object} Eligibility result with status and details
 */
const checkReviewEligibility = async (userId, placeId, placeOwnerId) => {
  try {
    // Check if user is trying to review their own place
    if (placeOwnerId === userId) {
      return {
        status: REVIEW_ELIGIBILITY_STATUS.OWN_PLACE,
        eligible: false,
        message: "You cannot review your own place",
        booking: null
      };
    }

    // Find all completed approved bookings for this user and place
    const completedBookings = await Booking.findAll({
      where: {
        userId,
        placeId,
        status: "approved",
        checkOutDate: {
          [Op.lt]: new Date() // Booking must be past checkout date
        }
      },
      order: [["checkOutDate", "DESC"]] // Most recent first
    });

    if (completedBookings.length === 0) {
      // Check if user has any booking for this place
      const anyBooking = await Booking.findOne({
        where: { userId, placeId }
      });

      if (!anyBooking) {
        return {
          status: REVIEW_ELIGIBILITY_STATUS.NO_BOOKING,
          eligible: false,
          message: "You need to book and complete a stay to leave a review",
          booking: null
        };
      }

      // Check if booking is not approved
      if (anyBooking.status !== "approved") {
        return {
          status: REVIEW_ELIGIBILITY_STATUS.BOOKING_NOT_APPROVED,
          eligible: false,
          message: "You can only review places with approved bookings",
          booking: anyBooking
        };
      }

      // Booking is approved but not completed yet
      return {
        status: REVIEW_ELIGIBILITY_STATUS.BOOKING_NOT_COMPLETED,
        eligible: false,
        message: "You can review this place after your stay is completed",
        booking: anyBooking,
        completesAt: anyBooking.checkOutDate
      };
    }

    // Check each completed booking to see if it already has a review
    for (const booking of completedBookings) {
      const existingReview = await Review.findOne({
        where: { bookingId: booking.id }
      });

      if (!existingReview) {
        // Found a completed booking without a review - eligible!
        return {
          status: REVIEW_ELIGIBILITY_STATUS.ELIGIBLE,
          eligible: true,
          message: "You can leave a review for this stay",
          booking: booking
        };
      }
    }

    // All completed bookings already have reviews
    return {
      status: REVIEW_ELIGIBILITY_STATUS.ALREADY_REVIEWED,
      eligible: false,
      message: "You have already reviewed all your stays at this place",
      booking: completedBookings[0] // Most recent booking
    };

  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return {
      status: "error",
      eligible: false,
      message: "Unable to check review eligibility",
      booking: null,
      error: error.message
    };
  }
};

/**
 * Get all eligible bookings for review by user
 * @param {number} userId - User ID
 * @returns {Array} Array of bookings eligible for review
 */
const getEligibleBookingsForReview = async (userId) => {
  try {
    // Find all completed approved bookings
    const completedBookings = await Booking.findAll({
      where: {
        userId,
        status: "approved",
        checkOutDate: {
          [Op.lt]: new Date()
        }
      },
      include: [
        {
          model: require("../models/places"),
          as: "Place",
          attributes: ["id", "title", "address", "photos", "userId"]
        }
      ],
      order: [["checkOutDate", "DESC"]]
    });

    // Filter out bookings that already have reviews and own places
    const eligibleBookings = [];
    for (const booking of completedBookings) {
      // Skip own places
      if (booking.Place.userId === userId) {
        continue;
      }

      const existingReview = await Review.findOne({
        where: { bookingId: booking.id }
      });

      if (!existingReview) {
        eligibleBookings.push({
          ...booking.toJSON(),
          eligibleForReview: true
        });
      }
    }

    return eligibleBookings;
  } catch (error) {
    console.error("Error getting eligible bookings:", error);
    return [];
  }
};

module.exports = {
  checkReviewEligibility,
  getEligibleBookingsForReview,
  REVIEW_ELIGIBILITY_STATUS
};
