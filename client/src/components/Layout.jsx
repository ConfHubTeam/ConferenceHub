import Header from "./Header";
import FilterRow from "./FilterRow";
import { Outlet, useLocation } from "react-router-dom";
import { MapProvider, useMap } from "../contexts/MapContext";

function IndexPageLayout() {
  const { isMapVisible, isMobileMapView, toggleMap, showMobileMap, hideMap, hideMobileMap } = useMap();
  
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
        />
      </div>
      <div className={`flex-1 overflow-hidden flex flex-col ${isMobileMapView ? 'pt-[120px]' : ''}`}>
        <Outlet context={{ isMapVisible, isMobileMapView, hideMap, hideMobileMap }} />
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
