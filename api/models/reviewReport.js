const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * ReviewReport Model
 * Follows SOLID principles with single responsibility for review reporting system
 * Implements DRY principles with reusable enum validation patterns
 */
const ReviewReport = sequelize.define(
  "ReviewReport",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "review_id",
      references: {
        model: "reviews",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "reporter_id",
      references: {
        model: "Users",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    reason: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [["spam", "inappropriate", "fake", "harassment", "off_topic", "other"]]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000] // Reasonable length limit for descriptions
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "reviewed", "resolved", "dismissed"]]
      }
    }
  },
  {
    tableName: "review_reports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // Reports don't get updated, only status changes
    indexes: [
      {
        unique: true,
        fields: ["review_id", "reporter_id"],
        name: "unique_user_review_report"
      },
      {
        fields: ["review_id"],
        name: "idx_review_reports_review_id"
      },
      {
        fields: ["reporter_id"],
        name: "idx_review_reports_reporter_id"
      },
      {
        fields: ["status"],
        name: "idx_review_reports_status"
      },
      {
        fields: ["reason"],
        name: "idx_review_reports_reason"
      },
      {
        fields: ["status", "created_at"],
        name: "idx_review_reports_status_created"
      },
      {
        fields: ["review_id", "status"],
        name: "idx_review_reports_review_status"
      }
    ]
  }
);

module.exports = ReviewReport;
