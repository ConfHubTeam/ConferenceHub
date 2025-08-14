/**
 * Region Service - Handles all region-related operations
 * Follows Single Responsibility Principle - only manages region operations
 * Follows Dependency Inversion Principle - depends on abstractions, not concretions
 */

import { UZBEKISTAN_REGIONS, DEFAULT_MAP_CONFIG, MAP_ZOOM_LEVELS } from '../utils/regionConstants.js';

/**
 * Abstract interface for language detection
 * Follows Interface Segregation Principle
 */
export class LanguageDetectorInterface {
  getCurrentLanguage() {
    throw new Error('getCurrentLanguage method must be implemented');
  }
}

/**
 * Default language detector implementation
 * Can be replaced with any implementation that follows the interface
 */
export class DefaultLanguageDetector extends LanguageDetectorInterface {
  getCurrentLanguage() {
    // Default to English if no language is detected
    return 'en';
  }
}

/**
 * I18n-based language detector
 * Integrates with the existing i18n system
 */
export class I18nLanguageDetector extends LanguageDetectorInterface {
  constructor(i18nInstance) {
    super();
    this.i18n = i18nInstance;
  }

  getCurrentLanguage() {
    return this.i18n?.language || 'en';
  }
}

/**
 * Region Service Class
 * Follows Single Responsibility and Open/Closed principles
 */
export class RegionService {
  constructor(languageDetector = new DefaultLanguageDetector()) {
    this.languageDetector = languageDetector;
    this.regions = UZBEKISTAN_REGIONS;
  }

  /**
   * Get all regions with localized names
   * @returns {Array} Array of regions with current language names
   */
  getAllRegions() {
    const currentLang = this.languageDetector.getCurrentLanguage();
    return this.regions.map(region => ({
      ...region,
      displayName: region.names[currentLang] || region.names.en
    }));
  }

  /**
   * Get region by ID
   * @param {string} regionId - Unique region identifier
   * @returns {Object|null} Region object or null if not found
   */
  getRegionById(regionId) {
    const region = this.regions.find(r => r.id === regionId);
    if (!region) return null;

    const currentLang = this.languageDetector.getCurrentLanguage();
    return {
      ...region,
      displayName: region.names[currentLang] || region.names.en
    };
  }

  /**
   * Get default region (Tashkent)
   * @returns {Object} Default region configuration
   */
  getDefaultRegion() {
    const defaultRegion = this.regions.find(r => r.isDefault);
    const currentLang = this.languageDetector.getCurrentLanguage();
    
    return {
      ...defaultRegion,
      displayName: defaultRegion.names[currentLang] || defaultRegion.names.en
    };
  }

  /**
   * Get default map configuration
   * @returns {Object} Default map configuration
   */
  getDefaultMapConfig() {
    return { ...DEFAULT_MAP_CONFIG };
  }

  /**
   * Search regions by name
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered regions matching the search term
   */
  searchRegions(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.getAllRegions();
    }

    const currentLang = this.languageDetector.getCurrentLanguage();
    const term = searchTerm.toLowerCase().trim();

    return this.regions
      .filter(region => {
        // Search in all language variants
        return Object.values(region.names).some(name => 
          name.toLowerCase().includes(term)
        );
      })
      .map(region => ({
        ...region,
        displayName: region.names[currentLang] || region.names.en
      }));
  }

  /**
   * Get regions sorted by name in current language
   * @returns {Array} Sorted regions array
   */
  getRegionsSorted() {
    const regions = this.getAllRegions();
    return regions.sort((a, b) => {
      // Put default region first
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      
      // Then sort alphabetically by display name
      return a.displayName.localeCompare(b.displayName);
    });
  }

  /**
   * Get map configuration for a specific region
   * @param {string} regionId - Region identifier
   * @param {string} zoomLevel - Zoom level type ('CITY', 'REGION', 'COUNTRY')
   * @returns {Object|null} Map configuration or null if region not found
   */
  getMapConfigForRegion(regionId, zoomLevel = 'CITY') {
    const region = this.getRegionById(regionId);
    if (!region) return null;

    return {
      center: region.coordinates,
      zoom: MAP_ZOOM_LEVELS[zoomLevel] || MAP_ZOOM_LEVELS.CITY,
      regionId: region.id
    };
  }

  /**
   * Check if coordinates are within a specific region
   * Uses approximate bounds based on region center and radius
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} regionId - Region ID to check against
   * @returns {boolean} True if coordinates are within the region
   */
  isWithinRegion(lat, lng, regionId) {
    const region = this.getRegionById(regionId);
    if (!region) return false;

    // Calculate distance from region center
    const distance = this.calculateDistance(
      lat, lng,
      region.coordinates.lat, region.coordinates.lng
    );

    // Use different radius thresholds based on region type
    // These are approximate values in kilometers
    const regionRadius = this.getRegionRadius(regionId);
    
    return distance <= regionRadius;
  }

  /**
   * Get approximate radius for a region in kilometers
   * @param {string} regionId - Region ID
   * @returns {number} Radius in kilometers
   */
  getRegionRadius(regionId) {
    // Default radius for regions/provinces (approximate coverage area)
    const defaultRadius = 100; // km
    
    // Special cases for specific regions
    const regionRadii = {
      'tashkent-city': 50,      // Smaller for city
      'tashkent-region': 120,   // Larger for region around capital
      'samarkand-region': 110,  // Major historical region
      'bukhara-region': 130,    // Large desert region
      'navoi-region': 150,      // Very large mining region
      'kashkadarya-region': 120, // Large southern region
      // Add more specific radii as needed
    };

    return regionRadii[regionId] || defaultRadius;
  }

  /**
   * Get approximate bounds for a region
   * @param {string} regionId - Region ID
   * @returns {Object|null} Bounds object with north, south, east, west or null
   */
  getRegionBounds(regionId) {
    const region = this.getRegionById(regionId);
    if (!region) return null;

    const radius = this.getRegionRadius(regionId);
    
    // Convert radius to approximate lat/lng degrees
    // 1 degree latitude ≈ 111 km
    // 1 degree longitude ≈ 111 km * cos(latitude)
    const latOffset = radius / 111;
    const lngOffset = radius / (111 * Math.cos(region.coordinates.lat * Math.PI / 180));

    return {
      north: region.coordinates.lat + latOffset,
      south: region.coordinates.lat - latOffset,
      east: region.coordinates.lng + lngOffset,
      west: region.coordinates.lng - lngOffset,
      center: region.coordinates,
      radius: radius
    };
  }

  /**
   * Validate if coordinates are within Uzbekistan bounds (approximate)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} True if coordinates are within Uzbekistan
   */
  isWithinUzbekistanBounds(lat, lng) {
    // Approximate bounds of Uzbekistan
    const bounds = {
      north: 45.6,
      south: 37.0,
      east: 73.2,
      west: 55.9
    };

    return lat >= bounds.south && 
           lat <= bounds.north && 
           lng >= bounds.west && 
           lng <= bounds.east;
  }

  /**
   * Find the nearest region to given coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object|null} Nearest region or null if coordinates are outside Uzbekistan
   */
  findNearestRegion(lat, lng) {
    if (!this.isWithinUzbekistanBounds(lat, lng)) {
      return null;
    }

    let nearestRegion = null;
    let minDistance = Infinity;

    this.regions.forEach(region => {
      const distance = this.calculateDistance(
        lat, lng, 
        region.coordinates.lat, 
        region.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = region;
      }
    });

    if (nearestRegion) {
      const currentLang = this.languageDetector.getCurrentLanguage();
      return {
        ...nearestRegion,
        displayName: nearestRegion.names[currentLang] || nearestRegion.names.en,
        distance: minDistance
      };
    }

    return null;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - First latitude
   * @param {number} lng1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lng2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees to convert
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Factory function to create RegionService with i18n integration
 * Follows Dependency Injection pattern
 * @param {Object} i18nInstance - i18n instance
 * @returns {RegionService} Configured RegionService instance
 */
export function createRegionService(i18nInstance = null) {
  const languageDetector = i18nInstance 
    ? new I18nLanguageDetector(i18nInstance)
    : new DefaultLanguageDetector();
    
  return new RegionService(languageDetector);
}

// Export default service instance
export default new RegionService();
