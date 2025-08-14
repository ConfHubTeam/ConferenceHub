import Header from "./Header";
import FilterRow from "./FilterRow";
import { Outlet, useLocation } from "react-router-dom";
import { MapProvider, useMap } from "../contexts/MapContext";
import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createRegionService } from "../services/RegionService.js";

function IndexPageLayout() {
  const { isMapVisible, isMobileMapView, toggleMap, showMobileMap, hideMap, hideMobileMap } = useMap();
  
  // Initialize region service and get default region
  const { i18n } = useTranslation();
  const regionService = useMemo(() => createRegionService(i18n), [i18n]);
  const defaultRegion = useMemo(() => regionService.getDefaultRegion(), [regionService]);
  
  // Region selection state - initialize to default region (Tashkent)
  const [selectedRegionId, setSelectedRegionId] = useState(defaultRegion?.id || 'tashkent-city');
  
  // Map ref for focus operations (will be passed to child)
  const mapFocusRef = useRef(null);
  
  // Handle region selection change
  const handleRegionChange = useCallback((regionId) => {
    setSelectedRegionId(regionId);
  }, []);
  
  // Handle map focus requests
  const handleMapFocus = useCallback(async (regionConfig) => {
    if (!mapFocusRef.current) return;
    
    try {
      if (regionConfig) {
        // Focus on specific region
        await mapFocusRef.current.focusOnRegion(regionConfig, { animate: true });
      } else {
        // Reset to default region when no region config provided
        await mapFocusRef.current.resetToDefault({ animate: true });
      }
    } catch (error) {
      console.error('Error focusing map:', error);
    }
  }, []);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className={`${isMobileMapView ? 'fixed w-full' : 'sticky'} top-0 z-[60] bg-white flex-shrink-0`}>
        <div className="py-5 border-b border-gray-200 pb-2">
          <Header />
        </div>
        <FilterRow 
          isMapVisible={isMapVisible}
          isMobileMapView={isMobileMapView}
          toggleMap={toggleMap}
          showMobileMap={showMobileMap}
          selectedRegionId={selectedRegionId}
          onRegionChange={handleRegionChange}
          onMapFocus={handleMapFocus}
          regionService={regionService}
        />
      </div>
      <div className={`flex-1 overflow-hidden flex flex-col ${isMobileMapView ? 'pt-[120px]' : ''}`}>
        <Outlet context={{ 
          isMapVisible, 
          isMobileMapView, 
          hideMap, 
          hideMobileMap,
          selectedRegionId,
          onRegionChange: handleRegionChange,
          onMapFocus: handleMapFocus,
          mapFocusRef,
          regionService
        }} />
      </div>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/" || location.pathname === "/landing" || location.pathname === "/landingpage";
  const isIndexPage = location.pathname === "/places";

  if (isLandingPage) {
    return (
      <div className="min-h-screen">
        <Outlet />
      </div>
    );
  }

  // Special layout for IndexPage (places listing) - unscrollable with sticky header and filter row
  if (isIndexPage) {
    return (
      <MapProvider>
        <IndexPageLayout />
      </MapProvider>
    );
  }

  // Default layout for all other pages - scrollable
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-[60] bg-white border-b border-gray-200">
        <div className="py-5">
          <Header />
        </div>
      </div>
      <div className="pt-5">
        <Outlet />
      </div>
    </div>
  );
}
