import { useState } from "react";

/**
 * Review Filters Component
 * US-R006: Filter options for review management
 * Follows SOLID principles with single responsibility for filtering UI
 * Implements DRY principles with reusable filter components
 */
export default function ReviewFilters({ filters, onFilterChange, loading }) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Handle input changes (DRY principle)
  const handleInputChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters (removed status since all reviews are auto-approved)
  const handleClearFilters = () => {
    const clearedFilters = {
      rating: "all",
      startDate: "",
      endDate: "",
      search: ""
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          Filters
        </h3>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rating Filter */}
          <div className="space-y-1">
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
              Rating
            </label>
            <select
              id="rating"
              value={localFilters.rating}
              onChange={(e) => handleInputChange("rating", e.target.value)}
              disabled={loading}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm disabled:opacity-50 disabled:bg-gray-100"
            >
              <option value="all">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
              <option value="2">⭐⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div className="space-y-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              From Date
            </label>
            <input
              type="date"
              id="startDate"
              value={localFilters.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              disabled={loading}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm disabled:opacity-50 disabled:bg-gray-100"
            />
          </div>

          {/* End Date Filter */}
          <div className="space-y-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              To Date
            </label>
            <input
              type="date"
              id="endDate"
              value={localFilters.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              disabled={loading}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm disabled:opacity-50 disabled:bg-gray-100"
            />
          </div>

          {/* Search Filter */}
          <div className="space-y-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search reviews..."
                value={localFilters.search}
                onChange={(e) => handleInputChange("search", e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm disabled:opacity-50 disabled:bg-gray-100"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleClearFilters}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
