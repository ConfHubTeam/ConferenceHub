import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/config";
import DatePicker from "./DatePicker";

/**
 * ReviewsFilters Component
 * 
 * Mobile-first design for reviews filtering interface
 * Follows DRY and SOLID principles with progressive disclosure for mobile
 * Updated to              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t("management.actions.deleteAll")}ch platform design system and UI requirements
 */
export default function ReviewsFilters({
  searchTerm,
  setSearchTerm,
  debouncedSearchTerm,
  filterRating,
  setFilterRating,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  sortBy,
  setSortBy,
  clearAllFilters,
  totalReviews,
  selectedReviews,
  handleBulkDelete,
  loading
}) {
  const { t } = useTranslation("reviews");
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  const ratingDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Clear individual search
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ratingDropdownRef.current && !ratingDropdownRef.current.contains(event.target)) {
        setIsRatingDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get display text for rating filter
  const getRatingDisplayText = () => {
    if (filterRating === "all") return t("management.filters.rating.all");
    return "★".repeat(parseInt(filterRating));
  };

  // Get sort display text
  const getSortDisplayText = () => {
    const selectedOption = sortOptions.find(option => option.value === sortBy);
    return selectedOption ? `${selectedOption.icon} ${selectedOption.label}` : sortOptions[0].label;
  };

  // Clear dates
  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // Sorting options with icons
  const sortOptions = [
    { value: "newest", label: t("management.sorting.newest"), icon: "↓" },
    { value: "oldest", label: t("management.sorting.oldest"), icon: "↑" },
    { value: "rating_high", label: t("management.sorting.rating_high"), icon: "★" },
    { value: "rating_low", label: t("management.sorting.rating_low"), icon: "☆" },
  ];

  return (
    <div className="card-base mb-4 sm:mb-6 bg-bg-card border-border-light">
      {/* Mobile: Compact Layout */}
      <div className="sm:hidden">
        <div className="spacing-card">
          {/* Row 1: Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t("management.search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-border-default rounded-lg bg-bg-card text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1"
                  aria-label={t("management.search.clear")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="loading-spinner w-4 h-4"></div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Date Range Picker */}
          <div className="mb-4">
            <div className="flex gap-2">
              {/* Start Date */}
              <div className="flex-1">
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder={t("management.filters.dateRange.startDate")}
                  className="w-full px-3 py-2.5 text-sm border border-border-default rounded-xl bg-bg-card text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200"
                  aria-label={t("management.filters.dateRange.startDate")}
                />
              </div>
              
              {/* End Date */}
              <div className="flex-1">
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder={t("management.filters.dateRange.endDate")}
                  className="w-full px-3 py-2.5 text-sm border border-border-default rounded-xl bg-bg-card text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200"
                  aria-label={t("management.filters.dateRange.endDate")}
                  minDate={startDate} // End date should be after start date
                />
              </div>
            </div>
          </div>

          {/* Row 3: Rating and Sorting */}
          <div className="flex items-center gap-2 mb-4">
            {/* Rating Filter Dropdown */}
            <div className="flex-1 relative" ref={ratingDropdownRef}>
              <button
                onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
                className={`w-full px-3 py-2.5 text-sm border border-border-default rounded-xl bg-bg-card text-accent-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200 flex items-center justify-between ${
                  filterRating !== "all" 
                    ? "ring-2 ring-accent-primary border-accent-primary" 
                    : ""
                }`}
              >
                <span className="truncate">{getRatingDisplayText()}</span>
                <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isRatingDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-light rounded-lg shadow-lg z-50 min-w-[120px]">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilterRating("all");
                        setIsRatingDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        filterRating === "all" 
                          ? "bg-accent-primary text-white hover:bg-accent-hover" 
                          : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                      }`}
                    >
                      {t("management.filters.rating.all")}
                    </button>
                    {[5, 4, 3, 2, 1].map(rating => (
                      <button
                        key={rating}
                        onClick={() => {
                          setFilterRating(rating.toString());
                          setIsRatingDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          filterRating === rating.toString() 
                            ? "bg-accent-primary text-white hover:bg-accent-hover" 
                            : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                        }`}
                      >
                        <span className={`${
                          filterRating === rating.toString() 
                            ? "text-white" 
                            : "text-accent-primary"
                        }`}>{"★".repeat(rating)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex-1 relative" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className={`w-full px-3 py-2.5 text-sm border border-border-default rounded-xl bg-bg-card text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200 flex items-center justify-between ${
                  isSortDropdownOpen ? "ring-2 ring-accent-primary border-accent-primary" : ""
                }`}
              >
                <span className="truncate">{getSortDisplayText()}</span>
                <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isSortDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-light rounded-lg shadow-lg z-50 min-w-[140px]">
                  <div className="py-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          sortBy === option.value 
                            ? "bg-accent-primary text-white hover:bg-accent-hover" 
                            : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span className="truncate">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clear All Filters Row - Only show if filters are active */}
          {(searchTerm || filterRating !== "all" || startDate || endDate) && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <button
                onClick={clearAllFilters}
                className="w-full px-3 py-2 text-sm font-medium text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-border-light rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t("management.filters.clearAllFilters")}
              </button>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar - Appears when reviews are selected */}
        {selectedReviews.length > 0 && (
          <div className="spacing-card">
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white hover:bg-error-700 disabled:opacity-50 transition-colors rounded-lg font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t("management.actions.delete")}
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Enhanced Compact Layout */}
      <div className="hidden sm:block">
        <div className="px-6 py-6 flex flex-col gap-4">
          {/* Desktop Row 1: Search Bar + Date Picker (Right Aligned) */}
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-lg relative">
              <input
                type="text"
                placeholder={t("management.search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-3 border border-border-default rounded-lg bg-bg-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200 shadow-ui"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1 rounded-md hover:bg-white"
                  aria-label={t("management.search.clear")}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="loading-spinner w-5 h-5"></div>
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="flex gap-4">
              {/* Start Date */}
              <div className="w-48">
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder={t("management.filters.dateRange.startDate")}
                  className="w-full px-4 py-3 text-sm border border-border-default rounded-xl bg-bg-card text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200 shadow-ui"
                  aria-label={t("management.filters.dateRange.startDate")}
                />
              </div>
              
              {/* End Date */}
              <div className="w-48">
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder={t("management.filters.dateRange.endDate")}
                  className="w-full px-4 py-3 text-sm border border-border-default rounded-xl bg-bg-card text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200 shadow-ui"
                  aria-label={t("management.filters.dateRange.endDate")}
                  minDate={startDate} // End date should be after start date
                />
              </div>
            </div>
          </div>

          {/* Desktop Row 2: Rating + Sorting (Right Aligned) */}
          <div className="flex items-center justify-end gap-4">
            {/* Rating Filter Dropdown */}
            <div className="relative" ref={ratingDropdownRef}>
              <button
                onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
                className={`px-4 py-3 text-sm border border-border-default rounded-xl bg-bg-card text-accent-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-200 shadow-ui flex items-center justify-between min-w-[140px] ${
                  filterRating !== "all" 
                    ? "ring-2 ring-accent-primary border-accent-primary" 
                    : ""
                }`}
              >
                <span className="truncate">{getRatingDisplayText()}</span>
                <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isRatingDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-light rounded-lg shadow-lg z-50 min-w-[160px]">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilterRating("all");
                        setIsRatingDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        filterRating === "all" 
                          ? "bg-accent-primary text-white hover:bg-accent-hover" 
                          : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                      }`}
                    >
                      {t("management.filters.rating.all")}
                    </button>
                    {[5, 4, 3, 2, 1].map(rating => (
                      <button
                        key={rating}
                        onClick={() => {
                          setFilterRating(rating.toString());
                          setIsRatingDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          filterRating === rating.toString() 
                            ? "bg-accent-primary text-white hover:bg-accent-hover" 
                            : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                        }`}
                      >
                        <span className={`text-base ${
                          filterRating === rating.toString() 
                            ? "text-white" 
                            : "text-accent-primary"
                        }`}>{"★".repeat(rating)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="min-w-[180px] relative" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className={`w-full px-4 py-3 text-sm border border-border-default rounded-xl bg-bg-card text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary shadow-ui transition-all duration-200 flex items-center justify-between ${
                  isSortDropdownOpen ? "ring-2 ring-accent-primary border-accent-primary" : ""
                }`}
              >
                <span className="truncate">{getSortDisplayText()}</span>
                <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isSortDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-light rounded-lg shadow-lg z-50 min-w-[200px]">
                  <div className="py-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          sortBy === option.value 
                            ? "bg-accent-primary text-white hover:bg-accent-hover" 
                            : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span className="truncate">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterRating !== "all" || startDate || endDate) && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-3 bg-bg-secondary hover:bg-border-light text-text-secondary hover:text-text-primary font-medium rounded-lg transition-colors border border-border-default hover:border-accent-primary flex items-center gap-2 shadow-ui"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t("management.filters.clearAllFilters")}
              </button>
            )}
          </div>

          {/* Bulk Actions - Desktop */}
          {selectedReviews.length > 0 && (
            <div className="flex justify-start">
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white hover:bg-error-700 disabled:opacity-50 transition-colors rounded-lg font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t("management.actions.deleteAll")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Rating Filter Button Component
 * Reusable button for rating filters in mobile view
 * Updated to match platform design system
 */
const RatingFilterButton = ({ value, isActive, onClick, label, count }) => {
  const baseClasses = "filter-pill text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 hover:shadow-sm";
  const activeClasses = isActive 
    ? "bg-accent-primary text-white border-accent-primary shadow-ui hover:bg-accent-hover" 
    : "bg-bg-card text-text-primary border-border-default hover:bg-accent-primary/10 hover:text-accent-primary hover:border-accent-primary";

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
            isActive ? 'bg-white/20 text-white' : 'bg-bg-secondary text-text-muted'
          }`}>
            {count}
          </span>
        )}
      </span>
    </button>
  );
};
