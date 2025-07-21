/**
 * Migration: Create review_helpful table
 * Purpose: Store helpful votes for reviews
 * Follows SOLID principles with single responsibility for helpful vote tracking
 */

exports.up = async (pgm) => {
  // Create review_helpful table for helpful votes
  pgm.createTable("review_helpful", {
    id: {
      type: "serial",
      primaryKey: true
    },
    review_id: {
      type: "integer",
      notNull: true,
      references: "reviews(id)",
      onDelete: "CASCADE",
      comment: "Review being marked as helpful"
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: "Users(id)",
      onDelete: "CASCADE",
      comment: "User marking review as helpful"
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });

  // Create indexes for performance optimization
  pgm.createIndex("review_helpful", "review_id", {
    name: "idx_review_helpful_review_id"
  });

  pgm.createIndex("review_helpful", "user_id", {
    name: "idx_review_helpful_user_id"
  });

  pgm.createIndex("review_helpful", "created_at", {
    name: "idx_review_helpful_created_at"
  });

  // Composite index for user's helpful votes
  pgm.createIndex("review_helpful", ["user_id", "created_at"], {
    name: "idx_review_helpful_user_created"
  });

  // Ensure one helpful vote per user per review
  pgm.createConstraint("review_helpful", "unique_user_review_helpful", {
    unique: ["review_id", "user_id"]
  });

  // Add comment for table documentation
  pgm.sql(`
    COMMENT ON TABLE review_helpful IS 'Tracks helpful votes for reviews with one vote per user per review';
  `);
};

exports.down = async (pgm) => {
  // Drop table and all associated indexes/constraints
  pgm.dropTable("review_helpful", { cascade: true });
};
