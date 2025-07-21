/**
 * Migration: Create reviews table
 * Purpose: Store user reviews and ratings for places
 * Follows SOLID principles with single responsibility for review data storage
 */

exports.up = async (pgm) => {
  // Create reviews table with comprehensive fields
  pgm.createTable("reviews", {
    id: {
      type: "serial",
      primaryKey: true
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: "Users(id)",
      onDelete: "CASCADE",
      comment: "User who wrote the review"
    },
    place_id: {
      type: "integer",
      notNull: true,
      references: "Places(id)",
      onDelete: "CASCADE",
      comment: "Place being reviewed"
    },
    rating: {
      type: "integer",
      notNull: true,
      check: "rating >= 1 AND rating <= 5",
      comment: "Rating from 1 to 5 stars"
    },
    comment: {
      type: "text",
      comment: "Review text content"
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending",
      check: "status IN ('pending', 'approved', 'rejected')",
      comment: "Review moderation status"
    },
    is_visible: {
      type: "boolean",
      notNull: true,
      default: true,
      comment: "Whether review is visible to public"
    },
    helpful_count: {
      type: "integer",
      notNull: true,
      default: 0,
      check: "helpful_count >= 0",
      comment: "Number of helpful votes"
    },
    report_count: {
      type: "integer",
      notNull: true,
      default: 0,
      check: "report_count >= 0",
      comment: "Number of reports against this review"
    },
    admin_notes: {
      type: "text",
      comment: "Internal admin notes for moderation"
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("current_timestamp")
    },
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });

  // Create indexes for performance optimization
  pgm.createIndex("reviews", "user_id", {
    name: "idx_reviews_user_id"
  });

  pgm.createIndex("reviews", "place_id", {
    name: "idx_reviews_place_id"
  });

  pgm.createIndex("reviews", "status", {
    name: "idx_reviews_status"
  });

  pgm.createIndex("reviews", "rating", {
    name: "idx_reviews_rating"
  });

  pgm.createIndex("reviews", "created_at", {
    name: "idx_reviews_created_at"
  });

  // Composite index for common queries (place + status + visibility)
  pgm.createIndex("reviews", ["place_id", "status", "is_visible"], {
    name: "idx_reviews_place_status_visible"
  });

  // Composite index for user's reviews
  pgm.createIndex("reviews", ["user_id", "created_at"], {
    name: "idx_reviews_user_created"
  });

  // Add unique constraint to prevent duplicate reviews from same user for same place
  pgm.createConstraint("reviews", "unique_user_place_review", {
    unique: ["user_id", "place_id"]
  });

  // Add comment for table documentation
  pgm.sql(`
    COMMENT ON TABLE reviews IS 'User reviews and ratings for places with moderation support';
  `);
};

exports.down = async (pgm) => {
  // Drop table and all associated indexes/constraints
  pgm.dropTable("reviews", { cascade: true });
};
