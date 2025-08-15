import { differenceInCalendarDays, parseISO } from "date-fns";
import { useTranslation } from 'react-i18next';
import DateDuration from "./DateDuration";
import PriceDisplay from "./PriceDisplay";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";
import ConfirmationModal from "./ConfirmationModal";
import PriorityIndicator from "./PriorityIndicator";
import api from "../utils/api";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

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

export default function BookingCard({bookingDetail, onBookingUpdate, competingBookings = []}) {
  const { t } = useTranslation('common');
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    action: "",
    status: ""
  });
  
  // Get the status color based on the booking status
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // pending
    }
  };

  // Show confirmation modal
  const showConfirmationModal = (status) => {
    const action = user?.userType === 'host' ? status : 'cancel';
    
    const title = `${action.charAt(0).toUpperCase() + action.slice(1)} Booking`;
    const message = `Are you sure you want to ${action} this booking?`;
    
    setModalConfig({
      title,
      message,
      action,
      status
    });
    setShowModal(true);
  };

  // Update booking status (approve, reject, cancel)
  const updateBookingStatus = async () => {
    setError("");
    setIsUpdating(true);
    try {
      const { data } = await api.put(`/bookings/${bookingDetail.id}`, { status: modalConfig.status });
      setIsUpdating(false);
      if (onBookingUpdate) {
        onBookingUpdate(data.booking);
      }
      
      if (modalConfig.status === 'rejected') {
        if (user?.userType === 'host') {
          notify("messages.bookingRejectedSuccess", "success");
        } else {
          notify("messages.bookingCancelledSuccess", "success");
        }
      } else {
        notify("messages.bookingStatusSuccess", "success", { status: modalConfig.status });
      }
      setShowModal(false);
    } catch (error) {
      setIsUpdating(false);
      setError(error.response?.data?.error || error.message);
      notify("notifications.error.operationFailed", "error");
    }
  };

  return (
    <>
      <div>
        {bookingDetail && (
        <div className="bg-gray-100 rounded-3xl p-4 mb-5">
          {/* Status badge */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Booking Information</h2>
            <div className="flex items-center gap-2">
              <PriorityIndicator 
                currentBooking={bookingDetail} 
                competingBookings={competingBookings} 
              />
              <div className={`px-3 py-1 rounded-full border ${getStatusColor(bookingDetail.status)}`}>
                {bookingDetail.status.charAt(0).toUpperCase() + bookingDetail.status.slice(1)}
              </div>
              {/* Paid to Host Indicator */}
              {bookingDetail.status === 'approved' && bookingDetail.paidToHost && (
                <div className="px-3 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                  Paid
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-3 mb-2">
                <div className="flex gap-1 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.752 15.002A9.718 9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                    />
                  </svg>
                  {differenceInCalendarDays(
                    parseDateSafely(bookingDetail.checkOutDate),
                    parseDateSafely(bookingDetail.checkInDate)
                  )}{" "}
                  nights:
                </div>
                <DateDuration
                  checkInDate={bookingDetail.checkInDate}
                  checkOutDate={bookingDetail.checkOutDate}
                />
              </div>
              
              {/* Room information */}
              {bookingDetail.place && (
                <div className="mb-2">
                  <h3 className="font-medium">Room: {bookingDetail.place.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p>{bookingDetail.place.address}</p>
                  </div>
                </div>
              )}
              
              <p className="flex gap-1 mt-3 mb-2 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                  />
                </svg>
                Booking #{bookingDetail.id}
              </p>

              {/* For host: only show booking details, not client info */}
              {user?.userType === 'host' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Booking Details</h3>
                  <p>Number of Guests: {bookingDetail.numOfGuests}</p>
                  <p>Total Price: <PriceDisplay price={bookingDetail.totalPrice} currency={bookingDetail.place?.currency} bold={false} /></p>
                  <p className="mt-2 text-sm text-gray-500 italic">Client details are hidden for privacy reasons.</p>
                </div>
              )}
              
              {/* Client and Host information for agents - minimal display */}
              {user?.userType === 'agent' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  
                  {/* Client info */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Client:</h4>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {bookingDetail.guestName || bookingDetail.user?.name || 'N/A'}</p>
                      <p><span className="font-medium">Phone:</span> {bookingDetail.guestPhone || bookingDetail.user?.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Host info */}
                  {bookingDetail.place?.owner && (
                    <div className="pt-2 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Host:</h4>
                      <div className="text-sm text-gray-600">
                        <p><span className="font-medium">Name:</span> {bookingDetail.place.owner.name}</p>
                        <p><span className="font-medium">Phone:</span> {bookingDetail.place.owner.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Guests: {bookingDetail.numOfGuests}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="bg-primary w-full rounded-2xl text-white px-4 py-3 text-center mb-4">
                <p>Total price</p>
                <div className="text-2xl">
                  <PriceDisplay 
                    price={bookingDetail.totalPrice} 
                    currency={bookingDetail.place?.currency}
                    className="text-2xl text-white"
                    bold={true}
                  />
                </div>
              </div>
              
              {/* Action buttons for host */}
              {user?.userType === 'host' && (
                <div className="flex gap-2">
                  {/* Host cannot approve until payment is confirmed - approval button is hidden */}
                  {/* Only agents can approve bookings */}
                  
                  {/* Host can reject at any pending/selected stage */}
                  {(bookingDetail.status === 'pending' || bookingDetail.status === 'selected') && (
                    <button 
                      onClick={() => showConfirmationModal('rejected')} 
                      disabled={isUpdating}
                      className="w-full bg-error-600 text-white py-2 px-4 rounded hover:bg-error-700 disabled:opacity-50"
                    >
                      {isUpdating ? 'Processing...' : 'Reject'}
                    </button>
                  )}
                  
                  {/* Show info message for pending/selected bookings */}
                  {(bookingDetail.status === 'pending' || bookingDetail.status === 'selected') && (
                    <div className="w-full bg-info-50 border border-info-200 rounded p-3 text-sm text-info-800 mt-2">
                      <p className="font-medium">Booking Management</p>
                      <p>Only agents can approve bookings. You can reject unwanted bookings.</p>
                      {bookingDetail.status === 'selected' && (
                        <p className="mt-1">This booking is selected and waiting for agent approval.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Action buttons for agent - can approve at any stage */}
              {user?.userType === 'agent' && (bookingDetail.status === 'pending' || bookingDetail.status === 'selected') && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => showConfirmationModal('approved')} 
                    disabled={isUpdating}
                    className="flex-1 bg-success-600 text-white py-2 px-4 rounded hover:bg-success-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Processing...' : 'Approve (Agent)'}
                  </button>
                  <button 
                    onClick={() => showConfirmationModal('rejected')} 
                    disabled={isUpdating}
                    className="flex-1 bg-error-600 text-white py-2 px-4 rounded hover:bg-error-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
              
              {/* Cancel button for client */}
              {bookingDetail.status === 'pending' && user?.userType === 'client' && (
                <button 
                  onClick={() => showConfirmationModal('rejected')} 
                  disabled={isUpdating}
                  className="w-full bg-error-600 text-white py-2 px-4 rounded hover:bg-error-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={updateBookingStatus}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonClass={modalConfig.status === "approved" ? "bg-success-600 hover:bg-success-700" : "bg-error-600 hover:bg-error-700"}
        isLoading={isUpdating}
      />
    </>
  );
}
