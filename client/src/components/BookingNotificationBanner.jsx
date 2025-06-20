import { useBookingNotifications } from "../contexts/BookingNotificationContext";
import { useContext } from "react";
import { UserContext } from "./UserContext";

/**
 * BookingNotificationBanner - Shows notification alerts on booking pages
 * Follows DRY principle for consistent notification display across pages
 */
export default function BookingNotificationBanner() {
  const { user } = useContext(UserContext);
  const { notifications, markAsViewed } = useBookingNotifications();

  if (!user) return null;

  const getNotificationMessage = () => {
    const { pending, approved, rejected } = notifications;
    
    if (user.userType === 'host' || user.userType === 'agent') {
      if (pending > 0) {
        return {
          type: 'pending',
          message: `You have ${pending} pending booking request${pending > 1 ? 's' : ''} that need${pending === 1 ? 's' : ''} your attention.`,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: '⏳'
        };
      }
    } else if (user.userType === 'client') {
      const total = approved + rejected;
      if (total > 0) {
        let message = '';
        if (approved > 0 && rejected > 0) {
          message = `You have ${approved} approved and ${rejected} rejected booking${total > 1 ? 's' : ''}.`;
        } else if (approved > 0) {
          message = `You have ${approved} newly approved booking${approved > 1 ? 's' : ''}.`;
        } else {
          message = `You have ${rejected} rejected booking${rejected > 1 ? 's' : ''}.`;
        }
        
        return {
          type: 'update',
          message,
          bgColor: approved > 0 ? 'bg-blue-50' : 'bg-red-50',
          textColor: approved > 0 ? 'text-blue-800' : 'text-red-800',
          borderColor: approved > 0 ? 'border-blue-200' : 'border-red-200',
          icon: approved > 0 ? '✅' : '❌'
        };
      }
    }
    
    return null;
  };

  const notificationInfo = getNotificationMessage();
  
  if (!notificationInfo) return null;

  const handleDismiss = () => {
    if (user.userType === 'host' || user.userType === 'agent') {
      markAsViewed('pending');
    } else if (user.userType === 'client') {
      if (notifications.approved > 0) markAsViewed('approved');
      if (notifications.rejected > 0) markAsViewed('rejected');
    }
  };

  return (
    <div className={`
      ${notificationInfo.bgColor} 
      ${notificationInfo.borderColor} 
      ${notificationInfo.textColor}
      border rounded-lg p-4 mb-6 flex items-center justify-between
    `}>
      <div className="flex items-center space-x-3">
        <span className="text-xl">{notificationInfo.icon}</span>
        <div>
          <div className="font-medium">New Notifications</div>
          <div className="text-sm opacity-90">{notificationInfo.message}</div>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-current opacity-60 hover:opacity-100 transition-opacity"
        title="Dismiss notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
