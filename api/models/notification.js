/**
 * Notification Model
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only notification data representation
 * - Open/Closed: Extensible for new notification types
 * - Interface Segregation: Focused on notification-specific attributes
 * 
 * Implements DRY principle by centralizing notification data structure
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "Notification",
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
    type: {
      type: DataTypes.ENUM(
        "review_created",
        "review_reply", 
        "reply_helpful",
        "booking_requested",
        "booking_paid",
        "booking_approved",
        "booking_selected",
        "booking_rejected",
        "booking_confirmed",
        "booking_paid_to_host"
      ),
      allowNull: false,
      validate: {
        isIn: [[
          "review_created", 
          "review_reply", 
          "reply_helpful",
          "booking_requested",
          "booking_paid",
          "booking_approved",
          "booking_selected",
          "booking_rejected",
          "booking_confirmed",
          "booking_paid_to_host"
        ]]
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidMetadata(value) {
          if (value && typeof value !== "object") {
            throw new Error("Metadata must be a valid JSON object");
          }
        }
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_read"
    },
    isEmailSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_email_sent"
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at"
    }
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // We don't need updatedAt for notifications
    tableName: "notifications",
    indexes: [
      {
        fields: ["user_id"]
      },
      {
        fields: ["type"]
      },
      {
        fields: ["is_read"]
      },
      {
        fields: ["created_at"]
      },
      {
        fields: ["user_id", "is_read"]
      }
    ]
  }
);

// Define associations
Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user"
  });
};

module.exports = Notification;
