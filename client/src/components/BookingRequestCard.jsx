import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useNotification } from "./NotificationContext";
import { UserContext } from "./UserContext";
import PriceDisplay from "./PriceDisplay";
import api from "../utils/api";
import { format } from "date-fns";

/**
 * BookingRequestCard Component
 * 
 * A compact, production-level booking request card for host and client management
 * Shows only essential information with request ID (not client details for hosts)
 */
export default function BookingRequestCard({ booking, onBookingUpdate }) {
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const [isUpdating, setIsUpdating] = useState(false);

  // Update booking status
  async function updateBookingStatus(status) {
    const action = user?.userType === 'client' 
      ? (status === "rejected" ? "cancel" : status)
      : (status === "approved" ? "approve" : "reject");
    
    const confirmMessage = user?.userType === 'client' 
      ? `Are you sure you want to ${action} this booking?`
      : `Are you sure you want to ${action} this booking request?`;
    
    if (window.confirm(confirmMessage)) {
      setIsUpdating(true);
      try {
        const { data } = await api.put(`/bookings/${booking.id}`, { status });
        onBookingUpdate(data.booking);
        
        const successMessage = user?.userType === 'client'
          ? `Booking ${action}led successfully`
          : `Booking ${action}d successfully`;
        notify(successMessage, "success");
      } catch (error) {
        notify(`Error: ${error.response?.data?.error || error.message}`, "error");
      } finally {
        setIsUpdating(false);
      }
    }
  }

  // Format time slots for display
  const formatTimeSlots = (timeSlots) => {
    if (!timeSlots || timeSlots.length === 0) return "Full day";
    
    return timeSlots.map(slot => {
      const date = format(new Date(slot.date), "MMM d");
      return `${date}: ${slot.startTime}-${slot.endTime}`;
    }).join(", ");
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header with Request ID and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-gray-900">
            {booking.uniqueRequestId || `REQ-${booking.id}`}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
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

        {/* Date range */}
        <div className="flex items-center text-sm text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
          </svg>
          <span>
            {format(new Date(booking.checkInDate), "MMM d")} - {format(new Date(booking.checkOutDate), "MMM d, yyyy")}
          </span>
        </div>

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
                    {format(new Date(slot.date), "MMM d")}: {slot.startTime}-{slot.endTime}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons for pending requests */}
      {booking.status === "pending" && (
        <div className="flex gap-2">
          {user?.userType === 'host' && (
            <>
              <button
                onClick={() => updateBookingStatus("approved")}
                disabled={isUpdating}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? "Processing..." : "Approve"}
              </button>
              <button
                onClick={() => updateBookingStatus("rejected")}
                disabled={isUpdating}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? "Processing..." : "Reject"}
              </button>
            </>
          )}
          {user?.userType === 'client' && (
            <button
              onClick={() => updateBookingStatus("rejected")}
              disabled={isUpdating}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? "Cancelling..." : "Cancel Booking"}
            </button>
          )}
          {user?.userType === 'agent' && (
            <>
              <button
                onClick={() => updateBookingStatus("approved")}
                disabled={isUpdating}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? "Processing..." : "Approve"}
              </button>
              <button
                onClick={() => updateBookingStatus("rejected")}
                disabled={isUpdating}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? "Processing..." : "Reject"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Show status for non-pending requests */}
      {booking.status !== "pending" && (
        <div className="text-center py-2 text-sm text-gray-600">
          {user?.userType === 'client' 
            ? `Booking ${booking.status} on ${format(new Date(booking.updatedAt), "MMM d, yyyy 'at' HH:mm")}`
            : `Request ${booking.status} on ${format(new Date(booking.updatedAt), "MMM d, yyyy 'at' HH:mm")}`
          }
        </div>
      )}
    </div>
  );
}
