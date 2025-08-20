import { useContext } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserContext } from "./UserContext";
import PriceDisplay from "./PriceDisplay";
import PriorityIndicator from "./PriorityIndicator";
import { formatBookingDates } from "../utils/dateFormatting";
import { format, parseISO } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * BookingRequestCard Component
 * 
 * A compact, production-level booking request card for host and client management
 * Shows only essential information with request ID and navigation to details page
 */
export default function BookingRequestCard({ booking, competingBookings = [] }) {
  const { user } = useContext(UserContext);
  const { t, i18n } = useTranslation('booking');

  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "selected":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to safely parse date strings without timezone issues
  const parseDateSafely = (dateString) => {
    if (!dateString) return getCurrentDateObjectInUzbekistan(); // Use Uzbekistan time as default
    
    // If it's already a Date object, return as is
    if (dateString instanceof Date) return dateString;
    
    // If it's a simple date string like "2024-12-25", parse it as local date
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // For ISO strings with time, use parseISO from date-fns
    return parseISO(dateString);
  };

  return (
      <div className="w-full bg-bg-card border border-border-light rounded-lg shadow-ui p-6 hover:border-border-hover hover:shadow-ui-hover transition-all duration-200">
      {/* Header with Request ID and Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link 
            to={`/account/bookings/${booking.id}`}
            className="font-mono text-sm font-semibold text-accent-primary hover:text-accent-hover hover:underline transition-colors"
          >
            {booking.uniqueRequestId || `REQ-${booking.id}`}
          </Link>
          <div className="flex items-center gap-2">
            <PriorityIndicator 
              currentBooking={booking} 
              competingBookings={competingBookings} 
            />
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(booking.status)}`}>
              {t(`status.${booking.status}`)}
            </span>
            {/* Paid to Host Indicator - Only visible to agents and hosts */}
            {booking.status === 'approved' && booking.paidToHost && (user?.userType === 'agent' || user?.userType === 'host') && (
              <span className="px-3 py-1 text-xs font-medium rounded-full border bg-accent-50 text-accent-primary border-accent-200">
                {t("card.paid")}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-text-muted">
          {format(new Date(booking.createdAt), "MMM d, yyyy", { locale: getDateLocale() })}
        </span>
      </div>

      {/* Property and booking details */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/place/${booking.place?.id}`}
              className="block group"
            >
              <h3 className="text-heading-4 text-text-primary truncate group-hover:text-accent-primary transition-colors cursor-pointer">
                {booking.place?.title}
              </h3>
            </Link>
            <div className="flex items-center text-sm text-text-secondary mt-1">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="truncate">{booking.place?.address}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-heading-3 text-text-primary">
              <PriceDisplay 
                price={booking.totalPrice} 
                currency={booking.place?.currency}
                className="text-heading-3 text-text-primary"
                bold={true}
              />
            </div>
            <div className="text-caption text-text-muted">
              {t("card.guests", { 
                count: booking.numOfGuests,
                plural: booking.numOfGuests > 1 ? "s" : ""
              })}
            </div>
          </div>
        </div>

        {/* Date range from time slots */}
        {booking.timeSlots && booking.timeSlots.length > 0 && (
          <div className="flex items-center text-sm text-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
            </svg>
            <span>
              {formatBookingDates(booking.timeSlots)}
            </span>
          </div>
        )}

        {/* Time slots - always visible */}
        {booking.timeSlots && booking.timeSlots.length > 0 && (
          <div className="flex items-start text-sm text-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <span className="font-medium">{t("card.timeSlots")}</span>
              <div className="mt-2 space-y-1">
                {booking.timeSlots.map((slot, index) => (
                  <div key={index} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-3 py-1.5 inline-block mr-2 mb-1 font-medium">
                    {format(parseDateSafely(slot.date), t("card.timeSlotFormat"), { locale: getDateLocale() })}: {slot.startTime}-{slot.endTime}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agent-specific contact information */}
        {user?.userType === 'agent' && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Client info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="font-medium text-slate-700 mb-2">{t("card.agentInfo.client")}</div>
                <div className="text-text-secondary space-y-1">
                  <div><span className="font-medium">{t("card.agentInfo.name")}</span> {booking.guestName || booking.user?.name || t("card.agentInfo.notAvailable")}</div>
                  <div><span className="font-medium">{t("card.agentInfo.phone")}</span> {booking.guestPhone || booking.user?.phoneNumber || t("card.agentInfo.notAvailable")}</div>
                </div>
              </div>
              
              {/* Host info */}
              {booking.place?.owner && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                  <div className="font-medium text-status-success mb-2">{t("card.agentInfo.host")}</div>
                  <div className="text-text-secondary space-y-1">
                    <div><span className="font-medium">{t("card.agentInfo.name")}</span> {booking.place.owner.name}</div>
                    <div><span className="font-medium">{t("card.agentInfo.phone")}</span> {booking.place.owner.phoneNumber || t("card.agentInfo.notAvailable")}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Details button */}
      <div className="flex gap-2">
        <Link
          to={`/account/bookings/${booking.id}`}
          className="btn-primary btn-size-md w-full text-center"
        >
          {t("card.viewDetails")}
        </Link>
      </div>
      </div>
  );
}
