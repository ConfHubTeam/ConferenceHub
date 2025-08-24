import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HiAdjustmentsHorizontal, HiArrowsUpDown } from "react-icons/hi2";
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
  const { t } = useTranslation(['booking', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sort options
  const sortOptions = [
    { value: "createdAt-desc", label: t("filters.sortOptions.newestFirst") },
    { value: "createdAt-asc", label: t("filters.sortOptions.oldestFirst") },
    { value: "checkInDate-asc", label: t("filters.sortOptions.checkInDate") },
    { value: "totalPrice-desc", label: t("filters.sortOptions.highestPrice") },
    { value: "totalPrice-asc", label: t("filters.sortOptions.lowestPrice") },
    { value: "place-asc", label: t("filters.sortOptions.propertyName") },
  ];

  const currentSortValue = `${sortBy}-${sortOrder}`;
  const currentSortLabel = sortOptions.find(option => option.value === currentSortValue)?.label || sortOptions[0].label;

  return (
    <div className="bg-bg-card border border-border-light rounded-lg shadow-ui p-4 sm:p-6 mb-4 sm:mb-6">
      {/* Modern unified layout for all screen sizes */}
      <div className="space-y-4">
        
        {/* Top row: Search, Sort, and Agent Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search input */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(`filters.searchPlaceholders.${user?.userType || 'client'}`)}
              className="block w-full px-3 py-2.5 border border-border-default rounded-xl bg-bg-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary shadow-ui transition-all duration-200 text-sm"
            />
          </div>

          {/* Sort and Actions - same row on desktop, wrapped on mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Sort dropdown with icon */}
            <div className="sm:w-48">
              <div className="relative" ref={sortDropdownRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiArrowsUpDown className="h-4 w-4 text-text-muted" />
                </div>
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className={`w-full pl-10 pr-8 py-2.5 text-sm border border-border-default rounded-xl bg-bg-card text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary shadow-ui transition-all duration-200 flex items-center justify-between ${
                    isSortDropdownOpen ? "ring-2 ring-accent-primary border-accent-primary" : ""
                  }`}
                >
                  <span className="truncate">{currentSortLabel}</span>
                </button>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Custom dropdown menu */}
                {isSortDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-bg-card border border-border-light rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {sortOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            const [field, order] = option.value.split("-");
                            setSortBy(field);
                            setSortOrder(order);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            currentSortValue === option.value 
                              ? "bg-accent-primary text-white hover:bg-accent-hover" 
                              : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agent actions - Show cleanup button only when there are expired bookings in selected/pending status */}
            {user?.userType === 'agent' && stats?.hasExpiredPendingBookings && (
              <div className="flex-shrink-0">
                <button
                  onClick={onCleanupExpired}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-status-error hover:bg-status-error-dark text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-status-error focus:ring-offset-2 w-full sm:w-auto justify-center"
                  title={t("filters.cleanupExpiredBookings")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden lg:inline">{t("filters.cleanupExpiredBookings")}</span>
                  <span className="lg:hidden">{t("common:buttons.clear")}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom section: Status filters only */}
        <div>
          {/* Status filters - StatusFilter now handles its own spacing */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <StatusFilter
              userType={user?.userType}
              currentStatus={statusFilter}
              onStatusChange={setStatusFilter}
              stats={stats}
              size="default"
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
