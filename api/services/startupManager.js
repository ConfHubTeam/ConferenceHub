/**
 * Optimized Startup Module for US-LOCK-001
 * 
 * This module replaces the problematic `sequelize.sync({ alter: true })` approach
 * with a sequential initialization strategy that works within the 64 lock limit
 * of managed PostgreSQL services.
 */

const DatabaseInitializer = require('./databaseInitializer');
const optimizationConfig = require('../config/databaseOptimization');
const bcrypt = require('bcryptjs');
const authConfig = require('../config/auth');
const { Op } = require('sequelize');

class StartupManager {
  constructor(sequelize, models) {
    this.sequelize = sequelize;
    this.models = models;
    this.dbInitializer = new DatabaseInitializer(sequelize, models);
    this.startupTime = null;
  }

  /**
   * Main startup method - replaces the old sequelize.sync approach
   */
  async initializeApplication() {
    this.startupTime = Date.now();
    console.log('🚀 Starting ConferenceHub application with optimized database initialization...');
    
    try {
      // Step 1: Initialize database schema with sequential approach
      console.log('📊 Phase 1: Database Schema Initialization');
      await this.dbInitializer.initializeDatabase();
      
      // Step 2: Run application-level initialization
      console.log('📊 Phase 2: Application Data Initialization');
      await this.initializeApplicationData();
      
      // Step 3: Post-initialization tasks
      console.log('📊 Phase 3: Post-Initialization Tasks');
      await this.runPostInitializationTasks();
      
      const totalTime = Date.now() - this.startupTime;
      console.log(`✅ Application initialization completed successfully in ${totalTime}ms`);
      
      return {
        success: true,
        totalTime,
        dbReport: this.dbInitializer.getInitializationReport()
      };
      
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize application-level data (users, currencies, etc.)
   */
  async initializeApplicationData() {
    console.log('🔧 Initializing application data...');
    
    try {
      // Create admin account if it doesn't exist
      await this.createAdminAccountIfNotExists();
      
      // Seed default currencies if they don't exist
      await this.seedDefaultCurrencies();
      
      console.log('✅ Application data initialization completed');
      
    } catch (error) {
      console.error('❌ Application data initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create admin account with minimal lock usage
   */
  async createAdminAccountIfNotExists() {
    console.log('👤 Checking admin account...');
    
    try {
      // Admin credentials from environment variables
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@conferencehub.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!@#';
      const adminName = process.env.ADMIN_NAME || 'System Administrator';
      
      // Check if admin account already exists (single query)
      const existingAdmin = await this.models.User.findOne({ 
        where: { 
          email: adminEmail,
          userType: 'agent' 
        },
        attributes: ['id', 'email'] // Only fetch necessary fields
      });
      
      if (!existingAdmin) {
        console.log('  📝 Creating admin account...');
        
        const bcryptSalt = authConfig.bcrypt.generateSalt();
        await this.models.User.create({
          name: adminName,
          email: adminEmail,
          password: bcrypt.hashSync(adminPassword, bcryptSalt),
          userType: 'agent' // 'agent' is the admin role
        });
        
        console.log('  ✅ Admin account created successfully');
      } else {
        console.log('  ℹ️  Admin account already exists');
      }
      
    } catch (error) {
      console.error('  ❌ Error with admin account:', error.message);
      // Don't throw error for admin account issues during development
      console.log('  ⚠️  Continuing without admin account setup');
    }
  }

  /**
   * Seed default currencies with minimal database impact
   */
  async seedDefaultCurrencies() {
    console.log('💰 Checking default currencies...');
    
    try {
      // Import currency seeder dynamically to avoid circular dependencies
      const { seedDefaultCurrencies } = require('../routes/currencySeeder');
      await seedDefaultCurrencies();
      console.log('  ✅ Currency seeding completed');
      
    } catch (error) {
      console.error('  ❌ Error seeding currencies:', error.message);
      // Don't throw error for currency seeding issues
      console.log('  ⚠️  Continuing without currency seeding');
    }
  }

  /**
   * Run post-initialization tasks (cleanup, optimization, etc.)
   */
  async runPostInitializationTasks() {
    console.log('🧹 Running post-initialization tasks...');
    
    try {
      // Task 1: Cleanup expired bookings (with limit to prevent lock buildup)
      await this.cleanupExpiredBookings();
      
      // Task 2: Update materialized views if any exist
      await this.refreshMaterializedViews();
      
      // Task 3: Log startup statistics
      await this.logStartupStatistics();
      
      console.log('✅ Post-initialization tasks completed');
      
    } catch (error) {
      console.error('⚠️  Some post-initialization tasks failed:', error.message);
      // Don't fail startup for non-critical post-init tasks
    }
  }

  /**
   * Cleanup expired bookings with batching to prevent lock issues
   */
  async cleanupExpiredBookings() {
    console.log('  🧹 Cleaning up expired bookings...');
    
    try {
      // Only cleanup a limited number of expired bookings to prevent lock buildup
      const expiredBookings = await this.models.Booking.findAll({
        where: {
          status: 'pending',
          createdAt: {
            [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
          }
        },
        limit: 10, // Limit to prevent lock buildup
        attributes: ['id', 'status', 'createdAt']
      });
      
      if (expiredBookings.length > 0) {
        // Update in small batches
        for (const booking of expiredBookings) {
          await booking.update({ status: 'cancelled' });
          // Small delay between updates
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`    ✅ Cleaned up ${expiredBookings.length} expired bookings`);
      } else {
        console.log('    ℹ️  No expired bookings to clean up');
      }
      
    } catch (error) {
      console.error('    ⚠️  Booking cleanup failed:', error.message);
    }
  }

  /**
   * Refresh materialized views if any exist
   */
  async refreshMaterializedViews() {
    console.log('  🔄 Refreshing materialized views...');
    
    try {
      // Check if any materialized views exist
      const [views] = await this.sequelize.query(`
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
        LIMIT 5
      `);
      
      if (views.length > 0) {
        for (const view of views) {
          try {
            await this.sequelize.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view.matviewname}`);
            console.log(`    ✅ Refreshed materialized view: ${view.matviewname}`);
          } catch (error) {
            console.log(`    ⚠️  Could not refresh view ${view.matviewname}: ${error.message}`);
          }
        }
      } else {
        console.log('    ℹ️  No materialized views to refresh');
      }
      
    } catch (error) {
      console.error('    ⚠️  Materialized view refresh failed:', error.message);
    }
  }

  /**
   * Log startup statistics for monitoring
   */
  async logStartupStatistics() {
    console.log('  📊 Logging startup statistics...');
    
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        totalStartupTime: Date.now() - this.startupTime,
        databaseReport: this.dbInitializer.getInitializationReport(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      };
      
      // In production, you might want to send these stats to a monitoring service
      console.log('📈 Startup Statistics:', JSON.stringify(stats, null, 2));
      
    } catch (error) {
      console.error('    ⚠️  Statistics logging failed:', error.message);
    }
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown() {
    console.log('🛑 Initiating graceful shutdown...');
    
    try {
      // Close database connections
      await this.sequelize.close();
      console.log('✅ Database connections closed');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

module.exports = StartupManager;
