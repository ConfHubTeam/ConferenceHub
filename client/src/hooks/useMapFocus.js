/**
 * React Hook for Map Focus Integration
 * Follows Single Responsibility Principle - only handles map focus operations
 * Integrates MapFocusService with React component lifecycle
 * Optimized for performance with debouncing and cancellation support
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import mapFocusService from '../services/MapFocusService.js';

/**
 * Custom hook for map focus functionality with performance optimizations
 * @param {google.maps.Map|null} mapInstance - Google Maps instance
 * @returns {Object} Map focus operations
 */
export function useMapFocus(mapInstance) {
  // Use the singleton service directly
  const focusService = mapFocusService;
  
  // Performance optimization: Track active focus operations
  const activeOperationRef = useRef(null);
  const lastFocusRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Cleanup function to cancel active operations
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (activeOperationRef.current) {
      activeOperationRef.current.cancelled = true;
      activeOperationRef.current = null;
    }
  }, []);

  // Cleanup on unmount or mapInstance change
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Performance optimization: Debounced focus operation
  const debouncedFocus = useCallback((operation, delay = 100) => {
    cleanup();
    
    return new Promise((resolve, reject) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        if (!mapInstance) {
          reject(new Error('Map instance not available'));
          return;
        }

        const operationId = { cancelled: false };
        activeOperationRef.current = operationId;

        try {
          await operation();
          if (!operationId.cancelled) {
            resolve();
          }
        } catch (error) {
          if (!operationId.cancelled) {
            reject(error);
          }
        } finally {
          if (activeOperationRef.current === operationId) {
            activeOperationRef.current = null;
          }
        }
      }, delay);
    });
  }, [mapInstance, cleanup]);

  /**
   * Focus map on specific coordinates with performance optimization
   * @param {Object} center - Target coordinates
   * @param {number} center.lat - Latitude
   * @param {number} center.lng - Longitude
   * @param {number} zoom - Target zoom level
   * @param {Object} options - Focus options
   * @returns {Promise<void>}
   */
  const focusOnCoordinates = useCallback(async (center, zoom, options = {}) => {
    if (!mapInstance) {
      console.warn('Map instance not available for focusing');
      return;
    }

    // Performance optimization: Skip if same as last focus
    const focusKey = `${center.lat},${center.lng},${zoom}`;
    if (lastFocusRef.current === focusKey && !options.force) {
      return;
    }

    try {
      await debouncedFocus(async () => {
        await focusService.focusOnCoordinates(mapInstance, center, zoom, options);
        lastFocusRef.current = focusKey;
      }, options.debounce ? 150 : 0);
    } catch (error) {
      console.error('Error focusing on coordinates:', error);
    }
  }, [mapInstance, debouncedFocus]);

  /**
   * Focus map on region using region configuration with performance optimization
   * @param {Object} regionConfig - Region configuration from RegionService
   * @param {Object} options - Focus options
   * @returns {Promise<void>}
   */
  const focusOnRegion = useCallback(async (regionConfig, options = {}) => {
    if (!mapInstance) {
      console.warn('Map instance not available for focusing');
      return;
    }

    // Performance optimization: Skip if same region
    const regionKey = regionConfig ? JSON.stringify({ 
      center: regionConfig.center, 
      zoom: regionConfig.zoom 
    }) : 'null';
    
    if (lastFocusRef.current === regionKey && !options.force) {
      return;
    }

    try {
      await debouncedFocus(async () => {
        await focusService.focusOnRegion(mapInstance, regionConfig, options);
        lastFocusRef.current = regionKey;
      }, options.debounce ? 150 : 0);
    } catch (error) {
      console.error('Error focusing on region:', error);
    }
  }, [mapInstance, debouncedFocus]);

  /**
   * Reset map to default view with performance optimization
   * @param {Object} options - Focus options
   * @returns {Promise<void>}
   */
  const resetToDefault = useCallback(async (options = {}) => {
    if (!mapInstance) {
      console.warn('Map instance not available for resetting');
      return;
    }

    try {
      await debouncedFocus(async () => {
        await focusService.resetToDefault(mapInstance, options);
        lastFocusRef.current = 'default';
      }, options.debounce ? 150 : 0);
    } catch (error) {
      console.error('Error resetting map to default:', error);
    }
  }, [mapInstance, debouncedFocus]);

  /**
   * Focus map on place with appropriate zoom level and performance optimization
   * @param {Object} place - Place object with coordinates
   * @param {number} place.lat - Latitude
   * @param {number} place.lng - Longitude
   * @param {Object} options - Focus options
   * @returns {Promise<void>}
   */
  const focusOnPlace = useCallback(async (place, options = {}) => {
    if (!mapInstance) {
      console.warn('Map instance not available for focusing');
      return;
    }

    const placeKey = `place_${place.lat},${place.lng}`;
    if (lastFocusRef.current === placeKey && !options.force) {
      return;
    }

    try {
      await debouncedFocus(async () => {
        await focusService.focusOnPlace(mapInstance, place, options);
        lastFocusRef.current = placeKey;
      }, options.debounce ? 150 : 0);
    } catch (error) {
      console.error('Error focusing on place:', error);
    }
  }, [mapInstance, debouncedFocus]);

  /**
   * Focus map to show multiple places with performance optimization
   * @param {Array} places - Array of place objects with lat/lng
   * @param {number} padding - Padding in pixels
   * @returns {Promise<void>}
   */
  const focusOnMultiplePlaces = useCallback(async (places, padding = 50) => {
    if (!mapInstance) {
      console.warn('Map instance not available for focusing');
      return;
    }

    // Performance optimization: Skip if same places array
    const placesKey = `multiple_${places.length}_${padding}_${places.map(p => `${p.lat},${p.lng}`).join(';')}`;
    if (lastFocusRef.current === placesKey) {
      return;
    }

    try {
      await debouncedFocus(async () => {
        await focusService.focusOnMultiplePlaces(mapInstance, places, padding);
        lastFocusRef.current = placesKey;
      }, 100);
    } catch (error) {
      console.error('Error focusing on multiple places:', error);
    }
  }, [mapInstance, debouncedFocus]);

  return {
    focusOnCoordinates,
    focusOnRegion,
    focusOnPlace,
    focusOnMultiplePlaces,
    resetToDefault,
    isReady: !!mapInstance
  };
}

/**
 * Hook that combines region management with map focus
 * @param {google.maps.Map|null} mapInstance - Google Maps instance
 * @returns {Object} Combined region and focus operations
 */
export function useRegionMapFocus(mapInstance) {
  const { 
    selectedRegion, 
    selectRegion, 
    resetToDefault: resetRegionToDefault,
    clearSelection,
    getMapConfig 
  } = useRegions();
  
  const {
    focusOnRegion,
    focusOnCoordinates,
    focusOnPlace,
    focusOnMultiplePlaces,
    resetToDefault: resetMapToDefault,
    isReady
  } = useMapFocus(mapInstance);

  /**
   * Select region and focus map on it
   * @param {string|null} regionId - Region ID to select
   * @param {Object} options - Focus options
   * @returns {Promise<void>}
   */
  const selectRegionAndFocus = useCallback(async (regionId, options = {}) => {
    if (!isReady) {
      console.warn('Map focus not ready');
      return;
    }

    // Select the region first
    selectRegion(regionId);

    if (regionId === null || regionId === '') {
      // If clearing selection, reset to default
      await resetMapToDefault(options);
      return;
    }

    // Get map config for the selected region
    const mapConfig = getMapConfig('CITY');
    if (mapConfig) {
      await focusOnRegion(mapConfig, options);
    }
  }, [selectRegion, getMapConfig, focusOnRegion, resetMapToDefault, isReady]);

  /**
   * Reset both region selection and map to default
   * @param {Object} options - Focus options
   * @returns {Promise<void>}
   */
  const resetToDefault = useCallback(async (options = {}) => {
    resetRegionToDefault();
    await resetMapToDefault(options);
  }, [resetRegionToDefault, resetMapToDefault]);

  /**
   * Clear region selection and reset map
   * @param {Object} options - Focus options
   * @returns {Promise<void>}
   */
  const clearSelectionAndReset = useCallback(async (options = {}) => {
    clearSelection();
    await resetMapToDefault(options);
  }, [clearSelection, resetMapToDefault]);

  // Auto-focus when selectedRegion changes (if not caused by user interaction)
  useEffect(() => {
    if (selectedRegion && isReady) {
      const mapConfig = getMapConfig('CITY');
      if (mapConfig) {
        focusOnRegion(mapConfig, { animate: true });
      }
    }
  }, [selectedRegion, isReady, getMapConfig, focusOnRegion]);

  return {
    // Region state
    selectedRegion,
    
    // Combined operations
    selectRegionAndFocus,
    resetToDefault,
    clearSelectionAndReset,
    
    // Direct focus operations
    focusOnCoordinates,
    focusOnRegion,
    focusOnPlace,
    focusOnMultiplePlaces,
    
    // Status
    isReady
  };
}

// Import useRegions here to avoid circular dependency
import { useRegions } from './useRegions.js';

export default useMapFocus;
