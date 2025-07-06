/**
 * Place Rating Service
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only place rating calculations
 * - Open/Closed: Extensible for new rating calculation methods
 * - Liskov Substitution: Can be extended with different rating strategies
 * - Interface Segregation: Focused interface for rating operations
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 * 
 * Implements DRY principle by centralizing rating calculation logic
 */

const { Review, Place } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

class PlaceRatingService {
  /**
   * Calculate and update place rating based on approved reviews
   * @param {number} placeId - Place ID to calculate rating for
   * @returns {Promise<Object>} Updated rating data
   */
  static async calculateAndUpdateRating(placeId) {
    if (!placeId) {
      throw new Error("Place ID is required");
    }

    const transaction = await sequelize.transaction();

    try {
      // Get all approved reviews for the place
      const reviews = await Review.findAll({
        where: {
          placeId: placeId,
          status: "approved",
          isVisible: true
        },
        attributes: ["rating"],
        transaction
      });

      const ratingData = this._calculateRatingMetrics(reviews);
      
      // Update place with new rating data
      await Place.update({
        averageRating: ratingData.averageRating,
        totalReviews: ratingData.totalReviews,
        ratingBreakdown: ratingData.ratingBreakdown,
        ratingUpdatedAt: new Date()
      }, {
        where: { id: placeId },
        transaction
      });

      await transaction.commit();
      return ratingData;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to calculate place rating: ${error.message}`);
    }
  }

  /**
   * Calculate rating metrics from reviews array
   * @param {Array} reviews - Array of review objects
   * @returns {Object} Calculated rating metrics
   * @private
   */
  static _calculateRatingMetrics(reviews) {
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        averageRating: null,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    // Calculate rating breakdown
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatingSum = 0;

    reviews.forEach(review => {
      const rating = review.rating;
      ratingBreakdown[rating]++;
      totalRatingSum += rating;
    });

    // Calculate average rating with 1 decimal place
    const averageRating = parseFloat((totalRatingSum / totalReviews).toFixed(1));

    return {
      averageRating,
      totalReviews,
      ratingBreakdown
    };
  }

  /**
   * Update ratings for multiple places (batch operation)
   * @param {Array<number>} placeIds - Array of place IDs
   * @returns {Promise<Array>} Array of updated rating data
   */
  static async batchUpdateRatings(placeIds) {
    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      throw new Error("Place IDs array is required");
    }

    const results = [];
    
    // Process in parallel for better performance
    const promises = placeIds.map(async (placeId) => {
      try {
        const ratingData = await this.calculateAndUpdateRating(placeId);
        return { placeId, success: true, data: ratingData };
      } catch (error) {
        return { placeId, success: false, error: error.message };
      }
    });

    const settledResults = await Promise.allSettled(promises);
    
    settledResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          placeId: placeIds[index],
          success: false,
          error: result.reason?.message || "Unknown error"
        });
      }
    });

    return results;
  }

  /**
   * Get cached rating data for a place
   * @param {number} placeId - Place ID
   * @returns {Promise<Object|null>} Cached rating data or null
   */
  static async getCachedRating(placeId) {
    if (!placeId) {
      throw new Error("Place ID is required");
    }

    const place = await Place.findOne({
      where: { id: placeId },
      attributes: [
        "averageRating",
        "totalReviews", 
        "ratingBreakdown",
        "ratingUpdatedAt"
      ]
    });

    if (!place) {
      return null;
    }

    return {
      averageRating: place.averageRating ? parseFloat(place.averageRating) : null,
      totalReviews: place.totalReviews || 0,
      ratingBreakdown: place.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingUpdatedAt: place.ratingUpdatedAt
    };
  }

  /**
   * Check if rating data needs refresh based on cache age
   * @param {Date} lastUpdated - Last rating update timestamp
   * @param {number} maxAgeMinutes - Maximum cache age in minutes (default: 60)
   * @returns {boolean} True if refresh is needed
   */
  static shouldRefreshRating(lastUpdated, maxAgeMinutes = 60) {
    if (!lastUpdated) {
      return true;
    }

    const now = new Date();
    const ageInMinutes = (now - lastUpdated) / (1000 * 60);
    return ageInMinutes > maxAgeMinutes;
  }
}

module.exports = PlaceRatingService;
