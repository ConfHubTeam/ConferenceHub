import { createContext, useContext, useState, useEffect } from "react";
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

  // Load notification counts based on user type
  const loadNotificationCounts = async () => {
    if (!user) return;

    try {
      if (user.userType === 'host' || user.userType === 'agent') {
        // For hosts/agents: count pending bookings that need attention
        const { data } = await api.get('/bookings/counts');
        setNotifications(prev => ({
          ...prev,
          pending: data.pendingCount || 0
        }));
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

        setNotifications({
          pending: 0,
          approved: newApproved,
          rejected: newRejected
        });
      }
    } catch (error) {
      console.error("Error loading notification counts:", error);
    }
  };

  // Get last viewed times from localStorage
  const getLastViewedTimes = () => {
    const stored = localStorage.getItem(`booking_notifications_${user?.id}`);
    return stored ? JSON.parse(stored) : { pending: null, approved: null, rejected: null };
  };

  // Update last viewed time for a specific status
  const markAsViewed = (status) => {
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
  };

  // Mark all notifications as viewed
  const markAllAsViewed = () => {
    const now = new Date().toISOString();
    const updated = {
      pending: now,
      approved: now,
      rejected: now
    };
    
    localStorage.setItem(`booking_notifications_${user?.id}`, JSON.stringify(updated));
    setLastViewed(updated);
    setNotifications({ pending: 0, approved: 0, rejected: 0 });
  };

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
  }, [user]);

  // Refresh notifications periodically (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(loadNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
