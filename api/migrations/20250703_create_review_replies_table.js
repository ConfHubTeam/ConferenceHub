/**
 * Migration: Create review_replies table
 * Purpose: Store host responses to user reviews
 * Follows SOLID principles with single responsibility for reply data storage
 */

exports.up = async (pgm) => {
  // Create review_replies table for host responses
  pgm.createTable("review_replies", {
    id: {
      type: "serial",
      primaryKey: true
    },
    review_id: {
      type: "integer",
      notNull: true,
      references: "reviews(id)",
      onDelete: "CASCADE",
      comment: "Review being replied to"
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: "Users(id)",
      onDelete: "CASCADE",
      comment: "User writing the reply (typically the host)"
    },
    reply_text: {
      type: "text",
      notNull: true,
      comment: "Reply content text"
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
  pgm.createIndex("review_replies", "review_id", {
    name: "idx_review_replies_review_id"
  });

  pgm.createIndex("review_replies", "user_id", {
    name: "idx_review_replies_user_id"
  });

  pgm.createIndex("review_replies", "created_at", {
    name: "idx_review_replies_created_at"
  });

  // Composite index for review replies with timestamp
  pgm.createIndex("review_replies", ["review_id", "created_at"], {
    name: "idx_review_replies_review_created"
  });

  // Ensure only one reply per review (business rule: hosts can reply once)
  pgm.createConstraint("review_replies", "unique_review_reply", {
    unique: ["review_id"]
  });

  // Add comment for table documentation
  pgm.sql(`
    COMMENT ON TABLE review_replies IS 'Host replies to user reviews with one reply per review limit';
  `);
};

exports.down = async (pgm) => {
  // Drop table and all associated indexes/constraints
  pgm.dropTable("review_replies", { cascade: true });
};
