import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams as useRouterSearchParams } from "react-router-dom";
import { useAttendeesFilter, ATTENDEES_RANGES } from "../contexts/AttendeesFilterContext";

/**
 * AttendeesFilterModal Component
 * A reusable modal for attendees range selection that can be used across the application
 * Supports preset attendees ranges and custom attendees input
 * Features mobile-first responsive design with desktop optimization
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 */
export default function AttendeesFilterModal({ isOpen, onClose }) {
  const {
    minAttendees,
    maxAttendees,
    selectedRangeId,
    updateAttendeesRange,
    clearAttendeesFilter,
    getFormattedAttendeesRange,
    hasActiveAttendeesFilter,
    selectPredefinedRange
  } = useAttendeesFilter();

  // Get router search params for URL updates
  const [searchParams, setSearchParams] = useRouterSearchParams();

  // Local state for modal
  const [tempMinAttendees, setTempMinAttendees] = useState("");
  const [tempMaxAttendees, setTempMaxAttendees] = useState("");
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
      setTempMinAttendees(minAttendees ? minAttendees.toString() : "");
      setTempMaxAttendees(maxAttendees ? maxAttendees.toString() : "");
      
      // Determine selected preset based on current filter values
      if (hasActiveAttendeesFilter) {
        const matchingRange = ATTENDEES_RANGES.find(range => 
          range.min === minAttendees && range.max === maxAttendees
        );
        
        if (matchingRange) {
          setSelectedPreset(matchingRange.id);
          setShowCustomRange(matchingRange.id === "custom");
        } else {
          setSelectedPreset("custom");
          setShowCustomRange(true);
        }
      } else {
        setSelectedPreset(null);
        setShowCustomRange(false);
      }
    }
  }, [isOpen, minAttendees, maxAttendees, hasActiveAttendeesFilter]);

  // Handle preset selection
  const handlePresetSelect = useCallback((range) => {
    setSelectedPreset(range.id);
    
    if (range.id === "custom") {
      setShowCustomRange(true);
      return;
    }
    
    setShowCustomRange(false);
    
    // Use the preset values
    setTempMinAttendees(range.min ? range.min.toString() : "");
    setTempMaxAttendees(range.max ? range.max.toString() : "");
  }, []);

  // Handle input change with validation
  const handleAttendeesInput = (value, type) => {
    // Allow only numbers
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    
    if (type === "min") {
      setTempMinAttendees(sanitizedValue);
    } else {
      setTempMaxAttendees(sanitizedValue);
    }
    
    // If user is typing custom values, switch to custom preset
    if (sanitizedValue && selectedPreset !== "custom") {
      setSelectedPreset("custom");
      setShowCustomRange(true);
    }
  };

  // Handle apply button click
  const handleApply = () => {
    const min = tempMinAttendees ? parseInt(tempMinAttendees) : null;
    const max = tempMaxAttendees ? parseInt(tempMaxAttendees) : null;
    
    // Validate inputs
    if (min !== null && min < 1) {
      alert("Minimum attendees cannot be less than 1");
      return;
    }
    
    if (max !== null && max < 1) {
      alert("Maximum attendees cannot be less than 1");
      return;
    }
    
    if (min !== null && max !== null && min > max) {
      alert("Minimum attendees cannot be greater than maximum attendees");
      return;
    }
    
    // Update context state
    if (selectedPreset && selectedPreset !== "custom") {
      selectPredefinedRange(selectedPreset);
    } else {
      updateAttendeesRange(min, max, "custom");
    }
    
    // Update URL parameters
    updateUrlWithFilters(min, max, selectedPreset !== "custom" ? selectedPreset : null);
    
    onClose();
  };

  // Handle clear button click
  const handleClear = () => {
    setTempMinAttendees("");
    setTempMaxAttendees("");
    setSelectedPreset(null);
    setShowCustomRange(false);
    clearAttendeesFilter();
    
    // Clear URL parameters
    updateUrlWithFilters(null, null, null);
    
    onClose();
  };

  // Update URL with filter parameters
  const updateUrlWithFilters = (min, max, rangeId) => {
    const newParams = new URLSearchParams();
    
    // Keep existing parameters except attendees-related ones
    for (const [key, value] of searchParams.entries()) {
      if (value && value !== "undefined" && value !== "" && 
          !["minAttendees", "maxAttendees", "attendeesRange"].includes(key)) {
        newParams.set(key, value);
      }
    }
    
    // Add new attendees parameters if they exist
    if (min !== null && min !== undefined) {
      newParams.set("minAttendees", min.toString());
    }
    
    if (max !== null && max !== undefined) {
      newParams.set("maxAttendees", max.toString());
    }
    
    if (rangeId) {
      newParams.set("attendeesRange", rangeId);
    }
    
    setSearchParams(newParams, { replace: true });
  };

  // Only render when open
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 999999 }}>
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden relative z-[99999]"
        style={{ zIndex: 999999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0 bg-gray-50">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-purple flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Attendees Range
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">

          {/* Attendees Range Presets */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              {ATTENDEES_RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => handlePresetSelect(range)}
                  className={`p-2 sm:p-3 text-left border rounded-lg transition-all ${
                    selectedPreset === range.id
                      ? "border-brand-purple bg-brand-purple/10 ring-2 ring-brand-purple/20"
                      : "border-gray-300 hover:border-brand-purple hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-gray-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    {range.label}
                  </div>
                  {!range.isCustom && range.id !== "custom" && (
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {range.max ? `Up to ${range.max} people` : `${range.min}+ people`}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Attendees Range Inputs */}
          {showCustomRange && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Minimum Attendees Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum attendees
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempMinAttendees}
                      onChange={(e) => handleAttendeesInput(e.target.value, "min")}
                      placeholder="Min"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Maximum Attendees Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum attendees
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempMaxAttendees}
                      onChange={(e) => handleAttendeesInput(e.target.value, "max")}
                      placeholder="Max"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendees Range Display */}
              {(tempMinAttendees || tempMaxAttendees) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Attendees range: {" "}
                    <span className="font-medium">
                      {tempMinAttendees && tempMaxAttendees
                        ? `${tempMinAttendees} - ${tempMaxAttendees} attendees`
                        : tempMinAttendees
                        ? `${tempMinAttendees}+ attendees`
                        : `Up to ${tempMaxAttendees} attendees`
                      }
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Current Filter Display */}
          {hasActiveAttendeesFilter && !showCustomRange && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">
                Current filter: <span className="font-medium">{getFormattedAttendeesRange()}</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0 bg-white">
          <button 
            onClick={handleClear}
            className="text-brand-purple font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-purple px-2 py-1 rounded-md text-sm sm:text-base"
          >
            Clear
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 sm:px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button 
              onClick={handleApply}
              className="bg-brand-orange text-white rounded-lg px-4 sm:px-6 py-2 font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors text-sm sm:text-base"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document root level
  return createPortal(modalContent, document.body);
}
