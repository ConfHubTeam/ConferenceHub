import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ActiveFilters, { FilterCreators } from "./ActiveFilters";

export default function PlaceFilters({
  user,
  searchTerm,
  setSearchTerm,
  onClearAllFilters
}) {
  const location = useLocation();

  // Helper function to get active filters
  const getActiveFilters = () => {
    const filters = [];
    
    if (searchTerm) {
      filters.push(FilterCreators.search(searchTerm, () => setSearchTerm("")));
    }
    
    return filters;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search your conference rooms
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by property name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
          />
        </div>
      </div>
      
      {/* Active Filters */}
      <ActiveFilters 
        filters={getActiveFilters()}
        onClearAllFilters={onClearAllFilters}
      />
    </div>
  );
}
