const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Review Model
 * Follows SOLID principles with single responsibility for review data representation
 * Implements DRY principles with reusable validation patterns
 */
const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    placeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "place_id",
      references: {
        model: "Places",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for existing reviews
      field: "booking_id",
      references: {
        model: "Bookings",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
        isInt: true
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "approved", "rejected"]]
      }
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_visible"
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "helpful_count",
      validate: {
        min: 0
      }
    },
    reportCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "report_count",
      validate: {
        min: 0
      }
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "admin_notes"
    }
  },
  {
    tableName: "reviews",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["booking_id"],
        name: "unique_booking_review"
      },
      {
        unique: true,
        fields: ["user_id", "place_id"],
        name: "unique_user_place_review"
      },
      {
        fields: ["place_id"],
        name: "idx_reviews_place_id"
      },
      {
        fields: ["user_id"],
        name: "idx_reviews_user_id"
      },
      {
        fields: ["status"],
        name: "idx_reviews_status"
      },
      {
        fields: ["rating"],
        name: "idx_reviews_rating"
      },
      {
        fields: ["place_id", "status", "is_visible"],
        name: "idx_reviews_place_status_visible"
      }
    ]
  }
);

module.exports = Review;
