/**
 * Utility functions for place-related operations
 */

/**
 * Checks if a place should be considered "new"
 * A place is new if:
 * 1. It has no reviews (averageRating is null/empty and totalReviews is 0)
 * 2. It was created within the last 30 days
 * 
 * @param {Object} place - Place object containing averageRating, totalReviews, and createdAt
 * @returns {boolean} True if place should show as "new"
 */
export const isPlaceNew = (place) => {
  if (!place) return false;
  
  // Check if place has reviews
  const hasReviews = place.averageRating !== null && place.averageRating !== undefined && place.totalReviews > 0;
  
  if (hasReviews) {
    return false; // If it has reviews, it's not "new" regardless of creation date
  }
  
  // Check if created within last 30 days
  if (!place.createdAt) {
    return true; // If no createdAt, default to new (backward compatibility)
  }
  
  const createdDate = new Date(place.createdAt);
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  return createdDate >= thirtyDaysAgo;
};

/**
 * Gets the display text for a place's rating or "new" status
 * 
 * @param {Object} place - Place object
 * @param {Function} t - Translation function
 * @returns {string} Rating value or "New" text
 */
export const getPlaceRatingDisplay = (place, t) => {
  if (isPlaceNew(place)) {
    return t("places:card.new_rating");
  }
  
  return place.averageRating || t("places:card.no_rating", "No rating");
};