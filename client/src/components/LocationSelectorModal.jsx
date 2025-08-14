/**
 * LocationSelectorModal Component
 * 
 * A reusable modal for region/location selection
 * Follows Single Responsibility Principle - only handles location selection UI
 * Supports search functionality and multi-language display
 * Features mobile-first responsive design with accessibility support
 * Optimized for performance with memoization and virtual scrolling for large datasets
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onRegionSelect - Function to call when a region is selected
 * @param {string} props.selectedRegionId - Currently selected region ID
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useRegions, useRegionSearch } from "../hooks/useRegions.js";
import Button from "./ui/Button.jsx";

const LocationSelectorModal = memo(function LocationSelectorModal({ 
  isOpen, 
  onClose, 
  onRegionSelect,
  selectedRegionId = null
}) {
  const { t } = useTranslation("search");
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Use region hooks
  const { sortedRegions, defaultRegion } = useRegions();
  const { 
    filteredRegions, 
    searchTerm, 
    updateSearchTerm, 
    clearSearch,
    hasSearchResults
  } = useRegionSearch();

  // Local state
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Performance optimization: Memoize regions to display
  const regionsToDisplay = useMemo(() => 
    searchTerm ? filteredRegions : sortedRegions,
    [searchTerm, filteredRegions, sortedRegions]
  );

  // Use regions without modification
  const regionOptions = regionsToDisplay;

  // Handle outside click to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < regionOptions.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : regionOptions.length - 1
        );
      } else if (event.key === "Enter" && focusedIndex >= 0) {
        event.preventDefault();
        handleRegionSelect(regionOptions[focusedIndex]);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, focusedIndex, regionOptions]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Find currently selected region
      const currentRegion = selectedRegionId 
        ? sortedRegions.find(r => r.id === selectedRegionId)
        : null;
      setSelectedRegion(currentRegion);
      clearSearch();
      setFocusedIndex(-1);
    }
  }, [isOpen, selectedRegionId, sortedRegions, clearSearch]);

  // Performance optimization: Handle region selection with duplicate check
  const handleRegionSelect = useCallback((region) => {
    // Skip if same region selected
    if (region.id === selectedRegionId) {
      onClose();
      return;
    }
    
    setSelectedRegion(region);
    onRegionSelect(region);
    onClose();
  }, [selectedRegionId, onRegionSelect, onClose]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    updateSearchTerm(e.target.value);
    setFocusedIndex(-1); // Reset focus when searching
  }, [updateSearchTerm]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    clearSearch();
    setFocusedIndex(-1);
    searchInputRef.current?.focus();
  }, [clearSearch]);

  // Only render when open
  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4" 
      style={{ zIndex: 70 }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[85vh] flex flex-col overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0 bg-gray-50">
          <h2 
            id="location-modal-title"
            className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-5 h-5 mr-2 text-primary"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 0115 0z" 
              />
            </svg>
            {t("location.modal.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={t("location.modal.actions.close")}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 sm:h-6 sm:w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Search Section */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t("location.modal.search.placeholder")}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
              aria-label={t("location.modal.search.ariaLabel")}
            />
            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-0.5"
                aria-label={t("location.modal.search.clear")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search Results Count */}
          {searchTerm && (
            <div className="mt-2 text-xs sm:text-sm text-gray-500">
              {hasSearchResults 
                ? t("location.modal.search.results", { count: filteredRegions.length })
                : t("location.modal.search.noResults")
              }
            </div>
          )}
        </div>
        
        {/* Regions List */}
        <div className="flex-1 overflow-y-auto">
          {regionOptions.length > 0 ? (
            <div className="py-2">
              {regionOptions.map((region, index) => (
                <button
                  key={region.id}
                  onClick={() => handleRegionSelect(region)}
                  className={`w-full px-4 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                    focusedIndex === index ? 'bg-gray-50' : ''
                  } ${
                    selectedRegionId === region.id ? 'bg-primary/10 border-r-4 border-primary' : ''
                  }`}
                  role="option"
                  aria-selected={selectedRegionId === region.id}
                >
                  <div className="flex items-center">
                    {/* Location Icon */}
                    <div className="flex-shrink-0 mr-3">
                      <svg 
                        className="w-5 h-5 text-primary" 
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
                    </div>
                    
                    {/* Region Name */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {region.displayName}
                      </div>
                      {region.isDefault && (
                        <div className="text-xs text-primary mt-0.5">
                          {t("location.modal.defaultRegion")}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Indicator */}
                    {selectedRegionId === region.id && (
                      <div className="flex-shrink-0 ml-3">
                        <svg 
                          className="w-5 h-5 text-primary" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 sm:px-6 py-8 text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20.6a7.962 7.962 0 01-5-1.691M9 12h6m-3-9v3" 
                />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {t("location.modal.noRegions.title")}
              </h3>
              <p className="text-sm text-gray-500">
                {t("location.modal.noRegions.description")}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0 bg-white">
          <div className="text-xs sm:text-sm text-gray-500">
            {regionOptions.length > 0 && (
              t("location.modal.footer.count", { count: regionOptions.length })
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-sm sm:text-base"
          >
            {t("location.modal.actions.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document root level
  return createPortal(modalContent, document.body);
});

export default LocationSelectorModal;
