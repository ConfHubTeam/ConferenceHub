const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

/**
 * Review Routes
 * Following RESTful conventions and existing JWT authentication patterns
 * Implements SOLID principles with single responsibility per endpoint
 */

// Create new review (authenticated clients only, must have completed booking)
router.post("/", isAuthenticated, reviewController.createReview);

// Get reviews for a place with pagination (8 reviews per page)
router.get("/place/:placeId", reviewController.getReviewsForPlace);

// Get all reviews for admin management (admin only)
router.get("/admin", isAuthenticated, isAdmin, reviewController.getAllReviewsForAdmin);

// Get user's reviews (authenticated user only)
router.get("/user/:userId", isAuthenticated, reviewController.getUserReviews);

// Update review (admin only)
router.put("/:reviewId", isAuthenticated, isAdmin, reviewController.updateReview);

// Delete review (admin only)
router.delete("/:reviewId", isAuthenticated, isAdmin, reviewController.deleteReview);

// Mark review as helpful (authenticated users only)
router.post("/:reviewId/helpful", isAuthenticated, reviewController.markReviewHelpful);

// Report inappropriate review (authenticated users only)
router.post("/:reviewId/report", isAuthenticated, reviewController.reportReview);

// Host reply to review (authenticated users only)
router.post("/:reviewId/reply", isAuthenticated, reviewController.replyToReview);

// Update host reply to review (authenticated users only, within 24 hours)
router.put("/:reviewId/reply", isAuthenticated, reviewController.updateReply);

// Get review replies for a specific review
router.get("/:reviewId/replies", reviewController.getReviewReplies);

// Get helpful status for a review (for authenticated users)
router.get("/:reviewId/helpful/status", isAuthenticated, reviewController.getHelpfulStatus);

module.exports = router;
