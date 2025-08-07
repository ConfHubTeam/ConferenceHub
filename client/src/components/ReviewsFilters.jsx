import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * ReviewsFilters Component
 * 
 * Mobile-first design for reviews filtering interface
 * Follows DRY and SOLID principles with progressive disclosure for mobile
 */
export default function ReviewsFilters({
  searchTerm,
  setSearchTerm,
  debouncedSearchTerm,
  filterRating,
  setFilterRating,
  filterReported,
  setFilterReported,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  clearAllFilters,
  totalReviews,
  selectedReviews,
  handleBulkDelete,
  loading
}) {
  const { t } = useTranslation("reviews");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Clear individual search
  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-6">
      {/* Mobile: Compact Header with Search and Quick Filters */}
      <div className="p-3 sm:hidden border-b border-gray-100">
        {/* Search Bar - Always visible on mobile */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder={t("management.search.placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {searchTerm !== debouncedSearchTerm && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Quick Rating Filter - Horizontal scroll */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <RatingFilterButton
              value="all"
              isActive={filterRating === "all"}
              onClick={() => setFilterRating("all")}
              label={t("management.filters.rating.all")}
              count={totalReviews}
            />
            {[5, 4, 3, 2, 1].map(rating => (
              <RatingFilterButton
                key={rating}
                value={rating.toString()}
                isActive={filterRating === rating.toString()}
                onClick={() => setFilterRating(rating.toString())}
                label={`${rating}★`}
                count={0} // You can add actual counts if available
              />
            ))}
          </div>
        </div>

        {/* Expand/Collapse Button for Additional Options */}
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>{isFiltersExpanded ? t("management.filters.hideOptions") : t("management.filters.moreOptions")}</span>
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
          {/* Report Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("management.filters.reported.label")}
            </label>
            <select
              value={filterReported}
              onChange={(e) => setFilterReported(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
            >
              <option value="all">{t("management.filters.reported.all")}</option>
              <option value="reported">{t("management.filters.reported.reported")}</option>
              <option value="no_reports">{t("management.filters.reported.notReported")}</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("management.filters.dateRange.startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("management.filters.dateRange.endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearAllFilters}
            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            {t("management.filters.clearAllFilters")}
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar - Appears when reviews are selected */}
      {selectedReviews.length > 0 && (
        <div className="sm:hidden bg-blue-50 border-t border-blue-100 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedReviews.length} {t("management.table.selectAll").toLowerCase()}
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="px-3 py-2 bg-error-600 text-white text-sm font-medium rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
            >
              {t("management.actions.bulkDelete")}
            </button>
          </div>
        </div>
      )}

      {/* Desktop: Traditional Layout */}
      <div className="hidden sm:block p-4 lg:p-6">
        <div className="flex flex-col gap-4">
          {/* Desktop: Search and Actions Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder={t("management.search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Bulk Actions - Desktop */}
            {selectedReviews.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedReviews.length} {t("management.table.selectAll").toLowerCase()}
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-error-600 text-white text-sm font-medium rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
                >
                  {t("management.actions.bulkDelete")}
                </button>
              </div>
            )}
          </div>

          {/* Desktop: Filter Row */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="all">{t("management.filters.rating.all")}</option>
              <option value="5">{t("management.filters.rating.option", { rating: 5 })}</option>
              <option value="4">{t("management.filters.rating.option", { rating: 4 })}</option>
              <option value="3">{t("management.filters.rating.option", { rating: 3 })}</option>
              <option value="2">{t("management.filters.rating.option", { rating: 2 })}</option>
              <option value="1">{t("management.filters.rating.option", { rating: 1 })}</option>
            </select>

            <select
              value={filterReported}
              onChange={(e) => setFilterReported(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="all">{t("management.filters.reported.all")}</option>
              <option value="reported">{t("management.filters.reported.reported")}</option>
              <option value="no_reports">{t("management.filters.reported.notReported")}</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("management.filters.dateRange.startDate")}
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("management.filters.dateRange.endDate")}
            />

            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              {t("management.filters.clearAllFilters")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Rating Filter Button Component
 * Reusable button for rating filters in mobile view
 */
const RatingFilterButton = ({ value, isActive, onClick, label, count }) => {
  const baseClasses = "px-3 py-2 border-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0";
  const activeClasses = isActive 
    ? "bg-primary text-white border-primary" 
    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";

  return (
    <button
      onClick={() => onClick(value)}
      className={`${baseClasses} ${activeClasses}`}
      aria-pressed={isActive}
    >
      <span className="flex items-center gap-1.5">
        <span>{label}</span>
        {count !== undefined && (
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {count}
          </span>
        )}
      </span>
    </button>
  );
};
