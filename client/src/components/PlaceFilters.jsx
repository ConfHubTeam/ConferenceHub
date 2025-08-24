import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import ActiveFilters, { FilterCreators } from "./ActiveFilters";

export default function PlaceFilters({
  user,
  searchTerm,
  setSearchTerm,
  onClearAllFilters
}) {
  const { t } = useTranslation('places');
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
    <div className="card-base mb-spacing-lg">
      <div className="card-content">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-secondary mb-2">
              {t('placeFilters.searchLabel', 'Search your conference rooms')}
            </label>
            <input
              id="search"
              type="text"
              placeholder={t('placeFilters.searchPlaceholder', 'Search by property name or address...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base text-primary"
            />
          </div>
        </div>
        
        {/* Active Filters */}
        <div className="mt-4">
          <ActiveFilters 
            filters={getActiveFilters()}
            onClearAllFilters={onClearAllFilters}
          />
        </div>
      </div>
    </div>
  );
}
