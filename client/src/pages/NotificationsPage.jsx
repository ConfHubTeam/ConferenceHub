/**
 * Notifications Page
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles notification display and management
 * - Open/Closed: Extensible for new notification types
 * - Interface Segregation: Focused on notification UI operations
 * 
 * Implements DRY principle by reusing notification components
 * US-R011 compliant notification interface
 */

import { useState, useEffect, useContext, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useReviewNotifications } from "../contexts/ReviewNotificationContext";
import { useNotification } from "../components/NotificationContext";
import AccountNav from "../components/AccountNav";
import Pagination from "../components/Pagination";

export default function NotificationsPage() {
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    getNotificationDisplayData
  } = useReviewNotifications();

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread
  const [itemsPerPage] = useState(20); // Keep this for consistency with backend
  const [loadingPage, setLoadingPage] = useState(false); // Loading state for page changes
  const [hasInitialized, setHasInitialized] = useState(false); // Track if we've made initial load attempt

  /**
   * Load notifications with pagination - modified to not append data
   */
  const handleLoadNotifications = useCallback(async (page = 1, reset = false, filterOverride = null) => {
    const currentFilter = filterOverride || filter;
    try {
      // Only show page loading for page changes, not initial loads or filter changes
      if (page !== 1 && !reset && !filterOverride) {
        setLoadingPage(true);
      }

      const paginationData = await loadNotifications({
        page,
        limit: itemsPerPage,
        unreadOnly: currentFilter === "unread",
        append: false // Always replace data for traditional pagination
      });

      if (paginationData) {
        setPagination(paginationData);
        setCurrentPage(page);
      }
      
      // Mark as initialized after first load attempt
      setHasInitialized(true);
    } catch (error) {
      console.error("Error loading notifications:", error);
      notify("Failed to load notifications", "error");
      // Still mark as initialized even on error to prevent infinite loops
      setHasInitialized(true);
    } finally {
      setLoadingPage(false);
    }
  }, [loadNotifications, notify, filter, itemsPerPage]);

  /**
   * Handle page change for pagination
   */
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      // Update URL with current page
      const newSearchParams = new URLSearchParams(searchParams);
      if (page === 1) {
        newSearchParams.delete('page');
      } else {
        newSearchParams.set('page', page.toString());
      }
      setSearchParams(newSearchParams);
      
      handleLoadNotifications(page);
      // Scroll to top of notifications when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [handleLoadNotifications, pagination?.totalPages, searchParams, setSearchParams]);

  /**
   * Mark notification as read and handle navigation
   */
  const handleNotificationClick = useCallback(async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
      
      // Navigation is handled by Link component
    } catch (error) {
      console.error("Error marking notification as read:", error);
      notify("Failed to mark notification as read", "error");
    }
  }, [markAsRead, notify]);

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const updatedCount = await markAllAsRead();
      notify(`${updatedCount} notifications marked as read`, "success");
      // Reload notifications to reflect the change
      handleLoadNotifications(1, true);
    } catch (error) {
      console.error("Error marking all as read:", error);
      notify("Failed to mark all notifications as read", "error");
    }
  }, [markAllAsRead, notify, handleLoadNotifications]);

  /**
   * Filter change handler
   */
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setPagination(null);
    setHasInitialized(false); // Reset initialization state when filter changes
    // Update URL params to reflect the filter change and reset page to 1
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('filter', newFilter);
    setSearchParams(newSearchParams);
    // Immediately reload notifications with new filter
    if (user) {
      handleLoadNotifications(1, true, newFilter);
    }
  }, [setSearchParams, user, handleLoadNotifications]);

  // Initialize filter and page from URL params or default values
  useEffect(() => {
    if (!user) return;

    const urlFilter = searchParams.get("filter");
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    
    let targetFilter = filter;
    let targetPage = currentPage;
    let shouldLoadNotifications = false;
    let shouldSetFilter = false;
    let shouldSetPage = false;

    // Handle filter from URL
    if (urlFilter === "unread" || urlFilter === "all") {
      // URL has a valid filter
      if (filter !== urlFilter) {
        setFilter(urlFilter);
        targetFilter = urlFilter;
        shouldLoadNotifications = true;
        shouldSetFilter = true;
      }
    } else if (!urlFilter) {
      // No URL filter - determine default behavior
      if (unreadCount > 0) {
        // Default to unread if there are unread notifications
        setFilter("unread");
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set("filter", "unread");
          return newParams;
        }, { replace: true });
        targetFilter = "unread";
        shouldLoadNotifications = true;
        shouldSetFilter = true;
      } else {
        // Default to all if no unread notifications
        setFilter("all");
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set("filter", "all");
          return newParams;
        }, { replace: true });
        targetFilter = "all";
        shouldLoadNotifications = true;
        shouldSetFilter = true;
      }
    }

    // Handle page from URL
    if (urlPage > 0 && urlPage !== currentPage) {
      setCurrentPage(urlPage);
      targetPage = urlPage;
      shouldLoadNotifications = true;
      shouldSetPage = true;
    }

    // Load notifications if filter or page changed, or this is the initial load
    if (shouldLoadNotifications || (!hasInitialized && !loading && !shouldSetFilter && !shouldSetPage)) {
      if (shouldSetFilter) {
        // If filter changed, reset to page 1
        setCurrentPage(1);
        setPagination(null);
        handleLoadNotifications(1, true, targetFilter);
      } else {
        // Load specific page
        handleLoadNotifications(targetPage, false, targetFilter);
      }
    }
  }, [user, searchParams, setSearchParams, unreadCount, filter, currentPage, handleLoadNotifications, hasInitialized, loading]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Please log in to view notifications
          </h2>
          <Link
            to="/login"
            className="text-primary hover:text-orange-600 font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AccountNav />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            {/* Filter Tabs */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  filter === "all"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange("unread")}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  filter === "unread"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-primary hover:text-orange-600 border border-primary hover:border-orange-600 rounded-lg transition-colors duration-200"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5-5-5h5v14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.73 21c-.39.72-1.13 1.2-1.99 1.2-.86 0-1.6-.48-1.99-1.2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === "unread" ? "No unread notifications" : "No notifications"}
                </h3>
                <p className="text-gray-500">
                  {filter === "unread" 
                    ? "All your notifications have been read." 
                    : "You'll receive notifications about reviews and replies here."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {/* Page Loading Overlay */}
                {loadingPage && (
                  <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {notifications.map((notification) => {
                  const displayData = getNotificationDisplayData(notification);
                  
                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={displayData}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  );
                })}

                {/* Pagination Component */}
                {pagination && pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    showingFrom={((currentPage - 1) * itemsPerPage) + 1}
                    showingTo={Math.min(currentPage * itemsPerPage, pagination.totalItems)}
                    totalItems={pagination.totalItems}
                    itemName="notifications"
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Individual notification item component
 */
function NotificationItem({ notification, onClick }) {
  const { id, icon, title, message, excerpt, relativeTime, isRead, link, metadata } = notification;

  // Check if this is a booking notification
  const isBookingNotification = notification.type && notification.type.startsWith('booking_');
  
  // For booking notifications, show only booking ID in the message/excerpt area
  const displayExcerpt = isBookingNotification && metadata?.bookingReference 
    ? `Booking #${metadata.bookingReference}`
    : excerpt;

  const content = (
    <div
      className={`p-4 border rounded-lg transition-colors duration-200 cursor-pointer ${
        isRead
          ? "bg-white border-gray-200 hover:border-gray-300"
          : "bg-blue-50 border-blue-200 hover:border-blue-300"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-start justify-between mb-1 gap-2">
            <h3 className={`text-sm font-medium break-words whitespace-normal flex-1 leading-relaxed ${isRead ? "text-gray-900" : "text-gray-900 font-semibold"}`}>
              {title}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {relativeTime}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 break-words whitespace-normal leading-relaxed">
            {displayExcerpt}
          </p>

          {/* Metadata - Enhanced for booking notifications */}
          {metadata?.rating && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 break-words">
              <span className="flex items-center">
                ⭐ {metadata.rating} star{metadata.rating !== 1 ? "s" : ""}
              </span>
              {metadata.placeName && (
                <span className="break-words">• {metadata.placeName}</span>
              )}
            </div>
          )}
          
          {/* Booking-specific metadata - Show full details in bottom section */}
          {isBookingNotification && (metadata?.placeName || metadata?.dateTimeWindow) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 break-words">
              {metadata.placeName && (
                <span className="break-words">{metadata.placeName}</span>
              )}
              {metadata.dateTimeWindow && (
                <span className="break-words">• {metadata.dateTimeWindow}</span>
              )}
            </div>
          )}
          
          {/* Non-booking metadata (for review notifications) */}
          {!isBookingNotification && (metadata?.bookingReference || metadata?.dateTimeWindow) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 break-words">
              {metadata.bookingReference && (
                <span className="break-words">Booking #{metadata.bookingReference}</span>
              )}
              {metadata.dateTimeWindow && (
                <span className="break-words">• {metadata.dateTimeWindow}</span>
              )}
            </div>
          )}
        </div>

        {/* Unread Indicator */}
        {!isRead && (
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
        )}
      </div>
    </div>
  );

  // Wrap with Link if notification has a link
  if (link) {
    return (
      <Link to={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
