/**
 * Migration: Add rating aggregation fields to places table
 * Purpose: Store calculated rating data for performance optimization
 * Follows SOLID principles with single responsibility for rating data storage
 */

exports.up = async (pgm) => {
  // Add rating aggregation fields
  pgm.addColumns("Places", {
    average_rating: {
      type: "decimal(3,2)",
      comment: "Calculated average rating (0.00 to 5.00)"
    },
    total_reviews: {
      type: "integer",
      notNull: true,
      default: 0,
      comment: "Total count of approved reviews"
    },
    rating_breakdown: {
      type: "jsonb",
      comment: "Breakdown of ratings by star count {1: count, 2: count, ...}"
    },
    rating_updated_at: {
      type: "timestamp",
      comment: "Last time rating was calculated"
    }
  });

  // Add index for better performance on rating queries
  pgm.createIndex("Places", "average_rating", {
    name: "places_average_rating_idx"
  });

  // Add index for total reviews
  pgm.createIndex("Places", "total_reviews", {
    name: "places_total_reviews_idx"
  });

  // Initialize rating data for existing places
  pgm.sql(`
    UPDATE "Places" 
    SET 
      average_rating = NULL,
      total_reviews = 0,
      rating_breakdown = '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb,
      rating_updated_at = NOW()
    WHERE average_rating IS NULL;
  `);
};

exports.down = async (pgm) => {
  // Remove indexes
  pgm.dropIndex("Places", "places_average_rating_idx");
  pgm.dropIndex("Places", "places_total_reviews_idx");

  // Remove columns
  pgm.dropColumns("Places", [
    "average_rating",
    "total_reviews", 
    "rating_breakdown",
    "rating_updated_at"
  ]);
};
