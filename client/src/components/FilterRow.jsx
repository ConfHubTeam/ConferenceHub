import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useAttendeesFilter } from "../contexts/AttendeesFilterContext";
import { useSizeFilter } from "../contexts/SizeFilterContext";
import DateTimeFilterModal from "./DateTimeFilterModal";
import PriceFilterModal from "./PriceFilterModal";
import AttendeesFilterModal from "./AttendeesFilterModal";
import SizeFilterModal from "./SizeFilterModal";

export default function FilterRow({ 
  isMapVisible, 
  toggleMap, 
  showMobileMap, 
  isMobileMapView 
}) {
  // State for modal visibility
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  
  // Scroll state for showing appropriate arrows
  const [scrollPosition, setScrollPosition] = useState("start"); // "start", "middle", "end"
  const scrollContainerRef = useRef(null);
  
  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get date/time filter state from context
  const { getFormattedDateTime, hasActiveDateTimeFilter, clearDateTimeFilter } = useDateTimeFilter();
  
  // Get price filter state from context
  const { getFormattedPriceRange, hasActivePriceFilter, clearPriceFilter } = usePriceFilter();
  
  // Get attendees filter state from context
  const { getFormattedAttendeesRange, hasActiveAttendeesFilter, clearAttendeesFilter } = useAttendeesFilter();
  
  // Get size filter state from context
  const { getFormattedSizeRange, hasActiveSizeFilter, clearSizeFilter } = useSizeFilter();
  
  // Check if any filter is active
  const hasAnyActiveFilter = hasActiveDateTimeFilter || hasActivePriceFilter || hasActiveAttendeesFilter || hasActiveSizeFilter;
  
  // Clear all filters
  const handleResetAllFilters = () => {
    // Clear all filter contexts
    clearDateTimeFilter();
    clearPriceFilter();
    clearAttendeesFilter();
    clearSizeFilter();
    
    // Clear URL parameters by navigating to the same path without query parameters
    navigate(location.pathname, { replace: true });
  };
  
  // Open/close modal handlers
  const openDateTimeModal = () => setIsDateTimeModalOpen(true);
  const closeDateTimeModal = () => setIsDateTimeModalOpen(false);
  const openPriceModal = () => setIsPriceModalOpen(true);
  const closePriceModal = () => setIsPriceModalOpen(false);
  const openAttendeesModal = () => setIsAttendeesModalOpen(true);
  const closeAttendeesModal = () => setIsAttendeesModalOpen(false);
  const openSizeModal = () => setIsSizeModalOpen(true);
  const closeSizeModal = () => setIsSizeModalOpen(false);
  
  // Handle scroll to update arrow indicators
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    
    if (scrollLeft <= 5) {
      setScrollPosition("start");
    } else if (scrollLeft >= maxScroll - 5) {
      setScrollPosition("end");
    } else {
      setScrollPosition("middle");
    }
  };
  
  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // Initial check
      handleScroll();
      
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);
  
  return (
    <div className="w-full px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      {/* Date/Time Filter Modal */}
      <DateTimeFilterModal 
        isOpen={isDateTimeModalOpen}
        onClose={closeDateTimeModal}
      />
      
      {/* Price Filter Modal */}
      <PriceFilterModal 
        isOpen={isPriceModalOpen}
        onClose={closePriceModal}
      />
      
      {/* Attendees Filter Modal */}
      <AttendeesFilterModal 
        isOpen={isAttendeesModalOpen}
        onClose={closeAttendeesModal}
      />
      
      {/* Size Filter Modal */}
      <SizeFilterModal 
        isOpen={isSizeModalOpen}
        onClose={closeSizeModal}
      />
      
      {/* Mobile: Scrollable filter row with fixed map button */}
      <div className="flex md:hidden">
        <div className="flex items-center w-full min-w-0 relative">
          {/* Left side - Scrollable filters container */}
          <div className="flex-1 min-w-0 mr-4 relative">
            <div 
              ref={scrollContainerRef}
              className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-2 -mb-2 scroll-smooth"
            >
              <div className="flex items-center space-x-2 flex-shrink-0 pl-1">
                <button 
                  onClick={openDateTimeModal}
                  className={`flex px-3 py-2 items-center transition-all duration-200 border rounded-full text-xs flex-shrink-0 whitespace-nowrap ${
                    hasActiveDateTimeFilter 
                      ? "bg-brand-orange text-white border-brand-orange" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="truncate max-w-[100px]">
                    {hasActiveDateTimeFilter ? getFormattedDateTime() : "When"}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={openPriceModal}
                  className={`flex px-3 py-2 items-center transition-all duration-200 border rounded-full text-xs flex-shrink-0 whitespace-nowrap ${
                    hasActivePriceFilter 
                      ? "bg-brand-orange text-white border-brand-orange" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="truncate max-w-[100px]">
                    {hasActivePriceFilter ? getFormattedPriceRange() : "Price"}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={openAttendeesModal}
                  className={`flex px-3 py-2 items-center transition-all duration-200 border rounded-full text-xs flex-shrink-0 whitespace-nowrap ${
                    hasActiveAttendeesFilter 
                      ? "bg-brand-orange text-white border-brand-orange" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="truncate max-w-[100px]">
                    {hasActiveAttendeesFilter ? getFormattedAttendeesRange() : "Attendees"}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={openSizeModal}
                  className={`flex px-3 py-2 items-center transition-all duration-200 border rounded-full text-xs flex-shrink-0 whitespace-nowrap ${
                    hasActiveSizeFilter 
                      ? "bg-brand-orange text-white border-brand-orange" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="truncate max-w-[100px]">
                    {hasActiveSizeFilter ? getFormattedSizeRange() : "Size"}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Reset button - only show when filters are active */}
                {hasAnyActiveFilter && (
                  <button 
                    onClick={handleResetAllFilters}
                    className="flex px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 items-center transition-all duration-200 border border-red-200 hover:border-red-300 rounded-full text-xs flex-shrink-0 whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reset
                  </button>
                )}
                
                {/* End spacer for smooth scrolling */}
                <div className="w-4 flex-shrink-0"></div>
              </div>
            </div>
            
            {/* Enhanced gradient fade effects with smart arrows */}
            {(scrollPosition === "middle" || scrollPosition === "end") && (
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10 flex items-center justify-start pl-1">
                {/* Left scroll indicator arrow */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            )}
            
            {(scrollPosition === "start" || scrollPosition === "middle") && (
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10 flex items-center justify-end pr-1">
                {/* Right scroll indicator arrow */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Visual separator */}
          <div className="w-px h-8 bg-gray-200 mx-2 flex-shrink-0"></div>
          
          {/* Right side - Fixed map toggle */}
          {!isMobileMapView && (
            <div className="flex-shrink-0">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  showMobileMap();
                }}
                className="flex px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full text-xs shadow-sm ring-1 ring-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Single row */}
      <div className="hidden md:flex items-center justify-between w-full min-w-0">
        {/* Left side - Filters aligned to the left */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Filter buttons */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={openDateTimeModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full ${
                hasActiveDateTimeFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[250px]">
                {hasActiveDateTimeFilter ? getFormattedDateTime() : "When"}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openPriceModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full ${
                hasActivePriceFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[200px]">
                {hasActivePriceFilter ? getFormattedPriceRange() : "Price"}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openAttendeesModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full ${
                hasActiveAttendeesFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[150px]">
                {hasActiveAttendeesFilter ? getFormattedAttendeesRange() : "Attendees"}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openSizeModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full ${
                hasActiveSizeFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[150px]">
                {hasActiveSizeFilter ? getFormattedSizeRange() : "Size"}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Reset button - only show when filters are active */}
            {hasAnyActiveFilter && (
              <button 
                onClick={handleResetAllFilters}
                className="flex px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 items-center transition-all duration-200 border border-red-200 hover:border-red-300 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset
              </button>
            )}
          </div>
        </div>
        
        {/* Right side - Map toggle button aligned to the right */}
        <div className="flex items-center flex-shrink-0">
          {!isMobileMapView && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                toggleMap();
              }}
              className="flex px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {isMapVisible ? "Hide map" : "Show map"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
