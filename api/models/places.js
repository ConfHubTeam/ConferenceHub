const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./users');
const Currency = require('./currency');

const Place = sequelize.define('Place', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  photos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  perks: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  extraInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  checkIn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  checkOut: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maxGuests: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  youtubeLink: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  matterportLink: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'matterport_link',
    validate: {
      isUrl: true,
      isMatterportUrl(value) {
        if (value && !value.includes('matterport.com')) {
          throw new Error('Must be a valid Matterport URL');
        }
      }
    }
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  currencyId: {
    type: DataTypes.INTEGER,
    allowNull: true, // oldin tushgan zapislarga xato bermasligi uchun nullable qilindi.
    references: {
      model: 'Currencies',
      key: 'id'
    }
  },
  fullDayHours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 8, // 8 hours is considered a full day by default
    validate: {
      min: 1,
      max: 24
    }
  },
  fullDayDiscountPrice: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  minimumHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Default minimum booking is 1 hour
    validate: {
      min: 1,
      max: 5
    }
  },
  cooldown: {
    type: DataTypes.INTEGER, // minutda ketadi menimcha yani 60, 30, 15 minut shuning uchun Int32
    allowNull: false,
    defaultValue: 30 // taxminan default qiymat 30 minut
  },
  blockedWeekdays: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
    defaultValue: []
  },
  blockedDates: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  weekdayTimeSlots: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      0: { start: "", end: "" }, // Sunday
      1: { start: "", end: "" }, // Monday
      2: { start: "", end: "" }, // Tuesday
      3: { start: "", end: "" }, // Wednesday
      4: { start: "", end: "" }, // Thursday
      5: { start: "", end: "" }, // Friday
      6: { start: "", end: "" }  // Saturday
    }
  },
  squareMeters: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  isHotel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  refundOptions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    field: 'refund_options', // Explicitly map to database column
    validate: {
      isValidRefundOptions(value) {
        const validOptions = [
          'flexible_14_day',
          'moderate_7_day', 
          'strict',
          'non_refundable',
          'reschedule_only',
          'client_protection_plan'
        ];
        
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('At least one refund option must be selected');
        }
        
        for (const option of value) {
          if (!validOptions.includes(option)) {
            throw new Error(`Invalid refund option: ${option}`);
          }
        }
      }
    }
  },
  // Rating aggregation fields for performance optimization
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'average_rating',
    validate: {
      min: 0,
      max: 5
    }
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_reviews',
    validate: {
      min: 0
    }
  },
  ratingBreakdown: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'rating_breakdown',
    defaultValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  },
  ratingUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'rating_updated_at'
  }
}, {
  timestamps: true
});

Place.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Place.belongsTo(Currency, { foreignKey: 'currencyId', as: 'currency' });

module.exports = Place;