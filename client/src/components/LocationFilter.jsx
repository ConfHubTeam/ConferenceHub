/**
 * LocationFilter Component
 * 
 * A filter button for region/location selection
 * Follows Single Responsibility Principle - only handles location filter UI
 * Integrates with the existing filter system architecture
 * Optimized for performance with memoization and debouncing
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedRegionId - Currently selected region ID
 * @param {Function} props.onRegionChange - Function to call when region changes
 * @param {Function} props.onMapFocus - Function to call when map should focus on region
 * @param {string} props.size - Button size ('compact' | 'default')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showClearButton - Whether to show clear button when region is selected
 */

import { useState, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { useRegions } from "../hooks/useRegions.js";
import LocationSelectorModal from "./LocationSelectorModal.jsx";

const LocationFilter = memo(function LocationFilter({
  selectedRegionId = null,
  onRegionChange,
  onMapFocus,
  regionService,
  size = "default",
  className = "",
  showClearButton = true
}) {
  const { t } = useTranslation("search");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use regionService from props or fallback to hook
  const { regionService: hookRegionService, regions } = useRegions();
  const finalRegionService = regionService || hookRegionService;
  
  // Performance optimization: Memoize selected region lookup
  const selectedRegion = useMemo(() => {
    return selectedRegionId ? 
      regions.find(region => region.id === selectedRegionId) : 
      null;
  }, [selectedRegionId, regions]);
  
  // Performance optimization: Memoize default region
  const defaultRegion = useMemo(() => 
    finalRegionService?.getDefaultRegion(), 
    [finalRegionService]
  );
  
  const isDefaultRegion = useMemo(() => 
    selectedRegionId === (defaultRegion?.id || 'tashkent-city'),
    [selectedRegionId, defaultRegion]
  );

  // Handle region selection from modal with performance optimization
  const handleRegionSelect = useCallback((region) => {
    const regionId = region?.id;
    
    // Performance optimization: Skip if same region
    if (regionId === selectedRegionId) {
      setIsModalOpen(false);
      return;
    }
    
    onRegionChange(regionId);
    
    // Trigger map focus if provided (debounced in hook)
    if (onMapFocus && finalRegionService && regionId) {
      const mapConfig = finalRegionService.getMapConfigForRegion(regionId, 'CITY');
      onMapFocus(mapConfig);
    }
    
    setIsModalOpen(false);
  }, [selectedRegionId, onRegionChange, onMapFocus, finalRegionService]);

  // Handle clear region with performance optimization
  const handleClearRegion = useCallback((e) => {
    e.stopPropagation();
    
    const defaultRegionId = defaultRegion?.id || 'tashkent-city';
    
    // Performance optimization: Skip if already default
    if (selectedRegionId === defaultRegionId) {
      return;
    }
    
    onRegionChange(defaultRegionId);
    
    // Reset map focus when clearing
    if (onMapFocus && finalRegionService) {
      const mapConfig = finalRegionService.getMapConfigForRegion(defaultRegionId, 'CITY');
      onMapFocus(mapConfig);
    }
  }, [selectedRegionId, defaultRegion, onRegionChange, onMapFocus, finalRegionService]);

  // Button sizing classes
  const sizeClasses = {
    compact: "px-3 py-2 text-xs",
    default: "px-4 py-2.5 text-sm sm:text-base"
  };

  // Get display text
  const getDisplayText = () => {
    if (selectedRegion) {
      return selectedRegion.displayName;
    }
    
    // If we have a selectedRegionId but can't find the region (regions still loading),
    // show default region name or fallback
    if (selectedRegionId && isDefaultRegion && defaultRegion) {
      return defaultRegion.displayName;
    }
    
    // Fallback to default region if nothing selected
    return defaultRegion?.displayName || t("location.selectRegion");
  };

  // Get button classes
  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center justify-center gap-2 border rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:border-gray-400 bg-white flex-shrink-0 whitespace-nowrap";
    
    // Button is "active" (orange) only when a non-default region is selected
    const isActiveFilter = selectedRegion && !isDefaultRegion;
    const stateClasses = isActiveFilter
      ? "border-brand-orange bg-brand-orange/5 text-brand-orange hover:bg-brand-orange/10"
      : "border-gray-300 text-gray-700 hover:bg-gray-50";
    
    return `${baseClasses} ${stateClasses} ${sizeClasses[size]} ${className}`;
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={getButtonClasses()}
        aria-label={t("location.modal.search.ariaLabel")}
        type="button"
      >
        {/* Location Icon */}
        <svg 
          className="w-4 h-4 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
        
        {/* Display Text */}
        <span className="truncate max-w-32 sm:max-w-48">
          {getDisplayText()}
        </span>
        
        {/* Clear Button - only show for non-default regions */}
        {selectedRegion && !isDefaultRegion && showClearButton && (
          <span
            onClick={handleClearRegion}
            className="ml-1 p-0.5 rounded-full hover:bg-brand-orange/20 transition-colors cursor-pointer inline-flex items-center justify-center"
            aria-label={t("location.modal.search.clear")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClearRegion(e);
              }
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
        
        {/* Dropdown Arrow - show when no specific region is selected (default or null) */}
        {(!selectedRegion || isDefaultRegion) && (
          <svg 
            className="w-4 h-4 flex-shrink-0 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        )}
      </button>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegionSelect={handleRegionSelect}
        selectedRegionId={selectedRegionId}
      />
    </>
  );
});

export default LocationFilter;
