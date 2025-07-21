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
  const [loadingMore, setLoadingMore] = useState(false);

  /**
   * Load notifications with pagination - passing filter as parameter to avoid closure issues
   */
  const handleLoadNotifications = useCallback(async (page = 1, reset = false, filterOverride = null) => {
    const currentFilter = filterOverride || filter;
    try {
      const paginationData = await loadNotifications({
        page,
        limit: 20,
        unreadOnly: currentFilter === "unread",
        append: !reset
      });

      if (paginationData) {
        setPagination(paginationData);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      notify("Failed to load notifications", "error");
    }
  }, [loadNotifications, notify, filter]);

  /**
   * Load more notifications (pagination)
   */
  const handleLoadMore = useCallback(async () => {
    if (!pagination?.hasNextPage || loadingMore) return;

    setLoadingMore(true);
    try {
      await handleLoadNotifications(currentPage + 1, false);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination?.hasNextPage, loadingMore, handleLoadNotifications, currentPage]);

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
    // Update URL params to reflect the filter change
    setSearchParams({ filter: newFilter });
    // Immediately reload notifications with new filter
    if (user) {
      handleLoadNotifications(1, true, newFilter);
    }
  }, [setSearchParams, user, handleLoadNotifications]);

  // Initialize filter from URL params or default to "unread" if there are unread notifications
  useEffect(() => {
    if (!user) return;

    const urlFilter = searchParams.get("filter");
    
    let targetFilter = filter;
    let shouldLoadNotifications = false;
    let shouldSetFilter = false;

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
        setSearchParams({ filter: "unread" }, { replace: true });
        targetFilter = "unread";
        shouldLoadNotifications = true;
        shouldSetFilter = true;
      } else {
        // Default to all if no unread notifications
        setFilter("all");
        setSearchParams({ filter: "all" }, { replace: true });
        targetFilter = "all";
        shouldLoadNotifications = true;
        shouldSetFilter = true;
      }
    }

    // Load notifications if filter changed or this is the initial load
    if (shouldLoadNotifications || (notifications.length === 0 && !loading && !shouldSetFilter)) {
      setCurrentPage(1);
      setPagination(null);
      handleLoadNotifications(1, true, targetFilter);
    }
  }, [user, searchParams, setSearchParams, unreadCount, filter, handleLoadNotifications, notifications.length, loading]);

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
    <div className="max-w-4xl mx-auto p-4">
      <AccountNav />
      
      <div className="mt-8">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5-5-5h5V3h0z" />
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
              <div className="space-y-4">
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

                {/* Load More Button */}
                {pagination?.hasNextPage && (
                  <div className="flex justify-center pt-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </button>
                  </div>
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
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className={`text-sm font-medium ${isRead ? "text-gray-900" : "text-gray-900 font-semibold"}`}>
              {title}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {relativeTime}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {excerpt}
          </p>

          {/* Metadata - Enhanced for booking notifications */}
          {metadata?.rating && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center">
                ⭐ {metadata.rating} star{metadata.rating !== 1 ? "s" : ""}
              </span>
              {metadata.placeName && (
                <span>• {metadata.placeName}</span>
              )}
            </div>
          )}
          
          {/* Booking-specific metadata */}
          {(metadata?.bookingReference || metadata?.dateTimeWindow) && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {metadata.bookingReference && (
                <span>Booking #{metadata.bookingReference}</span>
              )}
              {metadata.dateTimeWindow && (
                <span>• {metadata.dateTimeWindow}</span>
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
