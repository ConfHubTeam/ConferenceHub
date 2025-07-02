import React, { useState, useEffect } from "react";
import { usePerksFilter } from "../contexts/PerksFilterContext";

/**
 * PerksFilterModal - Modal component for perks filtering
 * 
 * Single Responsibility: Only handles perks filter modal UI and interactions
 * Open/Closed: Extensible for new UI features without modification
 * DRY: Reuses perks data and logic from context
 */
const PerksFilterModal = ({ isOpen, onClose }) => {
  const {
    selectedPerks,
    togglePerk,
    clearAllPerks,
    isPerkSelected,
    relevantPerksWithLabels,
    allPerksByCategory,
    hasSelectedPerks,
    selectedPerksCount
  } = usePerksFilter();

  // Local state for expanded view
  const [showAllPerks, setShowAllPerks] = useState(false);
  
  // Local state for expanded categories in all perks view
  const [expandedCategories, setExpandedCategories] = useState({});

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Toggle category expansion
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Don't render if modal is closed
  if (!isOpen) return null;

  // Get category icons from original PerkSelections component
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      "Audio Equipment": (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      ),
      "Visual Equipment": (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      "Technical Equipment": (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
        </svg>
      ),
      "Furniture": (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      "Miscellaneous": (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      "Safety": (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
      "Services": (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
        </svg>
      )
    };
    return iconMap[categoryName] || null;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[75vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Filter by Perks</h2>
            {hasSelectedPerks && (
              <span className="bg-primary text-white text-sm px-2 py-1 rounded-full">
                {selectedPerksCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {!showAllPerks ? (
            // Most Relevant Perks View
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {hasSelectedPerks && (
                  <button
                    onClick={clearAllPerks}
                    className="text-sm text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              {/* Relevant Perks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relevantPerksWithLabels.map((perk) => (
                  <label
                    key={perk.name}
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isPerkSelected(perk.name)}
                      onChange={() => togglePerk(perk.name)}
                      className="mr-3 h-4 w-4 accent-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">{perk.label}</span>
                  </label>
                ))}
              </div>

              {/* Show All Perks Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAllPerks(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  <span className="font-medium">Show all perks</span>
                </button>
              </div>
            </div>
          ) : (
            // All Perks View
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowAllPerks(false)}
                  className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  <span className="font-medium">Back to popular perks</span>
                </button>
                {hasSelectedPerks && (
                  <button
                    onClick={clearAllPerks}
                    className="text-sm text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    Clear all ({selectedPerksCount})
                  </button>
                )}
              </div>

              {/* All Perks by Category */}
              <div className="space-y-4">
                {Object.entries(allPerksByCategory).map(([categoryName, perks]) => (
                  <div key={categoryName} className="border rounded-xl overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(categoryName)}
                      className="w-full p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-primary">
                          {getCategoryIcon(categoryName)}
                        </div>
                        <span className="font-medium text-gray-900">{categoryName}</span>
                        {/* Show selected count for this category */}
                        {(() => {
                          const selectedInCategory = perks.filter(perk => isPerkSelected(perk.name)).length;
                          return selectedInCategory > 0 && (
                            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                              {selectedInCategory}
                            </span>
                          );
                        })()}
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform ${expandedCategories[categoryName] ? "rotate-180" : ""}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Category Content */}
                    {expandedCategories[categoryName] && (
                      <div className="bg-white p-4 space-y-2">
                        {perks.map((perk) => (
                          <label
                            key={perk.name}
                            className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isPerkSelected(perk.name)}
                              onChange={() => togglePerk(perk.name)}
                              className="mr-3 h-4 w-4 accent-primary"
                            />
                            <span className="text-sm text-gray-700">{perk.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <div className="text-sm text-gray-600">
              {hasSelectedPerks ? (
                `${selectedPerksCount} perk${selectedPerksCount === 1 ? "" : "s"} selected`
              ) : (
                "No perks selected"
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerksFilterModal;
