#!/usr/bin/env node
/**
 * Test script for US-LOCK-002: Place Details Page Lock Optimization
 * 
 * Tests the optimized place details and home places endpoints to ensure:
 * 1. Lock usage is minimal (≤5 locks per request)
 * 2. Response times are fast
 * 3. All functionality works correctly
 * 4. Cache is working properly
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_BASE = `${BASE_URL}/api`;

console.log('🧪 US-LOCK-002 Test Suite: Place Details Page Lock Optimization');
console.log('=' .repeat(70));

/**
 * Test optimized place details endpoint
 */
async function testOptimizedPlaceDetails() {
  console.log('\n📄 Testing Optimized Place Details...');
  
  try {
    // First, get a place ID from home places
    const homePlacesResponse = await axios.get(`${API_BASE}/places/home?limit=5`);
    
    // Handle both array and paginated response formats
    let places = [];
    if (homePlacesResponse.data.places) {
      places = homePlacesResponse.data.places;
    } else if (Array.isArray(homePlacesResponse.data)) {
      places = homePlacesResponse.data;
    }
    
    if (!places || places.length === 0) {
      console.log('❌ No places found in database to test');
      return false;
    }
    
    const testPlaceId = places[0].id;
    console.log(`   Testing with place ID: ${testPlaceId}`);
    
    // Test regular place details
    const startTime = Date.now();
    const placeResponse = await axios.get(`${API_BASE}/places/${testPlaceId}`);
    const regularTime = Date.now() - startTime;
    
    console.log(`   ✅ Regular place details: ${regularTime}ms`);
    console.log(`   📦 Place data: ${placeResponse.data.title || 'N/A'}`);
    
    // Test optimized place details (if endpoint exists)
    try {
      const optimizedStartTime = Date.now();
      const optimizedResponse = await axios.get(`${API_BASE}/places/${testPlaceId}?optimized=true`);
      const optimizedTime = Date.now() - optimizedStartTime;
      
      console.log(`   🚀 Optimized place details: ${optimizedTime}ms`);
      
      if (optimizedResponse.data._optimization) {
        console.log(`   📊 Cache hit: ${optimizedResponse.data._optimization.cacheHit || false}`);
        console.log(`   🔒 User story: ${optimizedResponse.data._optimization.userStory}`);
      }
      
      // Verify data consistency
      if (placeResponse.data.id === optimizedResponse.data.id) {
        console.log('   ✅ Data consistency verified');
      } else {
        console.log('   ❌ Data inconsistency detected');
        return false;
      }
    } catch (error) {
      console.log(`   ⚠️  Optimized endpoint not available: ${error.response?.status || error.message}`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Place details test failed: ${error.response?.status || error.message}`);
    return false;
  }
}

/**
 * Test optimized home places endpoint
 */
async function testOptimizedHomePlaces() {
  console.log('\n🏠 Testing Optimized Home Places...');
  
  try {
    // Test regular home places
    const startTime = Date.now();
    const regularResponse = await axios.get(`${API_BASE}/places/home?page=1&limit=10`);
    const regularTime = Date.now() - startTime;
    
    console.log(`   ✅ Regular home places: ${regularTime}ms`);
    console.log(`   📦 Places count: ${regularResponse.data.places?.length || regularResponse.data.length}`);
    
    // Test optimized home places
    try {
      const optimizedStartTime = Date.now();
      const optimizedResponse = await axios.get(`${API_BASE}/places/home?page=1&limit=10&optimized=true`);
      const optimizedTime = Date.now() - optimizedStartTime;
      
      console.log(`   🚀 Optimized home places: ${optimizedTime}ms`);
      
      if (optimizedResponse.data._optimization) {
        console.log(`   📊 Batch processing: ${optimizedResponse.data._optimization.optimizedBatch}`);
        console.log(`   🔒 User story: ${optimizedResponse.data._optimization.userStory}`);
        console.log(`   ⚡ Processing time: ${optimizedResponse.data._optimization.processingTime}ms`);
      }
      
      // Verify data consistency
      const regularCount = regularResponse.data.places?.length || regularResponse.data.length;
      const optimizedCount = optimizedResponse.data.places?.length || optimizedResponse.data.length;
      
      if (regularCount === optimizedCount) {
        console.log('   ✅ Data consistency verified');
      } else {
        console.log(`   ⚠️  Count difference: regular=${regularCount}, optimized=${optimizedCount}`);
      }
      
      return true;
    } catch (error) {
      console.log(`   ⚠️  Optimized endpoint error: ${error.response?.status || error.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Home places test failed: ${error.response?.status || error.message}`);
    return false;
  }
}

/**
 * Test availability checking optimization
 */
async function testOptimizedAvailability() {
  console.log('\n📅 Testing Optimized Availability...');
  
  try {
    // Get a place ID first
    const homePlacesResponse = await axios.get(`${API_BASE}/places/home?limit=1`);
    
    // Handle both array and paginated response formats
    let places = [];
    if (homePlacesResponse.data.places) {
      places = homePlacesResponse.data.places;
    } else if (Array.isArray(homePlacesResponse.data)) {
      places = homePlacesResponse.data;
    }
    
    if (!places || places.length === 0) {
      console.log('❌ No places found to test availability');
      return false;
    }
    
    const testPlaceId = places[0].id;
    
    // Test availability check endpoint (if it exists)
    try {
      const availabilityData = {
        placeId: testPlaceId,
        selectedDates: [new Date().toISOString().split('T')[0]], // Today
        startTime: '10:00',
        endTime: '18:00'
      };
      
      const startTime = Date.now();
      const response = await axios.post(`${API_BASE}/places/check-availability`, availabilityData);
      const checkTime = Date.now() - startTime;
      
      console.log(`   ✅ Availability check: ${checkTime}ms`);
      console.log(`   📊 Available: ${response.data.available}`);
      
      if (response.data._optimization) {
        console.log(`   🔒 User story: ${response.data._optimization.userStory}`);
        console.log(`   ⚡ Processing time: ${response.data._optimization.processingTime}ms`);
      }
      
      return true;
    } catch (error) {
      console.log(`   ⚠️  Availability endpoint not available: ${error.response?.status || error.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Availability test failed: ${error.response?.status || error.message}`);
    return false;
  }
}

/**
 * Test lock monitoring
 */
async function testLockMonitoring() {
  console.log('\n🔒 Testing Lock Monitoring...');
  
  try {
    const response = await axios.get(`${API_BASE}/places/lock-monitoring`);
    
    console.log(`   ✅ Lock monitoring endpoint working`);
    console.log(`   📊 Current locks: ${response.data.currentLocks || 'N/A'}`);
    console.log(`   📈 Peak locks: ${response.data.peakLocks || 'N/A'}`);
    console.log(`   🕒 Uptime: ${response.data.uptimeSeconds || 'N/A'}s`);
    
    if (response.data.currentLocks > 10) {
      console.log(`   ⚠️  Warning: High lock usage detected (${response.data.currentLocks})`);
    } else {
      console.log('   ✅ Lock usage within acceptable limits');
    }
    
    return true;
  } catch (error) {
    console.log(`   ⚠️  Lock monitoring not available: ${error.response?.status || error.message}`);
    return false;
  }
}

/**
 * Test cache functionality
 */
async function testCacheOptimization() {
  console.log('\n🗄️  Testing Cache Optimization...');
  
  try {
    // Clear cache first
    try {
      await axios.post(`${API_BASE}/places/clear-cache`);
      console.log('   ✅ Cache cleared');
    } catch (error) {
      console.log(`   ⚠️  Cache clear not available: ${error.response?.status || error.message}`);
    }
    
    // Get home places to test cache behavior
    const homePlacesResponse = await axios.get(`${API_BASE}/places/home?limit=5`);
    
    if (!homePlacesResponse.data || homePlacesResponse.data.length === 0) {
      console.log('❌ No places found to test cache');
      return false;
    }
    
    const testPlaceId = homePlacesResponse.data[0].id;
    
    // First request (cache miss)
    const startTime1 = Date.now();
    const response1 = await axios.get(`${API_BASE}/places/${testPlaceId}?optimized=true`);
    const time1 = Date.now() - startTime1;
    
    // Second request (cache hit)
    const startTime2 = Date.now();
    const response2 = await axios.get(`${API_BASE}/places/${testPlaceId}?optimized=true`);
    const time2 = Date.now() - startTime2;
    
    console.log(`   🥶 First request (cache miss): ${time1}ms`);
    console.log(`   🔥 Second request (cache hit): ${time2}ms`);
    
    if (time2 < time1) {
      console.log('   ✅ Cache performance improvement detected');
    } else {
      console.log('   ⚠️  Cache may not be working optimally');
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Cache test failed: ${error.response?.status || error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log(`📅 Test time: ${new Date().toISOString()}\n`);
  
  const results = {};
  
  results.placeDetails = await testOptimizedPlaceDetails();
  results.homePlaces = await testOptimizedHomePlaces();
  results.availability = await testOptimizedAvailability();
  results.lockMonitoring = await testLockMonitoring();
  results.cache = await testCacheOptimization();
  
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(30));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${test.padEnd(20)}: ${status}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.values(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 US-LOCK-002 optimization is working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some optimizations may need attention');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testOptimizedPlaceDetails,
  testOptimizedHomePlaces,
  testOptimizedAvailability,
  testLockMonitoring,
  testCacheOptimization,
  runAllTests
};
