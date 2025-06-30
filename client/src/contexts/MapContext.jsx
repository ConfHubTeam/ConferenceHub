import { createContext, useContext, useState } from "react";

const MapContext = createContext();

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
};

export const MapProvider = ({ children }) => {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isMobileMapView, setIsMobileMapView] = useState(false);

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
