import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  onCleanupExpired // Add cleanup callback prop
}) {
  const { t } = useTranslation('booking');
  const location = useLocation();
  const navigate = useNavigate();
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-6">
      {/* Mobile: Compact Header with Search and Toggle */}
      <div className="p-3 sm:hidden border-b border-gray-100">
        {/* Search Bar - Always visible on mobile */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder={t(`filters.searchPlaceholders.${user?.userType || 'client'}`)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Quick Status Filter - Horizontal scroll */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <StatusFilter
              userType={user?.userType}
              currentStatus={statusFilter}
              onStatusChange={setStatusFilter}
              stats={stats}
              size="compact"
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Expand/Collapse Button for Additional Options */}
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>{isFiltersExpanded ? t("filters.hideOptions") : t("filters.moreOptions")}</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isFiltersExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Mobile: Collapsible Additional Options */}
      <div className={`sm:hidden transition-all duration-300 overflow-hidden ${isFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 border-t border-gray-100 space-y-3">
          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("filters.sortBy")}
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
            >
              <option value="createdAt-desc">{t("filters.sortOptions.newestFirst")}</option>
              <option value="createdAt-asc">{t("filters.sortOptions.oldestFirst")}</option>
              <option value="checkInDate-asc">{t("filters.sortOptions.checkInDate")}</option>
              <option value="totalPrice-desc">{t("filters.sortOptions.highestPrice")}</option>
              <option value="totalPrice-asc">{t("filters.sortOptions.lowestPrice")}</option>
              <option value="place-asc">{t("filters.sortOptions.propertyName")}</option>
            </select>
          </div>

          {/* Agent Actions */}
          {user?.userType === 'agent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("filters.agentActions")}
              </label>
              <button
                onClick={onCleanupExpired}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-error-600 hover:bg-error-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t("filters.cleanupExpiredBookings")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Traditional Layout (unchanged for larger screens) */}
      <div className="hidden sm:block p-4 lg:p-6">
        <div className="flex flex-col gap-4">
          {/* Desktop: Search and Sort in Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search-desktop" className="block text-sm font-medium text-gray-700 mb-2">
                {t("filters.searchBookings")}
              </label>
              <div className="relative">
                <input
                  id="search-desktop"
                  type="text"
                  placeholder={t(`filters.searchPlaceholders.${user?.userType || 'client'}`)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white"
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

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t("filters.filterByStatus")}
            </label>
            <StatusFilter
              userType={user?.userType}
              currentStatus={statusFilter}
              onStatusChange={setStatusFilter}
              stats={stats}
              size="default"
            />
          </div>

          {/* Agent Actions */}
          {user?.userType === 'agent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("filters.agentActions")}
              </label>
              <button
                onClick={onCleanupExpired}
                className="inline-flex items-center px-4 py-2.5 bg-error-600 hover:bg-error-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t("filters.cleanupExpiredBookings")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
