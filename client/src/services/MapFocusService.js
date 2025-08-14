import { DEFAULT_MAP_CONFIG, MAP_ZOOM_LEVELS } from '../utils/regionConstants.js';

/**
 * Map focus configuration
 * @typedef {Object} MapFocusConfig
 * @property {Object} center - Map center coordinates
 * @property {number} center.lat - Latitude
 * @property {number} center.lng - Longitude
 * @property {number} zoom - Zoom level
 */

/**
 * Focus options
 * @typedef {Object} FocusOptions
 * @property {number} duration - Animation duration in milliseconds
 * @property {boolean} smooth - Whether to use smooth animation
 */

/**
 * Map Focus Service
 * Follows Single Responsibility Principle - only handles map focusing operations
 * Implements Interface Segregation Principle - provides specific focus functionality
 * Optimized for performance and memory management
 */
class MapFocusService {
  constructor() {
    // Performance optimization: Track active animations
    this.activeAnimations = new Set();
    this.animationFrameIds = new Map();
  }

  /**
   * Cancel all active animations to prevent memory leaks
   */
  cancelAllAnimations() {
    this.animationFrameIds.forEach((frameId) => {
      cancelAnimationFrame(frameId);
    });
    this.animationFrameIds.clear();
    this.activeAnimations.clear();
  }

  /**
   * Focus map on coordinates with smooth transition and performance optimization
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {Object} center - Center coordinates
   * @param {number} center.lat - Latitude
   * @param {number} center.lng - Longitude
   * @param {number} zoom - Zoom level
   * @param {FocusOptions} options - Focus options
   * @returns {Promise<void>} Promise that resolves when focus is complete
   */
  async focusOnCoordinates(mapInstance, center, zoom, options = {}) {
    if (!mapInstance || !center || typeof zoom !== 'number') {
      throw new Error('Invalid parameters for map focus');
    }

    const { duration = 1000, smooth = true } = options;
    
    // Performance optimization: Cancel previous animation for this map
    this.cancelAllAnimations();

    return new Promise((resolve) => {
      if (smooth) {
        this._smoothTransition(mapInstance, center, zoom, duration, resolve);
      } else {
        mapInstance.setCenter(center);
        mapInstance.setZoom(zoom);
        resolve();
      }
    });
  }

  /**
   * Focus map on region with appropriate zoom level
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {Object} regionData - Region object or map config object
   * @param {Object} regionData.coordinates - Region coordinates (if region object)
   * @param {Object} regionData.center - Map center (if map config object)
   * @param {number} regionData.zoom - Zoom level (if map config object)
   * @param {FocusOptions} options - Focus options
   * @returns {Promise<void>} Promise that resolves when focus is complete
   */
  async focusOnRegion(mapInstance, regionData, options = {}) {
    if (!regionData) {
      throw new Error('Invalid region data for map focus');
    }

    // Handle both region object (with coordinates) and map config object (with center/zoom)
    let center, zoom;
    
    if (regionData.coordinates) {
      // Region object format
      center = regionData.coordinates;
      zoom = MAP_ZOOM_LEVELS.REGION;
    } else if (regionData.center) {
      // Map config object format
      center = regionData.center;
      zoom = regionData.zoom || MAP_ZOOM_LEVELS.REGION;
    } else {
      throw new Error('Invalid region data for map focus');
    }

    return this.focusOnCoordinates(
      mapInstance,
      center,
      zoom,
      options
    );
  }

  /**
   * Focus map on place with appropriate zoom level
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {Object} place - Place object with coordinates
   * @param {number} place.lat - Latitude
   * @param {number} place.lng - Longitude
   * @param {FocusOptions} options - Focus options
   * @returns {Promise<void>} Promise that resolves when focus is complete
   */
  async focusOnPlace(mapInstance, place, options = {}) {
    if (!place?.lat || !place?.lng) {
      throw new Error('Invalid place data for map focus');
    }

    const zoom = MAP_ZOOM_LEVELS.CITY;
    return this.focusOnCoordinates(
      mapInstance,
      { lat: place.lat, lng: place.lng },
      zoom,
      options
    );
  }

  /**
   * Reset map to default position (Tashkent)
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {FocusOptions} options - Focus options
   * @returns {Promise<void>} Promise that resolves when reset is complete
   */
  async resetToDefault(mapInstance, options = {}) {
    const defaultCenter = DEFAULT_MAP_CONFIG.center;
    const defaultZoom = DEFAULT_MAP_CONFIG.zoom;

    return this.focusOnCoordinates(mapInstance, defaultCenter, defaultZoom, options);
  }

  /**
   * Focus map on bounds with padding
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {google.maps.LatLngBounds} bounds - Bounds to focus on
   * @param {number} padding - Padding in pixels
   * @returns {Promise<void>} Promise that resolves when focus is complete
   */
  async focusOnBounds(mapInstance, bounds, padding = 50) {
    if (!mapInstance || !bounds) {
      throw new Error('Invalid parameters for bounds focus');
    }

    return new Promise((resolve) => {
      mapInstance.fitBounds(bounds, padding);
      setTimeout(resolve, 500); // Allow time for bounds fitting
    });
  }

  /**
   * Get current map bounds
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @returns {google.maps.LatLngBounds|null} Current map bounds
   */
  getCurrentBounds(mapInstance) {
    if (!mapInstance) {
      return null;
    }

    return mapInstance.getBounds();
  }

  /**
   * Check if coordinates are within current map bounds
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {Object} coordinates - Coordinates to check
   * @param {number} coordinates.lat - Latitude
   * @param {number} coordinates.lng - Longitude
   * @returns {boolean} True if coordinates are within bounds
   */
  isWithinBounds(mapInstance, coordinates) {
    const bounds = this.getCurrentBounds(mapInstance);
    if (!bounds || !coordinates) {
      return false;
    }

    const latLng = new google.maps.LatLng(coordinates.lat, coordinates.lng);
    return bounds.contains(latLng);
  }

  /**
   * Smooth transition to new position with memory leak prevention
   * @private
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {Object} center - Target center coordinates
   * @param {number} zoom - Target zoom level
   * @param {number} duration - Animation duration in milliseconds
   * @param {Function} callback - Callback when animation completes
   */
  _smoothTransition(mapInstance, center, zoom, duration, callback) {
    const startCenter = mapInstance.getCenter();
    const startZoom = mapInstance.getZoom();
    const startTime = Date.now();
    const animationId = Symbol('animation');
    
    // Track this animation
    this.activeAnimations.add(animationId);

    const animate = () => {
      // Check if animation was cancelled
      if (!this.activeAnimations.has(animationId)) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Performance optimization: Use cubic easing for smoother animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate position with boundary checks
      const currentLat = startCenter.lat() + (center.lat - startCenter.lat()) * easeProgress;
      const currentLng = startCenter.lng() + (center.lng - startCenter.lng()) * easeProgress;
      const currentZoom = startZoom + (zoom - startZoom) * easeProgress;

      // Performance optimization: Only update if values changed significantly
      const latDiff = Math.abs(mapInstance.getCenter().lat() - currentLat);
      const lngDiff = Math.abs(mapInstance.getCenter().lng() - currentLng);
      const zoomDiff = Math.abs(mapInstance.getZoom() - currentZoom);

      if (latDiff > 0.00001 || lngDiff > 0.00001 || zoomDiff > 0.01) {
        mapInstance.setCenter({ lat: currentLat, lng: currentLng });
        mapInstance.setZoom(currentZoom);
      }

      if (progress < 1) {
        const frameId = requestAnimationFrame(animate);
        this.animationFrameIds.set(animationId, frameId);
      } else {
        // Cleanup
        this.activeAnimations.delete(animationId);
        this.animationFrameIds.delete(animationId);
        callback();
      }
    };

    const frameId = requestAnimationFrame(animate);
    this.animationFrameIds.set(animationId, frameId);
  }

  /**
   * Calculate distance between two coordinates in kilometers
   * @param {Object} coord1 - First coordinate
   * @param {number} coord1.lat - Latitude
   * @param {number} coord1.lng - Longitude
   * @param {Object} coord2 - Second coordinate
   * @param {number} coord2.lat - Latitude
   * @param {number} coord2.lng - Longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) {
      return 0;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this._toRadians(coord2.lat - coord1.lat);
    const dLng = this._toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this._toRadians(coord1.lat)) * Math.cos(this._toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @private
   * @param {number} degrees - Degrees to convert
   * @returns {number} Radians
   */
  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get appropriate zoom level based on distance
   * @param {number} distance - Distance in kilometers
   * @returns {number} Appropriate zoom level
   */
  getZoomForDistance(distance) {
    if (distance < 1) return MAP_ZOOM_LEVELS.CITY;
    if (distance < 5) return MAP_ZOOM_LEVELS.CITY;
    if (distance < 20) return MAP_ZOOM_LEVELS.CITY;
    if (distance < 100) return MAP_ZOOM_LEVELS.REGION;
    return MAP_ZOOM_LEVELS.COUNTRY;
  }

  /**
   * Focus map to show multiple places
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {Array} places - Array of place objects with lat/lng
   * @param {number} padding - Padding in pixels
   * @returns {Promise<void>} Promise that resolves when focus is complete
   */
  async focusOnMultiplePlaces(mapInstance, places, padding = 50) {
    if (!places || places.length === 0) {
      return this.resetToDefault(mapInstance);
    }

    if (places.length === 1) {
      return this.focusOnPlace(mapInstance, places[0]);
    }

    const bounds = new google.maps.LatLngBounds();
    places.forEach(place => {
      if (place.lat && place.lng) {
        bounds.extend(new google.maps.LatLng(place.lat, place.lng));
      }
    });

    return this.focusOnBounds(mapInstance, bounds, padding);
  }

  /**
   * Validate map focus parameters
   * @param {google.maps.Map} mapInstance - Google Maps instance
   * @param {Object} center - Center coordinates
   * @param {number} zoom - Zoom level
   * @returns {boolean} True if parameters are valid
   */
  validateFocusParameters(mapInstance, center, zoom) {
    return !!(
      mapInstance &&
      center &&
      typeof center.lat === 'number' &&
      typeof center.lng === 'number' &&
      typeof zoom === 'number' &&
      zoom >= 1 &&
      zoom <= 20
    );
  }
}

// Export singleton instance
const mapFocusService = new MapFocusService();
export default mapFocusService;
