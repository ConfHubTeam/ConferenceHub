import React from "react";
import { createPortal } from "react-dom";
import { usePoliciesFilter } from "../contexts/PoliciesFilterContext";

// Policy Filter Modal Component following Single Responsibility Principle
export default function PolicyFilterModal({ isOpen, onClose }) {
  // Get policy filter state and actions from context
  const {
    selectedPolicies,
    togglePolicy,
    clearAllPolicies,
    isPolicySelected,
    relevantPoliciesWithLabels,
    hasSelectedPolicies,
    selectedPoliciesCount
  } = usePoliciesFilter();

  // Handle policy selection following Single Responsibility
  const handlePolicyToggle = (policyKey) => {
    togglePolicy(policyKey);
  };

  // Clear all selections
  const handleClearAll = () => {
    clearAllPolicies();
  };

  // Modal close handler
  const handleClose = () => {
    onClose();
  };

  // Early return if modal is not open - performance optimization
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      {/* Modal Container - Responsive design with mobile-first approach */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Modal Header - Fixed */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b flex-shrink-0 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h4.125M8.25 8.25V6.108" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                Refund Policies
              </h2>
              {hasSelectedPolicies && (
                <p className="text-xs text-gray-600">
                  {selectedPoliciesCount} {selectedPoliciesCount === 1 ? 'policy' : 'policies'} selected
                </p>
              )}
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 p-1.5 sm:p-2 overflow-y-auto">
          
          {/* Policy List - Responsive grid layout */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-1 sm:gap-1.5">
            {relevantPoliciesWithLabels.map((policy) => (
              <label
                key={policy.key}
                className="flex items-start p-1.5 sm:p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={isPolicySelected(policy.key)}
                  onChange={() => handlePolicyToggle(policy.key)}
                  className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 flex-shrink-0"
                />
                <div className="ml-1.5 sm:ml-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs sm:text-sm">{policy.icon}</span>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">
                      {policy.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">
                    {policy.detailedDescription || policy.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Show message if no policies available */}
          {relevantPoliciesWithLabels.length === 0 && (
            <div className="text-center py-4 sm:py-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No policies available</h3>
              <p className="text-sm text-gray-500">No policies found.</p>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed */}
        <div className="border-t border-gray-200 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 bg-gray-50 flex-shrink-0">
          <div className="flex flex-row gap-2 justify-between">
            {hasSelectedPolicies && (
              <button
                onClick={handleClearAll}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
              >
                Clear all ({selectedPoliciesCount})
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
