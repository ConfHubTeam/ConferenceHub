import { useEffect, useRef } from "react";

/**
 * Custom hook to handle touch events for map interactions
 * Prevents page zoom while allowing map gestures
 */
export const useMapTouchHandler = () => {
  const mapContainerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 });
  const isMapGestureRef = useRef(false);

  useEffect(() => {
    let touchTimeout;

    const getTouchDistance = (touches) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e) => {
      const mapContainer = mapContainerRef.current;
      if (!mapContainer || !mapContainer.contains(e.target)) {
        isMapGestureRef.current = false;
        return;
      }

      // Check if this is a map-related touch and not on header elements
      const isHeaderTouch = e.target.closest(".fixed.top-0") !== null;
      const isMapTouch = e.target.closest(".map-container") !== null;
      
      // Don't capture touch events from the header or filter row
      if (isHeaderTouch) {
        isMapGestureRef.current = false;
        return;
      }
      
      isMapGestureRef.current = isMapTouch;

      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          distance: 0
        };
      } else if (e.touches.length === 2 && isMapTouch) {
        // This is a pinch gesture on the map
        touchStartRef.current.distance = getTouchDistance(e.touches);
        // Prevent page zoom for two-finger gestures on map
        e.preventDefault();
      }
    };

    const handleTouchMove = (e) => {
      if (!isMapGestureRef.current) return;

      const mapContainer = mapContainerRef.current;
      if (!mapContainer || !mapContainer.contains(e.target)) return;

      if (e.touches.length === 2) {
        // This is a two-finger gesture (pinch/zoom) on the map
        const currentDistance = getTouchDistance(e.touches);
        const distanceThreshold = 10; // Minimum distance change to consider it a pinch

        if (Math.abs(currentDistance - touchStartRef.current.distance) > distanceThreshold) {
          // Prevent page zoom during map pinch gestures
          e.preventDefault();
          e.stopPropagation();
        }
      } else if (e.touches.length === 1) {
        // Single finger pan - allow it for map interaction
        const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
        const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
        
        // If significant movement, it's a pan gesture
        if (dx > 10 || dy > 10) {
          e.stopPropagation();
        }
      }
    };

    const handleTouchEnd = (e) => {
      // Clear the timeout when touch ends
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }
      
      // Reset gesture tracking
      isMapGestureRef.current = false;
      touchStartRef.current = { x: 0, y: 0, distance: 0 };
    };

    const handleTouchCancel = (e) => {
      // Handle touch cancellation (e.g., when user swipes out of the screen)
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }
      isMapGestureRef.current = false;
      touchStartRef.current = { x: 0, y: 0, distance: 0 };
    };

    // Add event listeners with the correct passive settings
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    // Cleanup function
    return () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, []);

  return { mapContainerRef };
};

/**
 * Hook to prevent page zoom while preserving map functionality
 * Alternative simpler approach
 */
export const usePreventPageZoom = () => {
  useEffect(() => {
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        // Check if the target is within a map container
        const isMapTouch = e.target.closest(".map-container") !== null;
        if (!isMapTouch) {
          // If not on map, prevent the zoom
          e.preventDefault();
        }
      }
    };

    const preventDoubleClickZoom = (e) => {
      // Prevent double-tap zoom on non-map elements
      const isMapTouch = e.target.closest(".map-container") !== null;
      if (!isMapTouch) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("touchmove", preventZoom, { passive: false });
    document.addEventListener("dblclick", preventDoubleClickZoom, { passive: false });

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("touchmove", preventZoom);
      document.removeEventListener("dblclick", preventDoubleClickZoom);
    };
  }, []);
};
