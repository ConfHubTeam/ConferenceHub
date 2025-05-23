import { differenceInCalendarDays } from "date-fns";
import DateDuration from "./DateDuration";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";
import api from "../utils/api";

export default function BookingCard({bookingDetail, onBookingUpdate}) {
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  
  // Get the status color based on the booking status
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // pending
    }
  };

  // Update booking status (approve, reject, cancel)
  async function updateBookingStatus(status) {
    const action = user?.userType === 'host' ? status : 'cancel';
    setError("");
    
    if (window.confirm(`Are you sure you want to ${action} this booking?`)) {
      setIsUpdating(true);
      try {
        const { data } = await api.put(`/bookings/${bookingDetail.id}`, { status });
        setIsUpdating(false);
        if (onBookingUpdate) {
          onBookingUpdate(data.booking);
        }
        
        if (status === 'rejected') {
          if (user?.userType === 'host') {
            notify(`Booking rejected successfully`, "success");
          } else {
            notify(`Booking cancelled successfully`, "success");
          }
        } else {
          notify(`Booking ${status} successfully`, "success");
        }
      } catch (error) {
        setIsUpdating(false);
        setError(error.response?.data?.error || error.message);
        notify(`Error: ${error.response?.data?.error || error.message}`, "error");
      }
    }
  }

  return (
    <div>
      {bookingDetail && (
        <div className="bg-gray-100 rounded-3xl p-4 mb-5">
          {/* Status badge */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Booking Information</h2>
            <div className={`px-3 py-1 rounded-full border ${getStatusColor(bookingDetail.status)}`}>
              {bookingDetail.status.charAt(0).toUpperCase() + bookingDetail.status.slice(1)}
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
                    new Date(bookingDetail.checkOutDate),
                    new Date(bookingDetail.checkInDate)
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
                  <p className="text-sm text-gray-500">{bookingDetail.place.address}</p>
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
                  <p>Total Price: ${bookingDetail.totalPrice}</p>
                  <p className="mt-2 text-sm text-gray-500 italic">Client details are hidden for privacy reasons.</p>
                </div>
              )}
              
              {/* Guest information for agents */}
              {user?.userType === 'agent' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Guest Information</h3>
                  <p>Name: {bookingDetail.guestName}</p>
                  <p>Phone: {bookingDetail.guestPhone}</p>
                  {bookingDetail.user && (
                    <p>Email: {bookingDetail.user.email}</p>
                  )}
                  <p>Number of Guests: {bookingDetail.numOfGuests}</p>
                  
                  {bookingDetail.place && bookingDetail.place.owner && (
                    <div className="mt-2 pt-2 border-t">
                      <h3 className="font-medium mb-1">Host Information</h3>
                      <p>Host: {bookingDetail.place.owner.name}</p>
                      <p>Email: {bookingDetail.place.owner.email}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Guest information for clients (their own bookings) */}
              {user?.userType === 'client' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Your Information</h3>
                  <p>Name: {bookingDetail.guestName}</p>
                  <p>Phone: {bookingDetail.guestPhone}</p>
                  <p>Number of Guests: {bookingDetail.numOfGuests}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="bg-primary w-full rounded-2xl text-white px-4 py-3 text-center mb-4">
                <p>Total price</p>
                <div className="text-2xl">${bookingDetail.totalPrice}</div>
              </div>
              
              {/* Action buttons for host */}
              {bookingDetail.status === 'pending' && user?.userType === 'host' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateBookingStatus('approved')} 
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Processing...' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => updateBookingStatus('rejected')} 
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
              
              {/* Action buttons for agent - can approve on behalf of host */}
              {bookingDetail.status === 'pending' && user?.userType === 'agent' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateBookingStatus('approved')} 
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Processing...' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => updateBookingStatus('rejected')} 
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
              
              {/* Cancel button for client */}
              {bookingDetail.status === 'pending' && user?.userType === 'client' && (
                <button 
                  onClick={() => updateBookingStatus('rejected')} 
                  disabled={isUpdating}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
