import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";
import PriceDisplay from "./PriceDisplay";
import PriorityIndicator from "./PriorityIndicator";
import { formatBookingDates } from "../utils/dateFormatting";
import { format, parseISO } from "date-fns";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * BookingRequestCard Component
 * 
 * A compact, production-level booking request card for host and client management
 * Shows only essential information with request ID and navigation to details page
 */
export default function BookingRequestCard({ booking, competingBookings = [] }) {
  const { user } = useContext(UserContext);

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "selected":
        return "bg-blue-100 text-blue-800 border-blue-200";
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header with Request ID and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link 
            to={`/account/bookings/${booking.id}`}
            className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {booking.uniqueRequestId || `REQ-${booking.id}`}
          </Link>
          <div className="flex items-center gap-2">
            <PriorityIndicator 
              currentBooking={booking} 
              competingBookings={competingBookings} 
            />
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
            {/* Paid to Host Indicator */}
            {booking.status === 'approved' && booking.paidToHost && (
              <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                Paid
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {format(new Date(booking.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {/* Property and booking details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/place/${booking.place?.id}`}
              className="block group"
            >
              <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors cursor-pointer">
                {booking.place?.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-600 truncate">
              {booking.place?.address}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-lg font-semibold text-gray-900">
              <PriceDisplay 
                price={booking.totalPrice} 
                currency={booking.place?.currency}
                className="text-lg font-semibold text-gray-900"
                bold={true}
              />
            </div>
            <div className="text-xs text-gray-500">
              {booking.numOfGuests} guest{booking.numOfGuests > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Date range from time slots */}
        {booking.timeSlots && booking.timeSlots.length > 0 && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
            </svg>
            <span>
              {formatBookingDates(booking.timeSlots)}
            </span>
          </div>
        )}

        {/* Time slots - always visible */}
        {booking.timeSlots && booking.timeSlots.length > 0 && (
          <div className="flex items-start text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <span className="font-medium">Time slots:</span>
              <div className="mt-1 space-y-1">
                {booking.timeSlots.map((slot, index) => (
                  <div key={index} className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 inline-block mr-1 mb-1">
                    {format(parseDateSafely(slot.date), "MMM d")}: {slot.startTime}-{slot.endTime}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agent-specific contact information */}
        {user?.userType === 'agent' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Client info */}
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="font-medium text-blue-700 mb-1">Client</div>
                <div className="text-blue-600">
                  <div><span className="font-medium">Name:</span> {booking.guestName || booking.user?.name || 'N/A'}</div>
                  <div><span className="font-medium">Phone:</span> {booking.guestPhone || booking.user?.phoneNumber || 'N/A'}</div>
                </div>
              </div>
              
              {/* Host info */}
              {booking.place?.owner && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <div className="font-medium text-green-700 mb-1">Host</div>
                  <div className="text-green-600">
                    <div><span className="font-medium">Name:</span> {booking.place.owner.name}</div>
                    <div><span className="font-medium">Phone:</span> {booking.place.owner.phoneNumber || 'N/A'}</div>
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
        >
          View Details
        </Link>
      </div>
      </div>
  );
}
