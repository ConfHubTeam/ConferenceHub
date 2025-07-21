const { Op } = require("sequelize");
const { Review, ReviewReply, ReviewHelpful, ReviewReport, User, Place, Booking } = require("../models");
const PlaceRatingService = require("../services/placeRatingService");
const ReviewNotificationService = require("../services/reviewNotificationService");
const ReviewEligibilityService = require("../services/reviewEligibilityService");
const {
  validateReviewCreation,
  validateReviewReply,
  validateReviewReport,
  validateReviewStatus,
  validateUserAuthorization,
  isUserAdmin,
  isPlaceOwner
} = require("../services/reviewValidationService");

/**
 * Review Controller
 * Implements SOLID principles with single responsibility for each method
 * Follows DRY principles with reusable validation and error handling
 * US-R003 compliant authorization and validation
 */

/**
 * Create new review
 * POST /api/reviews
 * Requires authentication and completed booking with one review per booking
 */
const createReview = async (req, res) => {
  try {
    const { placeId, bookingId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate review data using validation service
    const validation = validateReviewCreation({ placeId, rating, comment });
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        error: validation.errors.join(", ")
      });
    }

    // Validate that bookingId is provided
    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        error: "Booking ID is required for review submission"
      });
    }

    // Check if place exists
    const place = await Place.findByPk(placeId);
    if (!place) {
      return res.status(404).json({
        ok: false,
        error: "Place not found"
      });
    }

    // Verify the booking exists and belongs to the user
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        userId,
        placeId,
        status: "approved",
        checkOutDate: {
          [Op.lt]: new Date() // Must be past checkout date
        }
      }
    });

    if (!booking) {
      return res.status(403).json({
        ok: false,
        error: "Invalid booking or booking not eligible for review"
      });
    }

    // Check if this booking already has a review
    const existingReview = await Review.findOne({
      where: { bookingId }
    });

    if (existingReview) {
      return res.status(409).json({
        ok: false,
        error: "You have already reviewed this booking"
      });
    }

    // Create review with validated data and booking reference
    const review = await Review.create({
      userId,
      placeId,
      bookingId,
      rating,
      comment: comment ? comment.trim() : null,
      status: "approved" // Auto-approve all reviews
    });

    // Fetch created review with user data
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "telegramPhotoUrl"]
        }
      ]
    });

    // Update place rating after review creation
    try {
      await PlaceRatingService.calculateAndUpdateRating(placeId);
    } catch (error) {
      console.error("Error updating place rating:", error);
    }

    // Create notification for place owner
    try {
      await ReviewNotificationService.createReviewNotification(createdReview);
    } catch (error) {
      console.error("Error creating review notification:", error);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json({
      ok: true,
      review: createdReview
    });

  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to create review"
    });
  }
};

/**
 * Get reviews for a place with pagination
 * GET /api/reviews/place/:placeId
 * Public endpoint with pagination (8 reviews per page)
 */
const getReviewsForPlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // 8 reviews per page as specified
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || "newest";

    // Validate place exists
    const place = await Place.findByPk(placeId);
    if (!place) {
      return res.status(404).json({
        ok: false,
        error: "Place not found"
      });
    }

    // Determine sort order
    let orderBy = [["created_at", "DESC"]];
    switch (sortBy) {
      case "oldest":
        orderBy = [["created_at", "ASC"]];
        break;
      case "highest":
        orderBy = [["rating", "DESC"], ["created_at", "DESC"]];
        break;
      case "lowest":
        orderBy = [["rating", "ASC"], ["created_at", "DESC"]];
        break;
      case "newest":
      default:
        orderBy = [["created_at", "DESC"]];
        break;
    }

    // Get reviews with pagination
    // TODO: FOR TESTING PURPOSE - Include all statuses, not just "approved"
    // In production, change this to only include "approved" status
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: {
        placeId,
        status: {
          [Op.in]: ["pending", "selected", "approved", "rejected"]
        },
        isVisible: true
      },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "telegramPhotoUrl"]
        },
        {
          model: ReviewReply,
          as: "Reply",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "name", "telegramPhotoUrl"]
            }
          ]
        }
      ],
      order: orderBy,
      limit,
      offset
    });

    // Calculate statistics
    // TODO: FOR TESTING PURPOSE - Include all statuses for stats calculation
    const allReviews = await Review.findAll({
      where: {
        placeId,
        status: {
          [Op.in]: ["pending", "selected", "approved", "rejected"]
        },
        isVisible: true
      },
      attributes: ["rating"]
    });

    const totalReviews = allReviews.length;
    let averageRating = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const ratingSum = allReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = ratingSum / totalReviews;

      // Calculate rating breakdown
      allReviews.forEach(review => {
        ratingBreakdown[review.rating]++;
      });
    }

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      ok: true,
      reviews,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingBreakdown,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        reviewsPerPage: limit
      }
    });

  } catch (error) {
    console.error("Error getting reviews for place:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get reviews"
    });
  }
};

/**
 * Get user's reviews
 * GET /api/reviews/user/:userId
 * Authenticated users only (can only see own reviews unless admin)
 */
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;

    // Authorization: Users can only see their own reviews unless they're admin (US-R003)
    if (userId != requesterId && !isUserAdmin(req.user)) {
      return res.status(403).json({
        ok: false,
        error: "You can only view your own reviews"
      });
    }

    const reviews = await Review.findAll({
      where: { userId },
      include: [
        {
          model: Place,
          as: "Place",
          attributes: ["id", "title", "photos"]
        },
        {
          model: ReviewReply,
          as: "Reply",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "name", "telegramPhotoUrl"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json({
      ok: true,
      reviews
    });

  } catch (error) {
    console.error("Error getting user reviews:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get user reviews"
    });
  }
};

/**
 * Update review
 * PUT /api/reviews/:reviewId
 * Admin only
 */
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, isVisible, adminNotes, rating, comment } = req.body;

    // Validate status using validation service (US-R003 compliant)
    if (status) {
      const validation = validateReviewStatus(status);
      if (!validation.isValid) {
        return res.status(400).json({
          ok: false,
          error: validation.errors.join(", ")
        });
      }
    }

    // Validate rating if provided
    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          ok: false,
          error: "Rating must be an integer between 1 and 5"
        });
      }
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "Review not found"
      });
    }

    // Update review with all possible fields
    await review.update({
      ...(status && { status }),
      ...(typeof isVisible === "boolean" && { isVisible }),
      ...(adminNotes !== undefined && { adminNotes }),
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment: comment.trim() }),
      updatedAt: new Date()
    });

    const updatedReview = await Review.findByPk(reviewId, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "telegramPhotoUrl"]
        }
      ]
    });

    // Update place rating if rating or status/visibility changed (US-R010 requirement)
    if (rating !== undefined || status || typeof isVisible === "boolean") {
      try {
        await PlaceRatingService.calculateAndUpdateRating(review.placeId);
      } catch (error) {
        console.error("Error updating place rating:", error);
        // Don't fail the request if rating update fails - it can be recalculated later
      }
    }

    res.json({
      ok: true,
      review: updatedReview
    });

  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to update review"
    });
  }
};

/**
 * Delete review
 * DELETE /api/reviews/:reviewId
 * Admin only
 */
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "Review not found"
      });
    }

    const placeId = review.placeId; // Store placeId before deletion
    await review.destroy();

    // Update place rating after review deletion (US-R010 requirement)
    try {
      await PlaceRatingService.calculateAndUpdateRating(placeId);
    } catch (error) {
      console.error("Error updating place rating:", error);
      // Don't fail the request if rating update fails - it can be recalculated later
    }

    res.json({
      ok: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to delete review"
    });
  }
};

/**
 * Mark review as helpful
 * POST /api/reviews/:reviewId/helpful
 * Authenticated users only
 */
const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if review exists
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "Review not found"
      });
    }

    // Check if user already marked this review as helpful
    const existingHelpful = await ReviewHelpful.findOne({
      where: { reviewId, userId }
    });

    if (existingHelpful) {
      // Remove helpful vote (toggle)
      await existingHelpful.destroy();
      await review.decrement("helpfulCount");
      
      res.json({
        ok: true,
        message: "Helpful vote removed",
        isHelpful: false
      });
    } else {
      // Add helpful vote
      await ReviewHelpful.create({ reviewId, userId });
      await review.increment("helpfulCount");
      
      res.json({
        ok: true,
        message: "Review marked as helpful",
        isHelpful: true
      });
    }

  } catch (error) {
    console.error("Error marking review as helpful:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to update helpful status"
    });
  }
};

/**
 * Report inappropriate review
 * POST /api/reviews/:reviewId/report
 * Authenticated users only
 */
const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;

    // Validate report data using validation service (US-R003 compliant)
    const validation = validateReviewReport({ reason, description });
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        error: validation.errors.join(", ")
      });
    }

    // Check if review exists
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "Review not found"
      });
    }

    // Check if user already reported this review
    const existingReport = await ReviewReport.findOne({
      where: { reviewId, reporterId }
    });

    if (existingReport) {
      return res.status(409).json({
        ok: false,
        error: "You have already reported this review"
      });
    }

    // Create report
    const report = await ReviewReport.create({
      reviewId,
      reporterId,
      reason,
      description: description || null
    });

    // Increment report count on review
    await review.increment("reportCount");

    res.status(201).json({
      ok: true,
      message: "Review reported successfully",
      reportId: report.id
    });

  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to report review"
    });
  }
};

/**
 * Host reply to review
 * POST /api/reviews/:reviewId/reply
 * Authenticated users only (must be host of the place)
 */
const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replyText } = req.body;
    const userId = req.user.id;

    // Validate reply data using validation service (US-R003 compliant)
    const validation = validateReviewReply({ replyText });
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        error: validation.errors.join(", ")
      });
    }

    // Check if review exists and get place info
    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: Place,
          as: "Place",
          attributes: ["id", "ownerId"]
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "Review not found"
      });
    }

    // Authorization: Check if user is the host of the place (US-R003 requirement)
    if (review.Place.ownerId !== userId) {
      return res.status(403).json({
        ok: false,
        error: "Only the host can reply to reviews on their properties"
      });
    }

    // Business rule: Check if reply already exists (one reply per review)
    const existingReply = await ReviewReply.findOne({
      where: { reviewId }
    });

    if (existingReply) {
      return res.status(409).json({
        ok: false,
        error: "A reply already exists for this review. Only one reply per review is allowed."
      });
    }

    // Create reply
    const reply = await ReviewReply.create({
      reviewId,
      userId,
      replyText: replyText.trim()
    });

    // Fetch created reply with user data
    const createdReply = await ReviewReply.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "telegramPhotoUrl"]
        }
      ]
    });

    // Create notification for original reviewer (US-R011 requirement)
    try {
      await ReviewNotificationService.createReplyNotification(createdReply);
    } catch (error) {
      console.error("Error creating reply notification:", error);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json({
      ok: true,
      reply: createdReply
    });

  } catch (error) {
    console.error("Error creating reply:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to create reply"
    });
  }
};

/**
 * Get review replies for a specific review
 * GET /api/reviews/:reviewId/replies
 * Public endpoint
 */
const getReviewReplies = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const replies = await ReviewReply.findAll({
      where: { reviewId },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "telegramPhotoUrl"]
        }
      ],
      order: [["createdAt", "ASC"]]
    });

    res.json({
      ok: true,
      replies
    });

  } catch (error) {
    console.error("Error getting review replies:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get replies"
    });
  }
};

/**
 * Get helpful status for a review
 * GET /api/reviews/:reviewId/helpful/status
 * Authenticated users only
 */
const getHelpfulStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const helpful = await ReviewHelpful.findOne({
      where: { reviewId, userId }
    });

    res.json({
      ok: true,
      isHelpful: !!helpful
    });

  } catch (error) {
    console.error("Error getting helpful status:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get helpful status"
    });
  }
};

/**
 * Get all reviews for admin management with filters and pagination
 * GET /api/reviews/admin
 * Admin only endpoint with comprehensive filtering and search capabilities
 * US-R006 compliant admin review management
 */
const getAllReviewsForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      rating,
      reported,
      startDate,
      endDate,
      search
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 reviews per page
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions following DRY principle
    const whereConditions = {};
    const includeConditions = [];

    // Only show approved reviews (all reviews are auto-approved)
    whereConditions.status = "approved";

    // Rating filter
    if (rating && rating !== "all") {
      whereConditions.rating = parseInt(rating);
    }

    // Date range filter
    if (startDate && endDate) {
      whereConditions.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate + " 23:59:59")]
      };
    } else if (startDate) {
      whereConditions.created_at = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.created_at = {
        [Op.lte]: new Date(endDate + " 23:59:59")
      };
    }

    // Search filter - we'll handle this in a separate query approach
    const searchConditions = [];
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      searchConditions.push(
        { comment: { [Op.iLike]: searchTerm } }
      );
    }

    // Configure include for ReviewReports based on reported filter
    let reportsInclude = {
      model: ReviewReport,
      as: "Reports",
      required: false, // Default to LEFT JOIN
      include: [
        {
          model: User,
          as: "Reporter",
          attributes: ["id", "name", "telegramPhotoUrl"]
        }
      ]
    };

    // Handle reported filter
    if (reported === "reported") {
      // Only reviews WITH reports
      reportsInclude.required = true; // INNER JOIN to only get reviews with reports
    } else if (reported === "no_reports") {
      // Only reviews WITHOUT reports - we'll filter this after the query
      // Keep as LEFT JOIN and filter in JavaScript
    }

    // If search is provided, we need to use a more complex query approach
    let queryOptions;
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      
      // Combine base conditions with search conditions using OR
      const combinedWhere = {
        ...whereConditions,
        [Op.or]: [
          { comment: { [Op.iLike]: searchTerm } },
          { "$Place.title$": { [Op.iLike]: searchTerm } },
          { "$User.name$": { [Op.iLike]: searchTerm } }
        ]
      };
      
      queryOptions = {
        where: combinedWhere,
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "telegramPhotoUrl"]
          },
          {
            model: Place,
            as: "Place",
            attributes: ["id", "title", "photos"]
          },
          reportsInclude
        ],
        order: [["created_at", "DESC"]],
        limit: limitNum,
        offset: offset,
        distinct: true,
        subQuery: false // Important for search across includes
      };
    } else {
      // No search - use simpler query
      queryOptions = {
        where: whereConditions,
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "telegramPhotoUrl"]
          },
          {
            model: Place,
            as: "Place",
            attributes: ["id", "title", "photos"]
          },
          reportsInclude
        ],
        order: [["created_at", "DESC"]],
        limit: limitNum,
        offset: offset,
        distinct: true
      };
    }

    // Fetch reviews with all related data
    const { rows: reviews, count: totalReviews } = await Review.findAndCountAll(queryOptions);

    // Filter out reviews without reports if needed (for no_reports filter)
    let filteredReviews = reviews;
    if (reported === "no_reports") {
      filteredReviews = reviews.filter(review => !review.Reports || review.Reports.length === 0);
    }

    // Calculate pagination metadata (adjust for no_reports filter)
    const finalCount = reported === "no_reports" ? filteredReviews.length : totalReviews;
    const totalPages = Math.ceil(finalCount / limitNum);
    
    // Format response data following existing API patterns
    const formattedReviews = filteredReviews.map(review => {
      const reviewData = review.toJSON();
      
      // Add report summary for admin convenience
      const reportSummary = {
        hasReports: reviewData.Reports && reviewData.Reports.length > 0,
        reportCount: reviewData.Reports ? reviewData.Reports.length : 0,
        pendingReports: reviewData.Reports ? reviewData.Reports.filter(r => r.status === "pending").length : 0,
        reportReasons: reviewData.Reports ? [...new Set(reviewData.Reports.map(r => r.reason))] : []
      };

      return {
        ...reviewData,
        reportSummary
      };
    });

    // Return paginated response following existing API patterns
    res.status(200).json({
      ok: true,
      reviews: formattedReviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalReviews: finalCount,
        reviewsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error("Error fetching reviews for admin:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch reviews"
    });
  }
};

/**
 * Update host reply to review
 * PUT /api/reviews/:reviewId/reply
 * Authenticated hosts only (must be the reply author and within 24 hours)
 * US-R007 compliant host reply editing
 */
const updateReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replyText } = req.body;
    const userId = req.user.id;

    // Validate reply data using validation service
    const validation = validateReviewReply({ replyText });
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        error: validation.errors.join(", ")
      });
    }

    // Find the existing reply
    const existingReply = await ReviewReply.findOne({
      where: { reviewId },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "telegramPhotoUrl"]
        }
      ]
    });

    if (!existingReply) {
      return res.status(404).json({
        ok: false,
        error: "Reply not found"
      });
    }

    // Authorization: Check if user is the reply author
    if (existingReply.userId !== userId) {
      return res.status(403).json({
        ok: false,
        error: "You can only edit your own replies"
      });
    }

    // Business rule: Check if reply is within 24 hours for editing (US-R007)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (new Date(existingReply.created_at) < twentyFourHoursAgo) {
      return res.status(403).json({
        ok: false,
        error: "Replies can only be edited within 24 hours of posting"
      });
    }

    // Update reply
    await existingReply.update({
      replyText: replyText.trim(),
      updatedAt: new Date()
    });

    // Fetch updated reply with user data
    const updatedReply = await ReviewReply.findByPk(existingReply.id, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "telegramPhotoUrl"]
        }
      ]
    });

    res.json({
      ok: true,
      reply: updatedReply
    });

  } catch (error) {
    console.error("Error updating reply:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to update reply"
    });
  }
};

/**
 * Check review eligibility for a place
 * GET /api/reviews/eligibility/place/:placeId
 * Returns eligibility status instead of throwing errors
 */
const checkReviewEligibility = async (req, res) => {
  try {
    const { placeId } = req.params;
    const userId = req.user.id;

    // Check if place exists
    const place = await Place.findByPk(placeId);
    if (!place) {
      return res.status(404).json({
        ok: false,
        error: "Place not found"
      });
    }

    // Check eligibility using the service
    const eligibility = await ReviewEligibilityService.checkReviewEligibility(
      userId, 
      parseInt(placeId), 
      place.userId
    );

    res.json({
      ok: true,
      eligibility
    });

  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to check review eligibility"
    });
  }
};

/**
 * Get eligible bookings for review
 * GET /api/reviews/eligibility/bookings
 * Returns list of completed bookings that can be reviewed
 */
const getEligibleBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const eligibleBookings = await ReviewEligibilityService.getEligibleBookingsForReview(userId);

    res.json({
      ok: true,
      bookings: eligibleBookings
    });

  } catch (error) {
    console.error("Error getting eligible bookings:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get eligible bookings"
    });
  }
};

module.exports = {
  createReview,
  getReviewsForPlace,
  getUserReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  replyToReview,
  getReviewReplies,
  getHelpfulStatus,
  getAllReviewsForAdmin,
  updateReply,
  checkReviewEligibility,
  getEligibleBookings
};
