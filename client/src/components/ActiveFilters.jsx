import React from "react";
import { useTranslation } from "react-i18next";

/**
 * ActiveFilters Component
 * 
 * A reusable component for displaying active filters with badges
 * that can be used across different pages (bookings, users, places)
 */
export default function ActiveFilters({ 
  filters = [],
  onClearFilter,
  onClearAllFilters,
  className = ""
}) {
  const { t } = useTranslation('booking');
  
  // Don't render anything if no filters are active
  if (!filters.length) return null;

  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600 mr-2">{t("filters.activeFilters")}</span>
        
        {filters.map((filter, index) => (
          <span 
            key={filter.key || index}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${filter.colorClass || 'bg-blue-100 text-blue-800'}`}
          >
            {filter.label}
            {filter.onClear && (
              <button
                onClick={() => onClearFilter ? onClearFilter(filter.key) : filter.onClear()}
                className={`ml-2 hover:opacity-80 transition-opacity ${filter.buttonColorClass || 'text-blue-600 hover:text-blue-800'}`}
                aria-label={t("filters.removeFilter", { filterName: filter.label })}
              >
                ×
              </button>
            )}
          </span>
        ))}
        
        {/* Clear all filters button */}
        {filters.length > 1 && onClearAllFilters && (
          <button
            onClick={onClearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
          >
            {t("filters.clearAllFilters")}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Helper function to create filter objects with consistent structure
 */
export const createFilter = (key, label, onClear, colorClass = 'bg-blue-100 text-blue-800', buttonColorClass = 'text-blue-600 hover:text-blue-800') => ({
  key,
  label,
  onClear,
  colorClass,
  buttonColorClass
});

/**
 * Common filter creators for different types
 */
export const FilterCreators = {
  user: (user, onClear) => createFilter(
    'user',
    `User: ${user?.name || 'Unknown'}`,
    onClear,
    'bg-blue-100 text-blue-800',
    'text-blue-600 hover:text-blue-800'
  ),
  
  host: (host, onClear) => createFilter(
    'host',
    `Host: ${host?.name || 'Unknown'}`,
    onClear,
    'bg-green-100 text-green-800',
    'text-green-600 hover:text-green-800'
  ),
  
  search: (searchTerm, onClear) => createFilter(
    'search',
    `Search: "${searchTerm}"`,
    onClear,
    'bg-purple-100 text-purple-800',
    'text-purple-600 hover:text-purple-800'
  ),
  
  status: (status, onClear) => createFilter(
    'status',
    `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    onClear,
    'bg-yellow-100 text-yellow-800',
    'text-yellow-600 hover:text-yellow-800'
  ),
  
  userType: (userType, onClear) => createFilter(
    'userType',
    `Type: ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
    onClear,
    'bg-indigo-100 text-indigo-800',
    'text-indigo-600 hover:text-indigo-800'
  ),
  
  dateRange: (startDate, endDate, onClear) => createFilter(
    'dateRange',
    `Date: ${startDate} - ${endDate}`,
    onClear,
    'bg-teal-100 text-teal-800',
    'text-teal-600 hover:text-teal-800'
  ),
  
  custom: (key, label, onClear, colorClass, buttonColorClass) => createFilter(
    key,
    label,
    onClear,
    colorClass,
    buttonColorClass
  )
};
