import { createContext, useContext, useState, useEffect } from "react";

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

  const value = {
    isMapVisible,
    isMobileMapView,
    toggleMap,
    hideMap,
    showMobileMap,
    hideMobileMap
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};
