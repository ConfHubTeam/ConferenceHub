/**
 * Migration: Create review_reports table
 * Purpose: Store reports for flagged reviews
 * Follows SOLID principles with single responsibility for review reporting system
 */

exports.up = async (pgm) => {
  // Create review_reports table for flagged reviews
  pgm.createTable("review_reports", {
    id: {
      type: "serial",
      primaryKey: true
    },
    review_id: {
      type: "integer",
      notNull: true,
      references: "reviews(id)",
      onDelete: "CASCADE",
      comment: "Review being reported"
    },
    reporter_id: {
      type: "integer",
      notNull: true,
      references: "Users(id)",
      onDelete: "CASCADE",
      comment: "User reporting the review"
    },
    reason: {
      type: "varchar(50)",
      notNull: true,
      check: "reason IN ('spam', 'inappropriate', 'fake', 'harassment', 'off_topic', 'other')",
      comment: "Reason for reporting the review"
    },
    description: {
      type: "text",
      comment: "Additional details about the report"
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending",
      check: "status IN ('pending', 'reviewed', 'resolved', 'dismissed')",
      comment: "Status of the report investigation"
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });

  // Create indexes for performance optimization
  pgm.createIndex("review_reports", "review_id", {
    name: "idx_review_reports_review_id"
  });

  pgm.createIndex("review_reports", "reporter_id", {
    name: "idx_review_reports_reporter_id"
  });

  pgm.createIndex("review_reports", "status", {
    name: "idx_review_reports_status"
  });

  pgm.createIndex("review_reports", "reason", {
    name: "idx_review_reports_reason"
  });

  pgm.createIndex("review_reports", "created_at", {
    name: "idx_review_reports_created_at"
  });

  // Composite index for admin review of reports
  pgm.createIndex("review_reports", ["status", "created_at"], {
    name: "idx_review_reports_status_created"
  });

  // Composite index for review report analysis
  pgm.createIndex("review_reports", ["review_id", "status"], {
    name: "idx_review_reports_review_status"
  });

  // Ensure one report per user per review (prevent spam reporting)
  pgm.createConstraint("review_reports", "unique_user_review_report", {
    unique: ["review_id", "reporter_id"]
  });

  // Add comment for table documentation
  pgm.sql(`
    COMMENT ON TABLE review_reports IS 'Stores reports for flagged reviews with moderation workflow support';
  `);
};

exports.down = async (pgm) => {
  // Drop table and all associated indexes/constraints
  pgm.dropTable("review_reports", { cascade: true });
};
