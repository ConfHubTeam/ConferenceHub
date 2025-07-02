import { createContext, useContext, useState, useEffect, useRef } from "react";

const MapContext = createContext();

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
};

export const MapProvider = ({ children }) => {
  // Check if we're on mobile using window.innerWidth
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Set map to visible by default only on desktop
  const [isMapVisible, setIsMapVisible] = useState(!isMobile);
  const [isMobileMapView, setIsMobileMapView] = useState(false);
  
  // Store map state to preserve across toggles
  const mapStateRef = useRef({
    zoom: 12, // Start with a more reasonable zoom level
    center: { lat: 41.2995, lng: 69.2401 },
    bounds: null
  });
  
  // Handle window resize to adjust map visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyMobile = window.innerWidth < 768;
      
      // Only auto-change if there's a transition between desktop <-> mobile
      if (isCurrentlyMobile !== isMobile) {
        // If switching to desktop, show map
        // If switching to mobile, hide mobile map view
        if (!isCurrentlyMobile) {
          setIsMapVisible(true);
        } else {
          setIsMobileMapView(false);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  const toggleMap = () => {
    setIsMapVisible(!isMapVisible);
  };

  const hideMap = () => {
    setIsMapVisible(false);
    setIsMobileMapView(false);
  };

  const showMobileMap = () => {
    setIsMobileMapView(true);
  };

  const hideMobileMap = () => {
    setIsMobileMapView(false);
  };

  // New methods to preserve map state
  const saveMapState = (mapInstance) => {
    if (mapInstance) {
      mapStateRef.current = {
        zoom: mapInstance.getZoom(),
        center: mapInstance.getCenter().toJSON(),
        bounds: mapInstance.getBounds()?.toJSON()
      };
    }
  };

  const getMapState = () => mapStateRef.current;

  const value = {
    isMapVisible,
    isMobileMapView,
    toggleMap,
    hideMap,
    showMobileMap,
    hideMobileMap,
    saveMapState,
    getMapState
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};
