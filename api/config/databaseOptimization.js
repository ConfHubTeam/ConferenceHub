/**
 * Database Configuration for US-LOCK-001 Optimization
 * 
 * This configuration file contains settings to optimize database operations
 * for managed PostgreSQL services with lock limitations.
 */

module.exports = {
  // Lock optimization settings
  locks: {
    maxConcurrentOperations: 3, // Maximum concurrent database operations
    batchSize: 5, // Number of operations per batch
    delayBetweenBatches: 200, // Milliseconds between batches
    delayBetweenOperations: 100, // Milliseconds between individual operations
    maxRetries: 3, // Maximum retry attempts for failed operations
    retryDelay: 1000 // Delay between retries in milliseconds
  },

  // Sequelize optimization settings
  sequelize: {
    pool: {
      max: 5,        // Maximum connections in pool (reduced from default)
      min: 1,        // Minimum connections (reduced from default)
      acquire: 30000, // Maximum time to wait for connection
      idle: 10000,   // Maximum time connection can be idle
      evict: 5000    // Time before evicting idle connections
    },
    
    // Retry configuration for connection issues
    retry: {
      max: 3,
      timeout: 60000,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEOUT/,
        /EAI_AGAIN/,
        /lock timeout/i,
        /out of shared memory/i
      ]
    },

    // Logging configuration
    logging: process.env.NODE_ENV === 'production' ? false : (msg) => {
      // Only log slow queries in development
      const duration = msg.match(/Executed \(.* ms\)/);
      if (duration && parseInt(duration[0].match(/\d+/)[0]) > 1000) {
        console.log('🐌 Slow Query:', msg);
      }
    },

    // Query timeout settings
    dialectOptions: {
      ssl: process.env.DB_URL ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      connectTimeout: 60000,
      socketTimeout: 60000,
      statement_timeout: 30000, // 30 second query timeout
      lock_timeout: 10000       // 10 second lock timeout
    }
  },

  // Table creation priorities (low to high dependency)
  tableCreationOrder: [
    'currencies',      // Priority 1: No dependencies
    'users',          // Priority 1: No dependencies
    'places',         // Priority 2: Depends on users, currencies
    'bookings',       // Priority 3: Depends on places, users
    'transactions',   // Priority 4: Depends on bookings, users
    'reviews',        // Priority 3: Depends on users, places
    'reviewreplies',  // Priority 4: Depends on reviews, users
    'reviewhelpfuls', // Priority 4: Depends on reviews, users
    'reviewreports',  // Priority 4: Depends on reviews, users
    'notifications',  // Priority 2: Depends on users
    'userfavorites'   // Priority 3: Depends on users, places
  ],

  // Index creation settings
  indexes: {
    createConcurrently: true, // Use CONCURRENTLY where possible
    maxConcurrentIndexes: 2,  // Maximum indexes created simultaneously
    delayBetweenIndexes: 500, // Delay between index creation
    
    // Critical indexes for US-LOCK-013 (availability optimization)
    availabilityIndexes: [
      {
        name: 'idx_bookings_availability',
        table: 'bookings',
        columns: ['placeId', 'status', 'checkInDate', 'checkOutDate'],
        priority: 'high'
      },
      {
        name: 'idx_bookings_time_slots_gin',
        table: 'bookings',
        type: 'gin',
        columns: ['timeSlots'],
        priority: 'high'
      },
      {
        name: 'idx_places_availability',
        table: 'places',
        columns: ['startDate', 'endDate'],
        priority: 'medium'
      }
    ]
  },

  // Startup monitoring settings
  monitoring: {
    enableLockMonitoring: true,
    lockCheckInterval: 5000,    // Check lock usage every 5 seconds
    maxLockUsageWarning: 50,    // Warn when locks exceed 50
    maxLockUsageCritical: 60,   // Critical when locks exceed 60
    
    // Performance thresholds
    performanceThresholds: {
      tableCreation: 5000,      // Max time for table creation (ms)
      constraintCreation: 3000, // Max time for constraint creation (ms)
      indexCreation: 10000,     // Max time for index creation (ms)
      totalStartup: 60000       // Max total startup time (ms)
    }
  },

  // Error handling and recovery
  errorHandling: {
    continueOnNonCriticalErrors: true,
    criticalErrors: [
      'connection refused',
      'authentication failed',
      'database does not exist',
      'permission denied'
    ],
    
    // Recovery strategies
    recovery: {
      enableAutoRetry: true,
      maxRetryAttempts: 3,
      retryBackoffMs: [1000, 2000, 5000], // Exponential backoff
      
      // Fallback strategies
      fallbackToBasicSync: true,  // Fall back to basic sync if advanced init fails
      skipOptionalIndexes: true,  // Skip non-critical indexes on errors
      skipOptionalConstraints: true // Skip non-critical constraints on errors
    }
  },

  // Development vs Production settings
  environment: {
    development: {
      enableVerboseLogging: true,
      enableLockMonitoring: true,
      enablePerformanceMetrics: true,
      skipOptionalOptimizations: false
    },
    
    production: {
      enableVerboseLogging: false,
      enableLockMonitoring: true,
      enablePerformanceMetrics: true,
      skipOptionalOptimizations: false
    }
  }
};
