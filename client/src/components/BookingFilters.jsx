import { useState, useEffect } from "react";
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
              className="block w-full px-3 py-2.5 border border-border-light rounded-lg bg-bg-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors text-sm"
            />
          </div>

          {/* Sort and Actions - same row on desktop, wrapped on mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Sort dropdown with icon */}
            <div className="sm:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiArrowsUpDown className="h-4 w-4 text-text-muted" />
                </div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full pl-10 pr-8 py-2.5 border border-border-light rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors text-sm appearance-none"
                >
                  <option value="createdAt-desc">{t("filters.sortOptions.newestFirst")}</option>
                  <option value="createdAt-asc">{t("filters.sortOptions.oldestFirst")}</option>
                  <option value="checkInDate-asc">{t("filters.sortOptions.checkInDate")}</option>
                  <option value="totalPrice-desc">{t("filters.sortOptions.highestPrice")}</option>
                  <option value="totalPrice-asc">{t("filters.sortOptions.lowestPrice")}</option>
                  <option value="place-asc">{t("filters.sortOptions.propertyName")}</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Agent actions */}
            {user?.userType === 'agent' && (
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
          {/* Filter label with icon */}
          <div className="flex items-center gap-2 mb-3">
            <HiAdjustmentsHorizontal className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-secondary">{t("filters.filterByStatus")}</span>
          </div>

          {/* Status filters - with padding to prevent border cutoff */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide p-1 -m-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
