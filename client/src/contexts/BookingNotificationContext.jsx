import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { UserContext } from "../components/UserContext";
import api from "../utils/api";

/**
 * BookingNotificationContext - Centralized notification management
 * Follows DRY and isolation principles for booking notifications
 */
const BookingNotificationContext = createContext();

export function useBookingNotifications() {
  const context = useContext(BookingNotificationContext);
  if (!context) {
    throw new Error("useBookingNotifications must be used within BookingNotificationProvider");
  }
  return context;
}

export function BookingNotificationProvider({ children }) {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [lastViewed, setLastViewed] = useState({
    pending: null,
    approved: null,
    rejected: null
  });

  // Use ref to store the latest loadNotificationCounts function
  const loadNotificationCountsRef = useRef();

  // Get last viewed times from localStorage (memoized to prevent recreations)
  const getLastViewedTimes = useCallback(() => {
    const stored = localStorage.getItem(`booking_notifications_${user?.id}`);
    return stored ? JSON.parse(stored) : { pending: null, approved: null, rejected: null };
  }, [user?.id]);

  // Load notification counts based on user type (memoized to prevent unnecessary re-runs)
  const loadNotificationCounts = useCallback(async () => {
    if (!user) return;

    try {
      if (user.userType === 'host' || user.userType === 'agent') {
        // For hosts/agents: count pending bookings since last view (timestamp-based like clients)
        const { data } = await api.get('/bookings');
        const lastViewedTimes = getLastViewedTimes();
        
        // Count pending bookings that are newer than last viewed time
        const newPendingCount = data.filter(booking => 
          booking.status === 'pending' && 
          (!lastViewedTimes.pending || new Date(booking.createdAt) > new Date(lastViewedTimes.pending) || new Date(booking.updatedAt) > new Date(lastViewedTimes.pending))
        ).length;
        
        // Only update state if the count has actually changed
        setNotifications(prev => {
          if (prev.pending !== newPendingCount) {
            return { ...prev, pending: newPendingCount };
          }
          return prev; // No change, prevent re-render
        });
      } else if (user.userType === 'client') {
        // For clients: count approved/rejected bookings since last view
        const { data } = await api.get('/bookings');
        const lastViewedTimes = getLastViewedTimes();
        
        const newApproved = data.filter(booking => 
          booking.status === 'approved' && 
          (!lastViewedTimes.approved || new Date(booking.updatedAt) > new Date(lastViewedTimes.approved))
        ).length;
        
        const newRejected = data.filter(booking => 
          booking.status === 'rejected' && 
          (!lastViewedTimes.rejected || new Date(booking.updatedAt) > new Date(lastViewedTimes.rejected))
        ).length;

        // Only update state if counts have actually changed
        setNotifications(prev => {
          if (prev.approved !== newApproved || prev.rejected !== newRejected) {
            return {
              pending: 0,
              approved: newApproved,
              rejected: newRejected
            };
          }
          return prev; // No change, prevent re-render
        });
      }
    } catch (error) {
      console.error("Error loading notification counts:", error);
    }
  }, [user, getLastViewedTimes]); // Include getLastViewedTimes dependency

  // Update the ref whenever the function changes
  useEffect(() => {
    loadNotificationCountsRef.current = loadNotificationCounts;
  }, [loadNotificationCounts]);

  // Update last viewed time for a specific status
  const markAsViewed = useCallback((status) => {
    const now = new Date().toISOString();
    const updated = {
      ...getLastViewedTimes(),
      [status]: now
    };
    
    localStorage.setItem(`booking_notifications_${user?.id}`, JSON.stringify(updated));
    setLastViewed(updated);
    
    // Clear notifications for this status
    setNotifications(prev => ({
      ...prev,
      [status]: 0
    }));
  }, [user?.id, getLastViewedTimes]);

  // Mark all notifications as viewed
  const markAllAsViewed = useCallback(() => {
    const now = new Date().toISOString();
    const updated = {
      pending: now,
      approved: now,
      rejected: now
    };
    
    localStorage.setItem(`booking_notifications_${user?.id}`, JSON.stringify(updated));
    setLastViewed(updated);
    setNotifications({ pending: 0, approved: 0, rejected: 0 });
  }, [user?.id]);

  // Get total unread count
  const getTotalUnread = () => {
    return notifications.pending + notifications.approved + notifications.rejected;
  };

  // Get notification count for specific user type
  const getRelevantCount = () => {
    if (!user) return 0;
    
    switch (user.userType) {
      case 'host':
      case 'agent':
        return notifications.pending;
      case 'client':
        return notifications.approved + notifications.rejected;
      default:
        return 0;
    }
  };

  // Reload notifications when user changes or bookings are updated
  useEffect(() => {
    if (user) {
      loadNotificationCounts();
      setLastViewed(getLastViewedTimes());
    }
  }, [user, loadNotificationCounts, getLastViewedTimes]);

  // Refresh notifications periodically (every 30 seconds) without affecting other components
  useEffect(() => {
    if (!user) return;

    // Start the interval for periodic refresh
    const interval = setInterval(() => {
      // Only refresh if the document is visible (tab is active)
      if (!document.hidden && loadNotificationCountsRef.current) {
        loadNotificationCountsRef.current();
      }
    }, 30000); // 30 seconds

    // Add visibility change listener to refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden && loadNotificationCountsRef.current) {
        // Tab became active, refresh notifications immediately
        loadNotificationCountsRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function to clear interval and event listener
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]); // Only depend on user, not on loadNotificationCounts

  const value = {
    notifications,
    lastViewed,
    loadNotificationCounts,
    markAsViewed,
    markAllAsViewed,
    getTotalUnread,
    getRelevantCount
  };

  return (
    <BookingNotificationContext.Provider value={value}>
      {children}
    </BookingNotificationContext.Provider>
  );
}
