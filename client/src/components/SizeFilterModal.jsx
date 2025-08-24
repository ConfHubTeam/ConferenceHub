import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams as useRouterSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSizeFilter } from "../contexts/SizeFilterContext";

/**
 * SizeFilterModal Component
 * A reusable modal for size range selection that can be used across the application
 * Supports preset size ranges and custom size input
 * Features mobile-first responsive design with desktop optimization
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 */
export default function SizeFilterModal({ isOpen, onClose }) {
  const { t } = useTranslation("search");
  const {
    minSize,
    maxSize,
    selectedRangeId,
    sizeRanges,
    updateSizeRange,
    clearSizeFilter,
    getFormattedSizeRange,
    hasActiveSizeFilter,
    selectPredefinedRange
  } = useSizeFilter();

  // Get router search params for URL updates
  const [searchParams, setSearchParams] = useRouterSearchParams();

  // Local state for modal
  const [tempMinSize, setTempMinSize] = useState("");
  const [tempMaxSize, setTempMaxSize] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const modalRef = useRef(null);

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
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Reset temporary values when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempMinSize(minSize ? minSize.toString() : "");
      setTempMaxSize(maxSize ? maxSize.toString() : "");
      
      // Determine selected preset based on current filter values
      if (hasActiveSizeFilter && sizeRanges.length > 0) {
        const matchingRange = sizeRanges.find(range => 
          !range.isCustom &&
          range.min === minSize &&
          range.max === maxSize
        );
        
        if (matchingRange) {
          setSelectedPreset(matchingRange.id);
          setShowCustomRange(false);
        } else {
          setSelectedPreset("custom");
          setShowCustomRange(true);
        }
      } else {
        setSelectedPreset(selectedRangeId);
        setShowCustomRange(selectedRangeId === "custom");
      }
    }
  }, [isOpen, minSize, maxSize, hasActiveSizeFilter, sizeRanges, selectedRangeId]);

  // Handle preset selection
  const handlePresetSelect = useCallback((range) => {
    setSelectedPreset(range.id);
    
    if (range.id === "custom") {
      setShowCustomRange(true);
      return;
    }
    
    setShowCustomRange(false);
    
    // Use the preset values directly
    setTempMinSize(range.min ? range.min.toString() : "");
    setTempMaxSize(range.max ? range.max.toString() : "");
  }, []);

  // Handle input change with validation
  const handleSizeInput = (value, type) => {
    // Allow only numbers
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    
    if (type === "min") {
      setTempMinSize(sanitizedValue);
    } else {
      setTempMaxSize(sanitizedValue);
    }
    
    // If user is typing custom values, switch to custom preset
    if (sanitizedValue && selectedPreset !== "custom") {
      setSelectedPreset("custom");
      setShowCustomRange(true);
    }
  };

  // Handle apply button click
  const handleApply = () => {
    const min = tempMinSize ? parseInt(tempMinSize) : null;
    const max = tempMaxSize ? parseInt(tempMaxSize) : null;
    
    // Validate inputs
    if (min !== null && min < 0) {
      alert(t("filters.modals.size.validation.minNegative"));
      return;
    }
    
    if (max !== null && max < 0) {
      alert(t("filters.modals.size.validation.maxNegative"));
      return;
    }
    
    if (min !== null && max !== null && min > max) {
      alert(t("filters.modals.size.validation.minGreaterThanMax"));
      return;
    }
    
    // Update context state
    updateSizeRange(min, max, selectedPreset);
    
    // Update URL parameters
    updateUrlWithFilters(min, max, selectedPreset);
    
    onClose();
  };

  // Handle clear button click
  const handleClear = () => {
    setTempMinSize("");
    setTempMaxSize("");
    setSelectedPreset(null);
    setShowCustomRange(false);
    clearSizeFilter();
    
    // Clear URL parameters
    updateUrlWithFilters(null, null, null);
    
    onClose();
  };

  // Update URL with filter parameters
  const updateUrlWithFilters = (min, max, rangeId) => {
    const newParams = new URLSearchParams();
    
    // Keep existing parameters except size-related ones
    for (const [key, value] of searchParams.entries()) {
      if (value && value !== "undefined" && value !== "" && 
          !["minSize", "maxSize", "sizeRange"].includes(key)) {
        newParams.set(key, value);
      }
    }
    
    // Add new size parameters if they exist
    if (min !== null && min !== undefined) {
      newParams.set("minSize", min.toString());
    }
    
    if (max !== null && max !== undefined) {
      newParams.set("maxSize", max.toString());
    }
    
    if (rangeId && rangeId !== "custom") {
      newParams.set("sizeRange", rangeId);
    }
    
    setSearchParams(newParams, { replace: true });
  };

  // Only render when open
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 999999 }}>
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden relative z-[99999]"
        style={{ zIndex: 999999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">{t("filters.modals.size.title")}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={t("filters.modals.size.actions.close")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Size Presets */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {sizeRanges.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => handlePresetSelect(range)}
                  className={`p-3 sm:p-4 text-left border rounded-lg transition-all ${
                    selectedPreset === range.id
                      ? "border-brand-purple bg-brand-purple/10 ring-2 ring-brand-purple/20"
                      : "border-gray-300 hover:border-brand-purple hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm sm:text-base">
                    {range.labelKey ? t(range.labelKey) : range.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size Range Inputs */}
          {showCustomRange && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Minimum Size Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("filters.modals.size.min")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempMinSize}
                      onChange={(e) => handleSizeInput(e.target.value, "min")}
                      placeholder={t("filters.modals.size.placeholder.min")}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      m²
                    </span>
                  </div>
                </div>

                {/* Maximum Size Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("filters.modals.size.max")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempMaxSize}
                      onChange={(e) => handleSizeInput(e.target.value, "max")}
                      placeholder={t("filters.modals.size.placeholder.max")}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      m²
                    </span>
                  </div>
                </div>
              </div>

              {/* Size Range Display */}
              {(tempMinSize || tempMaxSize) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    {t("filters.modals.size.range")}: {" "}
                    <span className="font-medium">
                      {tempMinSize && tempMaxSize
                        ? t("filters.modals.size.rangeFormat", { min: tempMinSize, max: tempMaxSize })
                        : tempMinSize
                        ? t("filters.modals.size.overFormat", { size: tempMinSize })
                        : t("filters.modals.size.upToFormat", { size: tempMaxSize })
                      }
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Current Filter Display */}
          {hasActiveSizeFilter && !showCustomRange && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">
                {t("filters.modals.size.current")}: <span className="font-medium">{getFormattedSizeRange()}</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="modal-footer">
          <button 
            onClick={handleClear}
            className="btn-ghost btn-size-md text-accent-highlight"
          >
            {t("filters.modals.size.actions.clear")}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="btn-outline btn-size-md"
            >
              {t("filters.modals.size.actions.cancel")}
            </button>
            <button 
              onClick={handleApply}
              className="btn-primary btn-size-md"
            >
              {t("filters.modals.size.actions.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document root level
  return createPortal(modalContent, document.body);
}
