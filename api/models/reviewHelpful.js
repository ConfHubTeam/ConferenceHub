const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * ReviewHelpful Model
 * Follows SOLID principles with single responsibility for helpful vote tracking
 * Implements DRY principles with consistent validation patterns
 */
const ReviewHelpful = sequelize.define(
  "ReviewHelpful",
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: {
        model: "Users",
        key: "id"
      },
      onDelete: "CASCADE"
    }
  },
  {
    tableName: "review_helpful",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // No need for updatedAt as helpful votes don't change
    indexes: [
      {
        unique: true,
        fields: ["review_id", "user_id"],
        name: "unique_user_review_helpful"
      },
      {
        fields: ["review_id"],
        name: "idx_review_helpful_review_id"
      },
      {
        fields: ["user_id"],
        name: "idx_review_helpful_user_id"
      },
      {
        fields: ["user_id", "created_at"],
        name: "idx_review_helpful_user_created"
      }
    ]
  }
);

module.exports = ReviewHelpful;
