import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ActiveFilters, { FilterCreators } from "./ActiveFilters";
import StatusFilter from "./StatusFilter";

export default function BookingFilters({
  user,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  stats,
  onClearAllFilters,
  onCleanupExpired // Add cleanup callback prop
}) {
  const { t } = useTranslation('booking');
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to get active filters
  const getActiveFilters = () => {
    const filters = [];
    
    if (searchTerm) {
      filters.push(FilterCreators.search(searchTerm, () => setSearchTerm("")));
    }
    
    if (statusFilter !== "pending" && statusFilter !== "all") {
      filters.push(FilterCreators.status(statusFilter, () => setStatusFilter("pending")));
    }
    
    return filters;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Mobile: Search Bar First (Most Important) - Hidden on desktop */}
        <div className="order-1 lg:hidden">
          <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            {t("filters.searchBookings")}
          </label>
          <input
            id="search"
            type="text"
            placeholder={t(`filters.searchPlaceholders.${user?.userType || 'client'}`)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
          />
        </div>

        {/* Desktop: Search and Sort in Row | Mobile: Search and Sort in Row */}
        <div className="order-2 lg:order-1 grid grid-cols-1 gap-2 sm:gap-3 lg:flex lg:gap-4">
          {/* Search - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block lg:flex-1">
            <label htmlFor="search-desktop" className="block text-sm font-medium text-gray-700 mb-2">
              {t("filters.searchBookings")}
            </label>
            <input
              id="search-desktop"
              type="text"
              placeholder={t(`filters.searchPlaceholders.${user?.userType || 'client'}`)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
            />
          </div>

          {/* Status Filter - Removed dropdown, will be added as separate section */}

          {/* Sort Options */}
          <div className="lg:w-48">
            <label htmlFor="sort" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              {t("filters.sortBy")}
            </label>
            <select
              id="sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-xs sm:text-sm appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "12px"
              }}
            >
              <option value="createdAt-desc">{t("filters.sortOptions.newestFirst")}</option>
              <option value="createdAt-asc">{t("filters.sortOptions.oldestFirst")}</option>
              <option value="checkInDate-asc">{t("filters.sortOptions.checkInDate")}</option>
              <option value="totalPrice-desc">{t("filters.sortOptions.highestPrice")}</option>
              <option value="totalPrice-asc">{t("filters.sortOptions.lowestPrice")}</option>
              <option value="place-asc">{t("filters.sortOptions.propertyName")}</option>
            </select>
          </div>
        </div>

        {/* Status Filter - Clickable buttons instead of dropdown */}
        <div className="order-3 lg:order-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            {t("filters.filterByStatus")}
          </label>
          <StatusFilter
            userType={user?.userType}
            currentStatus={statusFilter}
            onStatusChange={setStatusFilter}
            stats={stats}
            className="w-full"
            size="default"
          />
        </div>

        {/* Agent Actions - Cleanup expired bookings */}
        {user?.userType === 'agent' && (
          <div className="order-4 lg:order-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              {t("filters.agentActions")}
            </label>
            <button
              onClick={onCleanupExpired}
              className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t("filters.cleanupExpiredBookings")}
            </button>
          </div>
        )}
      </div>
      
      {/* Active Filters */}
      <ActiveFilters 
        filters={getActiveFilters()}
        onClearAllFilters={onClearAllFilters}
      />
    </div>
  );
}
