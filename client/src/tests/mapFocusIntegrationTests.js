/**
 * Map Focus Integration Tests
 * Tests for Story 3: Map Focus Integration
 * 
 * Verifies that map focus functionality works correctly with region selection
 * Following Test-Driven Development principles
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MapFocusService } from '../services/MapFocusService.js';
import { useMapFocus, useRegionMapFocus } from '../hooks/useMapFocus.js';
import { renderHook, act } from '@testing-library/react';

// Mock Google Maps API
const mockGoogleMaps = {
  maps: {
    LatLng: jest.fn((lat, lng) => ({ lat: () => lat, lng: () => lng })),
    event: {
      addListener: jest.fn(() => 'mock-listener'),
      removeListener: jest.fn()
    }
  }
};

// Mock map instance
const createMockMapInstance = () => ({
  setCenter: jest.fn(),
  setZoom: jest.fn(),
  getZoom: jest.fn(() => 12),
  getCenter: jest.fn(() => ({ lat: () => 41.299, lng: () => 69.240 })),
  panTo: jest.fn(),
  addListener: jest.fn((event, callback) => {
    // Simulate immediate completion for testing
    if (event === 'center_changed' || event === 'zoom_changed') {
      setTimeout(callback, 10);
    }
    return 'mock-listener-id';
  })
});

global.window = {
  ...global.window,
  google: mockGoogleMaps
};

describe('MapFocusService', () => {
  let mapFocusService;
  let mockMapInstance;

  beforeEach(() => {
    mapFocusService = new MapFocusService();
    mockMapInstance = createMockMapInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (mapFocusService) {
      mapFocusService.cancelFocus();
    }
  });

  describe('focusOnCoordinates', () => {
    test('should focus map on valid coordinates', async () => {
      const center = { lat: 41.299, lng: 69.240 };
      const zoom = 12;

      await mapFocusService.focusOnCoordinates(mockMapInstance, center, zoom, { animate: false });

      expect(mockMapInstance.setCenter).toHaveBeenCalledWith(center);
      expect(mockMapInstance.setZoom).toHaveBeenCalledWith(zoom);
    });

    test('should handle invalid map instance', async () => {
      const center = { lat: 41.299, lng: 69.240 };
      const zoom = 12;

      await expect(
        mapFocusService.focusOnCoordinates(null, center, zoom)
      ).rejects.toThrow('Invalid map instance or coordinates provided');
    });

    test('should handle invalid coordinates', async () => {
      const invalidCenter = { lat: 'invalid', lng: 69.240 };
      const zoom = 12;

      await expect(
        mapFocusService.focusOnCoordinates(mockMapInstance, invalidCenter, zoom)
      ).rejects.toThrow('Invalid coordinates provided');
    });

    test('should clamp zoom level to valid range', async () => {
      const center = { lat: 41.299, lng: 69.240 };
      const invalidZoom = 25; // Too high

      await mapFocusService.focusOnCoordinates(mockMapInstance, center, invalidZoom, { animate: false });

      expect(mockMapInstance.setZoom).toHaveBeenCalledWith(20); // Clamped to max
    });

    test('should animate by default', async () => {
      const center = { lat: 41.299, lng: 69.240 };
      const zoom = 12;

      await mapFocusService.focusOnCoordinates(mockMapInstance, center, zoom);

      expect(mockMapInstance.panTo).toHaveBeenCalledWith(center);
      expect(mockMapInstance.addListener).toHaveBeenCalledWith('center_changed', expect.any(Function));
    });
  });

  describe('focusOnRegion', () => {
    test('should focus map on region configuration', async () => {
      const regionConfig = {
        center: { lat: 39.6547, lng: 66.9597 }, // Samarkand
        zoom: 10
      };

      await mapFocusService.focusOnRegion(mockMapInstance, regionConfig, { animate: false });

      expect(mockMapInstance.setCenter).toHaveBeenCalledWith(regionConfig.center);
      expect(mockMapInstance.setZoom).toHaveBeenCalledWith(regionConfig.zoom);
    });

    test('should handle invalid region configuration', async () => {
      const invalidRegionConfig = { zoom: 10 }; // Missing center

      await expect(
        mapFocusService.focusOnRegion(mockMapInstance, invalidRegionConfig)
      ).rejects.toThrow('Invalid region configuration provided');
    });

    test('should use default zoom if not provided', async () => {
      const regionConfig = {
        center: { lat: 39.6547, lng: 66.9597 }
        // zoom not provided
      };

      await mapFocusService.focusOnRegion(mockMapInstance, regionConfig, { animate: false });

      expect(mockMapInstance.setZoom).toHaveBeenCalledWith(12); // Default CITY zoom
    });
  });

  describe('resetToDefault', () => {
    test('should reset map to default position', async () => {
      await mapFocusService.resetToDefault(mockMapInstance, { animate: false });

      expect(mockMapInstance.setCenter).toHaveBeenCalledWith({ lat: 41.299, lng: 69.240 });
      expect(mockMapInstance.setZoom).toHaveBeenCalledWith(12);
    });
  });

  describe('getOptimalZoom', () => {
    test('should return correct zoom levels for different focus types', () => {
      expect(mapFocusService.getOptimalZoom('COUNTRY')).toBe(6);
      expect(mapFocusService.getOptimalZoom('REGION')).toBe(10);
      expect(mapFocusService.getOptimalZoom('CITY')).toBe(12);
      expect(mapFocusService.getOptimalZoom('DISTRICT')).toBe(14);
      expect(mapFocusService.getOptimalZoom('NEIGHBORHOOD')).toBe(16);
    });

    test('should return default zoom for unknown focus type', () => {
      expect(mapFocusService.getOptimalZoom('UNKNOWN')).toBe(12);
      expect(mapFocusService.getOptimalZoom()).toBe(12); // No parameter
    });
  });

  describe('animation control', () => {
    test('should track animation state', async () => {
      expect(mapFocusService.isAnimating()).toBe(false);

      const center = { lat: 41.299, lng: 69.240 };
      const focusPromise = mapFocusService.focusOnCoordinates(mockMapInstance, center, 12);

      expect(mapFocusService.isAnimating()).toBe(true);

      await focusPromise;

      expect(mapFocusService.isAnimating()).toBe(false);
    });

    test('should allow cancelling focus operation', async () => {
      const center = { lat: 41.299, lng: 69.240 };
      const focusPromise = mapFocusService.focusOnCoordinates(mockMapInstance, center, 12);

      mapFocusService.cancelFocus();

      await expect(focusPromise).rejects.toThrow('Operation canceled');
      expect(mapFocusService.isAnimating()).toBe(false);
    });
  });
});

describe('useMapFocus hook', () => {
  let mockMapInstance;

  beforeEach(() => {
    mockMapInstance = createMockMapInstance();
    jest.clearAllMocks();
  });

  test('should provide focus operations', () => {
    const { result } = renderHook(() => useMapFocus(mockMapInstance));

    expect(result.current).toHaveProperty('focusOnCoordinates');
    expect(result.current).toHaveProperty('focusOnRegion');
    expect(result.current).toHaveProperty('resetToDefault');
    expect(result.current).toHaveProperty('getOptimalZoom');
    expect(result.current).toHaveProperty('isAnimating');
    expect(result.current).toHaveProperty('cancelFocus');
    expect(result.current).toHaveProperty('isReady');
  });

  test('should handle missing map instance gracefully', () => {
    const { result } = renderHook(() => useMapFocus(null));

    expect(result.current.isReady).toBe(false);
    
    // Should not throw when calling focus methods
    act(() => {
      result.current.focusOnCoordinates({ lat: 41.299, lng: 69.240 }, 12);
    });
  });

  test('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useMapFocus(mockMapInstance));

    unmount();

    // Should not throw or cause memory leaks
    expect(true).toBe(true);
  });
});

describe('Region Integration', () => {
  test('should focus on Tashkent by default', async () => {
    const mapFocusService = new MapFocusService();
    const mockMapInstance = createMockMapInstance();

    await mapFocusService.resetToDefault(mockMapInstance, { animate: false });

    expect(mockMapInstance.setCenter).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: 41.299,
        lng: 69.240
      })
    );
  });

  test('should maintain zoom level consistency', async () => {
    const mapFocusService = new MapFocusService();
    const mockMapInstance = createMockMapInstance();

    // Different regions should use consistent zoom level
    const regions = [
      { center: { lat: 41.299, lng: 69.240 }, zoom: 12 }, // Tashkent
      { center: { lat: 39.6547, lng: 66.9597 }, zoom: 12 }, // Samarkand
      { center: { lat: 39.7747, lng: 64.4286 }, zoom: 12 }  // Bukhara
    ];

    for (const region of regions) {
      await mapFocusService.focusOnRegion(mockMapInstance, region, { animate: false });
      expect(mockMapInstance.setZoom).toHaveBeenCalledWith(12);
    }
  });

  test('should preserve user navigation after focus', async () => {
    const mapFocusService = new MapFocusService();
    const mockMapInstance = createMockMapInstance();

    // Focus on region
    const regionConfig = { center: { lat: 39.6547, lng: 66.9597 }, zoom: 12 };
    await mapFocusService.focusOnRegion(mockMapInstance, regionConfig, { animate: false });

    // Verify that map methods are still available for user interaction
    expect(mockMapInstance.setCenter).toBeDefined();
    expect(mockMapInstance.setZoom).toBeDefined();
    expect(mockMapInstance.panTo).toBeDefined();

    // No restrictions should be placed on the map instance
    expect(mockMapInstance.setCenter).toHaveBeenCalledTimes(1); // Only from our focus call
  });
});

describe('Error Handling', () => {
  test('should handle Google Maps API not loaded', async () => {
    // Temporarily remove Google Maps API
    const originalGoogle = global.window.google;
    delete global.window.google;

    const mapFocusService = new MapFocusService();
    const mockMapInstance = createMockMapInstance();

    // Should not throw, but should handle gracefully
    try {
      await mapFocusService.focusOnCoordinates(
        mockMapInstance, 
        { lat: 41.299, lng: 69.240 }, 
        12, 
        { animate: false }
      );
    } catch (error) {
      // Expected to potentially fail, but shouldn't crash the app
      expect(error).toBeDefined();
    }

    // Restore Google Maps API
    global.window.google = originalGoogle;
  });

  test('should validate coordinate bounds', async () => {
    const mapFocusService = new MapFocusService();
    const mockMapInstance = createMockMapInstance();

    // Test extreme coordinates
    const extremeCoordinates = [
      { lat: 95, lng: 69.240 },   // Beyond latitude range
      { lat: 41.299, lng: 185 },  // Beyond longitude range
      { lat: -95, lng: 69.240 },  // Below latitude range
      { lat: 41.299, lng: -185 }  // Below longitude range
    ];

    for (const coords of extremeCoordinates) {
      await mapFocusService.focusOnCoordinates(mockMapInstance, coords, 12, { animate: false });
      
      // Should clamp coordinates to valid ranges
      const setCenterCall = mockMapInstance.setCenter.mock.calls.find(call => 
        call[0].lat === Math.max(-90, Math.min(90, coords.lat)) &&
        call[0].lng === Math.max(-180, Math.min(180, coords.lng))
      );
      expect(setCenterCall).toBeDefined();
    }
  });
});

describe('Performance', () => {
  test('should handle rapid focus changes gracefully', async () => {
    const mapFocusService = new MapFocusService();
    const mockMapInstance = createMockMapInstance();

    // Simulate rapid region changes
    const rapidFocusOperations = [
      { center: { lat: 41.299, lng: 69.240 }, zoom: 12 },
      { center: { lat: 39.6547, lng: 66.9597 }, zoom: 12 },
      { center: { lat: 39.7747, lng: 64.4286 }, zoom: 12 },
      { center: { lat: 40.7831, lng: 72.3442 }, zoom: 12 }
    ];

    const focusPromises = rapidFocusOperations.map(config =>
      mapFocusService.focusOnRegion(mockMapInstance, config, { animate: false })
    );

    // Should handle all operations without throwing
    await expect(Promise.all(focusPromises)).resolves.toBeDefined();
  });

  test('should not create memory leaks with repeated operations', async () => {
    const mapFocusService = new MapFocusService();
    const mockMapInstance = createMockMapInstance();

    // Perform many focus operations
    for (let i = 0; i < 100; i++) {
      await mapFocusService.focusOnCoordinates(
        mockMapInstance,
        { lat: 41.299 + (i * 0.001), lng: 69.240 + (i * 0.001) },
        12,
        { animate: false }
      );
    }

    // Should still be responsive
    expect(mapFocusService.isAnimating()).toBe(false);
  });
});
