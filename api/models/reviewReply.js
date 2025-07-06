const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * ReviewReply Model
 * Follows SOLID principles with single responsibility for review reply data
 * Implements DRY principles with consistent timestamp patterns
 */
const ReviewReply = sequelize.define(
  "ReviewReply",
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
    },
    replyText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "reply_text",
      validate: {
        notEmpty: true,
        len: [1, 500] // US-R007: Max 500 characters for host replies
      }
    }
  },
  {
    tableName: "review_replies",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["review_id"],
        name: "unique_review_reply"
      },
      {
        fields: ["user_id"],
        name: "idx_review_replies_user_id"
      },
      {
        fields: ["review_id", "created_at"],
        name: "idx_review_replies_review_created"
      }
    ]
  }
);

module.exports = ReviewReply;
