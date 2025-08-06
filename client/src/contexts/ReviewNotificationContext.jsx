/**
 * Review Notification Context
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only review notification state management
 * - Open/Closed: Extensible for new notification types
 * - Interface Segregation: Focused on review notification operations
 * - Dependency Inversion: Uses API abstraction
 * 
 * Implements DRY principle by centralizing review notification logic
 * US-R011 compliant notification management
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import { processNotificationVariables } from "../utils/notificationFormatting";
import api from "../utils/api";

const ReviewNotificationContext = createContext();

export function useReviewNotifications() {
  const context = useContext(ReviewNotificationContext);
  if (!context) {
    throw new Error("useReviewNotifications must be used within ReviewNotificationProvider");
  }
  return context;
}

export function ReviewNotificationProvider({ children }) {
  const { user } = useContext(UserContext);
  const { t, i18n } = useTranslation("notifications");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Polling interval for real-time updates
  const pollIntervalRef = useRef(null);
  const POLL_INTERVAL = 30000; // 30 seconds

  /**
   * Load unread notification count for header badge (US-R011)
   */
  const loadUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get("/notifications/unread-count");
      if (response.data.ok) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error loading unread notification count:", error);
      // Don't set error state for count loading to avoid disrupting UX
    }
  }, [user]);

  /**
   * Load user notifications with pagination (US-R011)
   */
  const loadNotifications = useCallback(async (options = {}) => {
    if (!user) return;

    const { page = 1, limit = 20, unreadOnly = false, append = false } = options;
    
    if (!append) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.get("/notifications", {
        params: { page, limit, unreadOnly }
      });

      if (response.data.ok) {
        const newNotifications = response.data.notifications;
        
        console.log("API Response - unreadOnly:", unreadOnly, "notifications count:", newNotifications.length, "append:", append);
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          console.log("Replacing notifications with:", newNotifications.length, "items");
          setNotifications(newNotifications);
        }

        return response.data.pagination;
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Mark notification as read (US-R011)
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return;

    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      if (response.data.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }, [user]);

  /**
   * Mark all notifications as read (US-R011)
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.put("/notifications/mark-all-read");
      
      if (response.data.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        );

        // Reset unread count
        setUnreadCount(0);

        return response.data.updatedCount;
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }, [user]);

  /**
   * Delete all notifications for the authenticated user
   */
  const deleteAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.delete("/notifications/delete-all");
      
      if (response.data.ok) {
        // Clear local state
        setNotifications([]);
        setUnreadCount(0);

        return response.data.deletedCount;
      }
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      throw error;
    }
  }, [user]);

  /**
   * Get notification display data for UI rendering (US-R011)
   */
  const getNotificationDisplayData = useCallback((notification) => {
    const { type, title, message, metadata, createdAt, isRead } = notification;

    // Format relative time with better error handling
    const formatRelativeTime = (dateString) => {
      if (!dateString) return "Unknown";
      
      try {
        const now = new Date();
        const notificationDate = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(notificationDate.getTime())) {
          console.warn("Invalid date received:", dateString);
          return "Unknown";
        }
        
        const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return notificationDate.toLocaleDateString();
      } catch (error) {
        console.error("Error formatting date:", error, dateString);
        return "Unknown";
      }
    };

    // Get icon based on notification type
    const getIcon = () => {
      switch (type) {
        case "review_created":
          return "⭐";
        case "review_reply":
          return "💬";
        case "reply_helpful":
          return "👍";
        case "booking_requested":
          return "📝";
        case "booking_paid":
          return "💳";
        case "booking_approved":
          return "✅";
        case "booking_selected":
          return "🎯";
        case "booking_rejected":
          return "❌";
        default:
          return "🔔";
      }
    };

    // Get link for navigation
    const getLink = () => {
      // For booking notifications, link to booking details
      if (metadata?.bookingId) {
        return `/account/bookings/${metadata.bookingId}`;
      }
      // For review notifications, link to place reviews
      if (metadata?.placeId) {
        return `/place/${metadata.placeId}#reviews`;
      }
      return null;
    };

    // Get translated title and message
    const getTranslatedContent = () => {
      // Only process notifications with new format (translationKey + translationVariables)
      if (metadata?.translationKey && metadata?.translationVariables) {
        const titleKey = `${metadata.translationKey}.title`;
        const messageKey = `${metadata.translationKey}.message`;
        
        try {
          // Process translation variables to format dates/times
          const processedVariables = processNotificationVariables(
            metadata.translationVariables,
            t,
            i18n.language
          );
          
          const translatedTitle = t(titleKey, processedVariables);
          const translatedMessage = t(messageKey, processedVariables);
          
          return {
            title: translatedTitle,
            message: translatedMessage
          };
        } catch (error) {
          console.error("Error translating notification:", error);
          return {
            title: "Notification Error",
            message: "Unable to display notification content"
          };
        }
      }
      
      // This should not happen since we filter out legacy notifications now
      console.error("Legacy notification passed through filter:", { id: notification.id, title });
      return {
        title: "Error",
        message: "Invalid notification format"
      };
    };

    const { title: translatedTitle, message: translatedMessage } = getTranslatedContent();

    return {
      ...notification,
      title: translatedTitle,
      message: translatedMessage,
      icon: getIcon(),
      relativeTime: formatRelativeTime(createdAt),
      link: getLink(),
      excerpt: metadata?.reviewExcerpt || metadata?.replyExcerpt || translatedMessage.substring(0, 100),
      metadata: {
        ...metadata,
        // Include additional display info for booking notifications
        ...(metadata?.totalPrice && { displayPrice: `$${metadata.totalPrice}` }),
        ...(metadata?.guestName && { guestName: metadata.guestName }),
        ...(metadata?.numOfGuests && { guestCount: metadata.numOfGuests }),
        // Include booking reference and date/time window from backend
        ...(metadata?.bookingReference && { bookingReference: metadata.bookingReference }),
        ...(metadata?.dateTimeWindow && { dateTimeWindow: metadata.dateTimeWindow })
      }
    };
  }, [t]);

  /**
   * Start polling for new notifications
   */
  const startPolling = useCallback(() => {
    if (!user || pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(() => {
      loadUnreadCount();
    }, POLL_INTERVAL);
  }, [user, loadUnreadCount]);

  /**
   * Stop polling for notifications
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Initialize and manage polling
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      startPolling();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      stopPolling();
    }

    return () => stopPolling();
  }, [user, loadUnreadCount, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    error,

    // Actions
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
    getNotificationDisplayData,

    // Polling control
    startPolling,
    stopPolling
  };

  return (
    <ReviewNotificationContext.Provider value={value}>
      {children}
    </ReviewNotificationContext.Provider>
  );
}

export default ReviewNotificationContext;
