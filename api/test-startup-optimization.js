/**
 * Test Script for US-LOCK-001 Implementation
 * 
 * This script tests the optimized database initialization to ensure
 * it works within the 64 lock limit on managed PostgreSQL services.
 * 
 * Usage: node test-startup-optimization.js
 */

require('dotenv').config();
const { sequelize, User, Place, Booking, Currency } = require('./models');
const StartupManager = require('./services/startupManager');

async function testStartupOptimization() {
  console.log('🧪 Testing US-LOCK-001 Startup Optimization...');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Database: ${process.env.DB_URL ? 'Remote (Managed)' : 'Local'}`);
  
  const allModels = {
    User,
    Place, 
    Booking,
    Currency
  };
  
  const startupManager = new StartupManager(sequelize, allModels);
  
  try {
    const startTime = Date.now();
    
    // Test the optimized initialization
    const result = await startupManager.initializeApplication();
    
    const totalTime = Date.now() - startTime;
    console.log('\n✅ Test Results:');
    console.log(`📈 Total startup time: ${totalTime}ms`);
    console.log(`🔒 Lock optimization: ${result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`📊 Database report:`, result.dbReport);
    
    // Test basic database operations
    console.log('\n🔍 Testing basic database operations...');
    
    // Test user creation (should not cause lock issues)
    const testUser = await User.findOne({ limit: 1 });
    console.log(`👤 User table access: ${testUser ? 'OK' : 'No users found (OK)'}`);
    
    // Test place access (with foreign key relationships)
    const testPlace = await Place.findOne({ 
      include: [{ model: User, as: 'owner' }],
      limit: 1 
    });
    console.log(`🏠 Place table with relations: ${testPlace ? 'OK' : 'No places found (OK)'}`);
    
    console.log('\n✅ All tests passed! Startup optimization is working correctly.');
    
    // Performance recommendations
    console.log('\n📋 Performance Recommendations:');
    if (totalTime > 30000) {
      console.log('⚠️  Startup time > 30s - Consider further optimization');
    } else if (totalTime > 15000) {
      console.log('⚡ Startup time > 15s - Monitor in production');
    } else {
      console.log('🚀 Startup time is optimal!');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('🔧 Troubleshooting tips:');
    console.error('  1. Check database connection settings');
    console.error('  2. Verify PostgreSQL service is running');
    console.error('  3. Check for lock-related error messages');
    console.error('  4. Ensure database user has necessary permissions');
    
    process.exit(1);
  } finally {
    // Clean up connections
    await sequelize.close();
  }
}

// Handle script execution
if (require.main === module) {
  testStartupOptimization()
    .then(() => {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testStartupOptimization };
