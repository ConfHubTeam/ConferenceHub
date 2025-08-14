import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useAttendeesFilter, ATTENDEES_RANGES } from "../contexts/AttendeesFilterContext";
import { useSizeFilter, SIZE_RANGES } from "../contexts/SizeFilterContext";
import { usePerksFilter } from "../contexts/PerksFilterContext";
import { usePoliciesFilter } from "../contexts/PoliciesFilterContext";
import { formatCurrency, getCurrencySymbol } from "../utils/currencyUtils";
import { formatHourTo12, formatHourLocalized } from "../utils/TimeUtils";
import { format } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import DateTimeFilterModal from "./DateTimeFilterModal";
import PriceFilterModal from "./PriceFilterModal";
import AttendeesFilterModal from "./AttendeesFilterModal";
import SizeFilterModal from "./SizeFilterModal";
import PerksFilterModal from "./PerksFilterModal";
import PolicyFilterModal from "./PolicyFilterModal";
import LocationFilter from "./LocationFilter";

export default function FilterRow({ 
  isMapVisible, 
  toggleMap, 
  showMobileMap, 
  isMobileMapView,
  selectedRegionId = null,
  onRegionChange,
  onMapFocus,
  regionService
}) {
  const { t, i18n } = useTranslation("search");
  
  // State for modal visibility
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isPerksModalOpen, setIsPerksModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  
  // Scroll state for showing appropriate arrows
  const [scrollPosition, setScrollPosition] = useState("start"); // "start", "middle", "end"
  const scrollContainerRef = useRef(null);
  
  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get date/time filter state from context
  const { 
    selectedDates, 
    startTime, 
    endTime, 
    hasActiveDateTimeFilter, 
    clearDateTimeFilter 
  } = useDateTimeFilter();
  
  // Get price filter state from context
  const { 
    minPrice, 
    maxPrice, 
    selectedCurrency,
    hasActivePriceFilter, 
    clearPriceFilter 
  } = usePriceFilter();
  
  // Get attendees filter state from context
  const { 
    minAttendees, 
    maxAttendees, 
    selectedRangeId: attendeesRangeId,
    hasActiveAttendeesFilter, 
    clearAttendeesFilter 
  } = useAttendeesFilter();
  
  // Get size filter state from context
  const { 
    minSize, 
    maxSize, 
    selectedRangeId: sizeRangeId,
    hasActiveSizeFilter, 
    clearSizeFilter 
  } = useSizeFilter();
  
  // Get perks filter state from context
  const { hasSelectedPerks, selectedPerksCount, clearAllPerks } = usePerksFilter();
  
  // Get policies filter state from context
  const { hasSelectedPolicies, selectedPoliciesCount, clearAllPolicies } = usePoliciesFilter();
  
  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };
  
  // Formatting functions with translation support
  const getFormattedDateTime = () => {
    if (selectedDates.length === 0) return "";
    if (selectedDates.length === 1) {
      const formattedDate = format(selectedDates[0], "MMM d", { locale: getDateLocale() });
      // Include time information if available
      if (startTime && endTime) {
        return `${formattedDate}, ${formatHourLocalized(startTime, i18n.language)}-${formatHourLocalized(endTime, i18n.language)}`;
      }
      return formattedDate;
    }
    return t("filters.buttons.multiple_dates", { count: selectedDates.length });
  };
  
  const getFormattedPriceRange = () => {
    if (!selectedCurrency) return "";
    
    const symbol = getCurrencySymbol(selectedCurrency);
    const hasMin = minPrice !== null && minPrice !== undefined && minPrice !== "";
    const hasMax = maxPrice !== null && maxPrice !== undefined && maxPrice !== "";

    if (!hasMin && !hasMax) return "";

    if (hasMin && hasMax) {
      const formattedMin = formatCurrency(minPrice, selectedCurrency);
      const formattedMax = formatCurrency(maxPrice, selectedCurrency);
      
      if (selectedCurrency.charCode === "USD") {
        return `${symbol}${formattedMin} - ${symbol}${formattedMax}`;
      } else {
        return `${formattedMin} - ${formattedMax} ${symbol}`;
      }
    } else if (hasMin) {
      const formattedMin = formatCurrency(minPrice, selectedCurrency);
      
      if (selectedCurrency.charCode === "USD") {
        return `${symbol}${formattedMin}+`;
      } else {
        return `${formattedMin}+ ${symbol}`;
      }
    } else if (hasMax) {
      const formattedMax = formatCurrency(maxPrice, selectedCurrency);
      
      if (selectedCurrency.charCode === "USD") {
        // Handle Uzbek word order: "amount gacha" instead of "Up to amount"
        if (i18n.language === "uz") {
          return `${symbol}${formattedMax} ${t("filters.buttons.up_to")}`;
        } else {
          return `${t("filters.buttons.up_to")} ${symbol}${formattedMax}`;
        }
      } else {
        // Handle Uzbek word order: "amount gacha" instead of "Up to amount"
        if (i18n.language === "uz") {
          return `${formattedMax} ${symbol} ${t("filters.buttons.up_to")}`;
        } else {
          return `${t("filters.buttons.up_to")} ${formattedMax} ${symbol}`;
        }
      }
    }

    return "";
  };
  
  const getFormattedAttendeesRange = () => {
    const hasMin = minAttendees !== null && minAttendees !== undefined;
    const hasMax = maxAttendees !== null && maxAttendees !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check for predefined ranges with translation keys
    if (attendeesRangeId && attendeesRangeId !== "custom") {
      // Convert hyphen to underscore for translation keys
      const translationKey = attendeesRangeId.replace(/-/g, "_").replace(/\+/g, "plus");
      return t(`filters.modals.attendees.presets.${translationKey}`);
    }

    // Custom formatting with translations
    if (hasMin && hasMax) {
      return t("filters.buttons.attendees_range", { min: minAttendees, max: maxAttendees });
    } else if (hasMin) {
      return t("filters.buttons.attendees_min", { min: minAttendees });
    } else if (hasMax) {
      return t("filters.buttons.attendees_max", { max: maxAttendees });
    }

    return "";
  };
  
  const getFormattedSizeRange = () => {
    const hasMin = minSize !== null && minSize !== undefined;
    const hasMax = maxSize !== null && maxSize !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check for predefined ranges with translation keys
    if (sizeRangeId && sizeRangeId !== "custom") {
      // Convert "extra-large" to "extraLarge" for translation keys
      const translationKey = sizeRangeId === "extra-large" ? "extraLarge" : sizeRangeId;
      return t(`filters.modals.size.presets.${translationKey}`);
    }

    // Custom formatting with translations
    if (hasMin && hasMax) {
      return t("filters.buttons.size_range", { min: minSize, max: maxSize });
    } else if (hasMin) {
      return t("filters.buttons.size_min", { min: minSize });
    } else if (hasMax) {
      return t("filters.buttons.size_max", { max: maxSize });
    }

    return "";
  };
  
  // Check if any filter is active (including region selection)
  // Region filter is only active if it's different from the default region
  const defaultRegionId = regionService?.getDefaultRegion()?.id || 'tashkent-city';
  const hasActiveRegionFilter = selectedRegionId !== null && 
                                selectedRegionId !== undefined && 
                                selectedRegionId !== defaultRegionId;
  const hasAnyActiveFilter = hasActiveDateTimeFilter || hasActivePriceFilter || hasActiveAttendeesFilter || hasActiveSizeFilter || hasSelectedPerks || hasSelectedPolicies || hasActiveRegionFilter;
  
  // Clear all filters
  const handleResetAllFilters = () => {
    // Clear all filter contexts
    clearDateTimeFilter();
    clearPriceFilter();
    clearAttendeesFilter();
    clearSizeFilter();
    clearAllPerks();
    clearAllPolicies();
    
    // Reset region selection to default (Tashkent)
    if (onRegionChange && regionService) {
      const defaultRegion = regionService.getDefaultRegion();
      onRegionChange(defaultRegion?.id || 'tashkent-city');
    }
    
    // Reset map to default location (Tashkent) - this should happen after region change
    setTimeout(() => {
      if (onMapFocus) {
        onMapFocus(null); // null triggers reset to default
      }
    }, 100);
    
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
  const openPerksModal = () => setIsPerksModalOpen(true);
  const closePerksModal = () => setIsPerksModalOpen(false);
  const openPolicyModal = () => setIsPolicyModalOpen(true);
  const closePolicyModal = () => setIsPolicyModalOpen(false);
  
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
      
      {/* Perks Filter Modal */}
      <PerksFilterModal 
        isOpen={isPerksModalOpen}
        onClose={closePerksModal}
      />
      
      {/* Policy Filter Modal */}
      <PolicyFilterModal 
        isOpen={isPolicyModalOpen}
        onClose={closePolicyModal}
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
                {/* Location Filter */}
                <LocationFilter
                  selectedRegionId={selectedRegionId}
                  onRegionChange={onRegionChange}
                  onMapFocus={onMapFocus}
                  regionService={regionService}
                  size="compact"
                  showClearButton={true}
                />
                
                <button 
                  onClick={openDateTimeModal}
                  className={`flex px-3 py-2 items-center transition-all duration-200 border rounded-full text-xs flex-shrink-0 whitespace-nowrap ${
                    hasActiveDateTimeFilter 
                      ? "bg-brand-orange text-white border-brand-orange" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="truncate max-w-[100px]">
                    {hasActiveDateTimeFilter ? getFormattedDateTime() : t("filters.buttons.when")}
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
                    {hasActivePriceFilter ? getFormattedPriceRange() : t("filters.buttons.price")}
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
                    {hasActiveAttendeesFilter ? getFormattedAttendeesRange() : t("filters.buttons.attendees")}
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
                    {hasActiveSizeFilter ? getFormattedSizeRange() : t("filters.buttons.size")}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={openPerksModal}
                  className={`flex px-3 py-2 items-center transition-all duration-200 border rounded-full text-xs flex-shrink-0 whitespace-nowrap ${
                    hasSelectedPerks 
                      ? "bg-brand-orange text-white border-brand-orange" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="truncate max-w-[100px]">
                    {hasSelectedPerks ? t("filters.buttons.perks_with_count", { count: selectedPerksCount }) : t("filters.buttons.perks")}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={openPolicyModal}
                  className={`flex px-3 py-2 items-center transition-all duration-200 border rounded-full text-xs flex-shrink-0 whitespace-nowrap ${
                    hasSelectedPolicies 
                      ? "bg-brand-orange text-white border-brand-orange" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="truncate max-w-[100px]">
                    {hasSelectedPolicies ? t("filters.buttons.policies_with_count", { count: selectedPoliciesCount }) : t("filters.buttons.policies")}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Reset button - only show when filters are active */}
                {hasAnyActiveFilter && (
                  <button 
                    onClick={handleResetAllFilters}
                    className="flex px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 items-center transition-all duration-200 border border-orange-200 hover:border-orange-300 rounded-full text-xs flex-shrink-0 whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t("filters.buttons.reset")}
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
                className="flex px-3 py-2 bg-white hover:bg-purple-50 text-brand-purple hover:text-purple-700 items-center transition-all duration-200 border border-brand-purple hover:border-purple-600 rounded-full text-xs shadow-sm ring-1 ring-purple-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {t("filters.buttons.map")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Single row */}
      <div className="hidden md:flex items-center justify-between w-full min-w-0">
        {/* Left side - Filters aligned to the left with overflow scroll */}
        <div className="flex items-center flex-1 min-w-0 mr-4">
          {/* Scrollable filter container */}
          <div className="relative flex-1 min-w-0">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-center space-x-2 pb-1">
                {/* Filter buttons */}
                
                {/* Location Filter */}
                <LocationFilter
                  selectedRegionId={selectedRegionId}
                  onRegionChange={onRegionChange}
                  onMapFocus={onMapFocus}
                  regionService={regionService}
                  size="default"
                  showClearButton={true}
                />
                
            <button 
              onClick={openDateTimeModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full flex-shrink-0 whitespace-nowrap ${
                hasActiveDateTimeFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[250px]">
                {hasActiveDateTimeFilter ? getFormattedDateTime() : t("filters.buttons.when")}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openPriceModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full flex-shrink-0 whitespace-nowrap ${
                hasActivePriceFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[200px]">
                {hasActivePriceFilter ? getFormattedPriceRange() : t("filters.buttons.price")}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openAttendeesModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full flex-shrink-0 whitespace-nowrap ${
                hasActiveAttendeesFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[150px]">
                {hasActiveAttendeesFilter ? getFormattedAttendeesRange() : t("filters.buttons.attendees")}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openSizeModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full flex-shrink-0 whitespace-nowrap ${
                hasActiveSizeFilter 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[150px]">
                {hasActiveSizeFilter ? getFormattedSizeRange() : t("filters.buttons.size")}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openPerksModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full flex-shrink-0 whitespace-nowrap ${
                hasSelectedPerks 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[150px]">
                {hasSelectedPerks ? t("filters.buttons.perks_with_count", { count: selectedPerksCount }) : t("filters.buttons.perks")}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={openPolicyModal}
              className={`flex px-4 py-2 items-center transition-all duration-200 border rounded-full flex-shrink-0 whitespace-nowrap ${
                hasSelectedPolicies 
                  ? "bg-brand-orange text-white border-brand-orange" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="truncate max-w-[150px]">
                {hasSelectedPolicies ? t("filters.buttons.policies_with_count", { count: selectedPoliciesCount }) : t("filters.buttons.policies")}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Reset button - only show when filters are active */}
            {hasAnyActiveFilter && (
              <button 
                onClick={handleResetAllFilters}
                className="flex px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 items-center transition-all duration-200 border border-orange-200 hover:border-orange-300 rounded-full whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t("filters.buttons.reset")}
              </button>
            )}
                
                {/* End spacer for smooth scrolling */}
                <div className="w-4 flex-shrink-0"></div>
              </div>
            </div>
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
              className="flex px-4 py-2 bg-white hover:bg-purple-50 text-brand-purple hover:text-purple-700 items-center transition-all duration-200 border border-brand-purple hover:border-purple-600 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {isMapVisible ? t("filters.buttons.hide_map") : t("filters.buttons.show_map")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
