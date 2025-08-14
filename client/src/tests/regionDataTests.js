/**
 * Tests for Region Data Management
 * Validates all region functionality and data integrity
 */

import { UZBEKISTAN_REGIONS, DEFAULT_MAP_CONFIG, MAP_ZOOM_LEVELS } from '../utils/regionConstants.js';
import { RegionService, createRegionService } from '../services/RegionService.js';
import { validateRegionsArray, validateMapConfig } from '../utils/regionValidation.js';
import { RegionConfigManager, createRegionConfigManager } from '../utils/regionConfigManager.js';

/**
 * Test data integrity and structure
 */
export function testRegionDataIntegrity() {
  console.log('🧪 Testing Region Data Integrity...');
  
  // Test regions array validation
  const regionsValidation = validateRegionsArray(UZBEKISTAN_REGIONS);
  if (!regionsValidation.isValid) {
    console.error('❌ Regions validation failed:', regionsValidation.errors);
    return false;
  }

  // Test default map config validation
  const configValidation = validateMapConfig(DEFAULT_MAP_CONFIG);
  if (!configValidation.isValid) {
    console.error('❌ Default map config validation failed:', configValidation.errors);
    return false;
  }

  // Check that we have exactly 13 regions
  if (UZBEKISTAN_REGIONS.length !== 13) {
    console.error(`❌ Expected 13 regions, got ${UZBEKISTAN_REGIONS.length}`);
    return false;
  }

  // Check that Tashkent City is marked as default
  const defaultRegions = UZBEKISTAN_REGIONS.filter(r => r.isDefault);
  if (defaultRegions.length !== 1 || defaultRegions[0].id !== 'tashkent-city') {
    console.error('❌ Tashkent City should be the only default region');
    return false;
  }

  // Check that all regions have required languages
  const requiredLanguages = ['uz', 'en', 'ru'];
  for (const region of UZBEKISTAN_REGIONS) {
    for (const lang of requiredLanguages) {
      if (!region.names[lang] || typeof region.names[lang] !== 'string') {
        console.error(`❌ Region ${region.id} missing ${lang} name`);
        return false;
      }
    }
  }

  console.log('✅ Region data integrity test passed');
  return true;
}

/**
 * Test RegionService functionality
 */
export function testRegionService() {
  console.log('🧪 Testing RegionService...');
  
  const regionService = new RegionService();

  // Test getting all regions
  const allRegions = regionService.getAllRegions();
  if (allRegions.length !== 13) {
    console.error(`❌ Expected 13 regions from service, got ${allRegions.length}`);
    return false;
  }

  // Test getting default region
  const defaultRegion = regionService.getDefaultRegion();
  if (!defaultRegion || defaultRegion.id !== 'tashkent-city') {
    console.error('❌ Default region should be Tashkent City');
    return false;
  }

  // Test getting region by ID
  const tashkentRegion = regionService.getRegionById('tashkent-city');
  if (!tashkentRegion || tashkentRegion.id !== 'tashkent-city') {
    console.error('❌ Failed to get Tashkent region by ID');
    return false;
  }

  // Test search functionality
  const searchResults = regionService.searchRegions('Tashkent');
  if (searchResults.length === 0) {
    console.error('❌ Search for "Tashkent" should return results');
    return false;
  }

  // Test coordinate validation
  const isInUzbekistan = regionService.isWithinUzbekistanBounds(41.299, 69.240);
  if (!isInUzbekistan) {
    console.error('❌ Tashkent coordinates should be within Uzbekistan bounds');
    return false;
  }

  const isOutsideUzbekistan = regionService.isWithinUzbekistanBounds(0, 0);
  if (isOutsideUzbekistan) {
    console.error('❌ Coordinates (0,0) should be outside Uzbekistan bounds');
    return false;
  }

  // Test map configuration
  const mapConfig = regionService.getMapConfigForRegion('tashkent-city');
  if (!mapConfig || mapConfig.regionId !== 'tashkent-city') {
    console.error('❌ Failed to get map config for Tashkent');
    return false;
  }

  console.log('✅ RegionService test passed');
  return true;
}

/**
 * Test RegionConfigManager functionality
 */
export function testRegionConfigManager() {
  console.log('🧪 Testing RegionConfigManager...');
  
  const manager = createRegionConfigManager();

  // Test getting initial config
  const config = manager.getConfig();
  if (config.regions.length !== 13) {
    console.error(`❌ Config manager should have 13 regions, got ${config.regions.length}`);
    return false;
  }

  // Test adding a custom region
  const testRegion = {
    id: 'test-region',
    names: {
      uz: 'Test viloyati',
      en: 'Test Region',
      ru: 'Тестовая область'
    },
    coordinates: {
      lat: 40.0,
      lng: 65.0
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  };

  const addResult = manager.addRegion(testRegion);
  if (!addResult.success) {
    console.error('❌ Failed to add test region:', addResult.errors);
    return false;
  }

  // Test that region was added
  const updatedConfig = manager.getConfig();
  if (updatedConfig.regions.length !== 14) {
    console.error('❌ Region should have been added');
    return false;
  }

  // Test removing the test region
  const removeResult = manager.removeRegion('test-region');
  if (!removeResult.success) {
    console.error('❌ Failed to remove test region:', removeResult.errors);
    return false;
  }

  // Test export/import functionality
  const exportedConfig = manager.exportConfig();
  if (!exportedConfig || typeof exportedConfig !== 'string') {
    console.error('❌ Failed to export config');
    return false;
  }

  // Test statistics
  const stats = manager.getStats();
  if (stats.totalRegions !== 13 || stats.defaultRegion !== 'tashkent-city') {
    console.error('❌ Stats are incorrect');
    return false;
  }

  console.log('✅ RegionConfigManager test passed');
  return true;
}

/**
 * Test coordinate calculations
 */
export function testCoordinateCalculations() {
  console.log('🧪 Testing Coordinate Calculations...');
  
  const regionService = new RegionService();

  // Test distance calculation between Tashkent and Samarkand
  const tashkent = { lat: 41.299, lng: 69.240 };
  const samarkand = { lat: 39.627, lng: 66.975 };
  
  const distance = regionService.calculateDistance(
    tashkent.lat, tashkent.lng,
    samarkand.lat, samarkand.lng
  );

  // Distance should be approximately 275-285 km
  if (distance < 270 || distance > 290) {
    console.error(`❌ Distance between Tashkent and Samarkand should be ~280km, got ${distance}km`);
    return false;
  }

  // Test finding nearest region
  const nearestToTashkent = regionService.findNearestRegion(41.3, 69.2);
  if (!nearestToTashkent || nearestToTashkent.id !== 'tashkent-city') {
    console.error('❌ Nearest region to Tashkent coordinates should be Tashkent City');
    return false;
  }

  console.log('✅ Coordinate calculations test passed');
  return true;
}

/**
 * Test multilingual functionality
 */
export function testMultilingualSupport() {
  console.log('🧪 Testing Multilingual Support...');

  // Mock language detector for testing
  class MockLanguageDetector {
    constructor(language) {
      this.language = language;
    }
    getCurrentLanguage() {
      return this.language;
    }
  }

  // Test English
  const englishService = new RegionService(new MockLanguageDetector('en'));
  const englishRegions = englishService.getAllRegions();
  const tashkentEn = englishRegions.find(r => r.id === 'tashkent-city');
  if (tashkentEn.displayName !== 'Tashkent City') {
    console.error(`❌ English display name should be 'Tashkent City', got '${tashkentEn.displayName}'`);
    return false;
  }

  // Test Uzbek
  const uzbekService = new RegionService(new MockLanguageDetector('uz'));
  const uzbekRegions = uzbekService.getAllRegions();
  const tashkentUz = uzbekRegions.find(r => r.id === 'tashkent-city');
  if (tashkentUz.displayName !== 'Toshkent shahri') {
    console.error(`❌ Uzbek display name should be 'Toshkent shahri', got '${tashkentUz.displayName}'`);
    return false;
  }

  // Test Russian
  const russianService = new RegionService(new MockLanguageDetector('ru'));
  const russianRegions = russianService.getAllRegions();
  const tashkentRu = russianRegions.find(r => r.id === 'tashkent-city');
  if (tashkentRu.displayName !== 'город Ташкент') {
    console.error(`❌ Russian display name should be 'город Ташкент', got '${tashkentRu.displayName}'`);
    return false;
  }

  console.log('✅ Multilingual support test passed');
  return true;
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('🚀 Running Region Data Management Tests...\n');

  const tests = [
    testRegionDataIntegrity,
    testRegionService,
    testRegionConfigManager,
    testCoordinateCalculations,
    testMultilingualSupport
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    try {
      if (test()) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ Test failed with error:`, error);
    }
    console.log(''); // Add spacing between tests
  }

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Region data management implementation is working correctly.');
    return true;
  } else {
    console.log('❌ Some tests failed. Please review the implementation.');
    return false;
  }
}

// Auto-run tests if this file is imported directly
if (typeof window !== 'undefined' && import.meta.env?.MODE === 'development') {
  // Only run in development mode
  setTimeout(() => {
    console.log('🔧 Development mode detected. Running region tests...');
    runAllTests();
  }, 1000);
}

export default {
  testRegionDataIntegrity,
  testRegionService,
  testRegionConfigManager,
  testCoordinateCalculations,
  testMultilingualSupport,
  runAllTests
};
