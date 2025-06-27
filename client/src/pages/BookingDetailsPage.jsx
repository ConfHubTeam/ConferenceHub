import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import AccountNav from "../components/AccountNav";
import PriceDisplay from "../components/PriceDisplay";
import CloudinaryImage from "../components/CloudinaryImage";
import ConfirmationModal from "../components/ConfirmationModal";
import LoadingSpinner from "../components/LoadingSpinner";
import BookingProgress from "../components/BookingProgress";
import api from "../utils/api";
import { format } from "date-fns";
import { 
  getBookingActionButtons, 
  getStatusBadgeClass, 
  getBookingStatusMessage,
  requiresPaymentBeforeApproval 
} from "../utils/bookingUtils";

export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [competingBookings, setCompetingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data);
        
        // Fetch competing bookings only for hosts and agents
        if ((user?.userType === 'host' || user?.userType === 'agent') && 
            (data.status === 'pending' || data.status === 'selected') && 
            data.timeSlots?.length > 0) {
          await fetchCompetingBookings(data);
        }
      } catch (error) {
        notify("Error loading booking details", "error");
        navigate("/account/bookings");
      } finally {
        setLoading(false);
      }
    };

    const fetchCompetingBookings = async (bookingData) => {
      try {
        const response = await api.get('/bookings/competing', {
          params: {
            placeId: bookingData.placeId,
            timeSlots: JSON.stringify(bookingData.timeSlots)
          }
        });
        // Exclude the current booking from competitors
        const competitors = response.data.filter(b => b.id !== bookingData.id);
        setCompetingBookings(competitors);
      } catch (error) {
        console.error('Error loading competing bookings:', error);
        // Don't show error to user as this is not critical
      }
    };

    if (bookingId && user) {
      fetchBookingDetails();
    }
  }, [bookingId, navigate, notify, user]);

  // Handle status update
  const handleStatusUpdate = async (newStatus, paymentConfirmed = false) => {
    setIsUpdating(true);
    try {
      const requestBody = { status: newStatus };
      
      // Include payment confirmation for selected bookings being approved
      if (newStatus === "approved" && booking.status === "selected") {
        requestBody.paymentConfirmed = paymentConfirmed;
      }
      
      // Handle agent approval - bypass payment check and mark as agent action
      if (modalConfig.agentApproval && newStatus === "approved") {
        requestBody.agentApproval = true;
        requestBody.paymentConfirmed = true; // Agents can approve without payment confirmation
      }
      
      const { data } = await api.put(`/bookings/${bookingId}`, requestBody);
      
      if (data.deleted) {
        notify("Booking cancelled successfully", "success");
        navigate("/account/bookings");
      } else {
        setBooking(data.booking);
        
        // Refresh competing bookings after status change (only for hosts and agents)
        if ((user?.userType === 'host' || user?.userType === 'agent') &&
            (data.booking.status === 'pending' || data.booking.status === 'selected') && 
            data.booking.timeSlots?.length > 0) {
          try {
            const response = await api.get('/bookings/competing', {
              params: {
                placeId: data.booking.placeId,
                timeSlots: JSON.stringify(data.booking.timeSlots)
              }
            });
            const competitors = response.data.filter(b => b.id !== data.booking.id);
            setCompetingBookings(competitors);
          } catch (error) {
            console.error('Error refreshing competing bookings:', error);
          }
        } else {
          setCompetingBookings([]); // Clear competing bookings for non-pending/selected statuses or clients
        }
        
        notify(data.message || `Booking ${newStatus} successfully`, "success");
      }
      setShowModal(false);
    } catch (error) {
      // Handle payment confirmation requirement
      if (error.response?.data?.requiresPaymentCheck) {
        setModalConfig(prev => ({
          ...prev,
          requiresPaymentCheck: true,
          paymentMessage: error.response.data.message
        }));
        return; // Don't close modal, show payment confirmation
      }
      
      notify(`Error: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Show confirmation modal for booking actions
  const showConfirmationModal = (actionButton) => {
    const { label, action, description, requiresPaymentCheck, agentApproval } = actionButton;
    
    setModalConfig({
      title: `${label} Booking`,
      message: description || `Are you sure you want to ${label.toLowerCase()} this booking?`,
      status: action,
      action: label.toLowerCase(),
      requiresPaymentCheck: requiresPaymentCheck || false,
      agentApproval: agentApproval || false
    });
    setShowModal(true);
  };

  // Handle payment confirmation for selected bookings
  const handlePaymentConfirmation = (confirmed) => {
    handleStatusUpdate(modalConfig.status, confirmed);
  };

  if (loading) {
    return (
      <div>
        <AccountNav />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div>
        <AccountNav />
        <div className="text-center py-20">
          <p className="text-gray-600">Booking not found</p>
          <Link to="/account/bookings" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/account/bookings"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600 font-mono text-sm">
                {booking.uniqueRequestId || `REQ-${booking.id}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Progress */}
            <BookingProgress booking={booking} userType={user?.userType} />
            
            {/* Place Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <div className="flex gap-4">
                {booking.place?.photos?.[0] && (
                  <div className="w-32 h-24 flex-shrink-0">
                    <CloudinaryImage
                      src={booking.place.photos[0]}
                      alt={booking.place.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Link 
                    to={`/place/${booking.place?.id}`}
                    className="text-lg font-medium text-blue-600 hover:underline"
                  >
                    {booking.place?.title}
                  </Link>
                  <p className="text-gray-600 mt-1">{booking.place?.address}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Max guests: {booking.place?.maxGuests}</span>
                    {booking.place?.checkIn && (
                      <>
                        <span> • Check-in: {booking.place.checkIn}</span>
                        <span> • Check-out: {booking.place.checkOut}</span>
                      </>
                    )}
                  </div>
                  {booking.place?.description && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {booking.place.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Guest Name</label>
                  <p className="text-gray-900">{booking.guestName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-gray-900">{booking.guestPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Number of Guests</label>
                  <p className="text-gray-900">{booking.numOfGuests}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Booking Date</label>
                  <p className="text-gray-900">{format(new Date(booking.createdAt), "MMM d, yyyy 'at' HH:mm")}</p>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700 block mb-2">Reserved Time Slots</label>
                {booking.timeSlots && booking.timeSlots.length > 0 ? (
                  <div className="space-y-2">
                    {booking.timeSlots.map((slot, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <span className="text-blue-800 font-medium">
                          {slot.formattedDate || format(new Date(slot.date), "MMM d, yyyy")}: {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-blue-800 font-medium">Full day booking</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information (for hosts and agents) */}
            {(user?.userType === 'host' || user?.userType === 'agent') && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Info */}
                  {booking.user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-700 mb-2">Client</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {booking.user.name}</p>
                        <p><span className="font-medium">Email:</span> {booking.user.email}</p>
                        <p><span className="font-medium">Phone:</span> {booking.user.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Host Info (for agents) */}
                  {user?.userType === 'agent' && booking.place?.owner && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-700 mb-2">Host</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {booking.place.owner.name}</p>
                        <p><span className="font-medium">Email:</span> {booking.place.owner.email}</p>
                        <p><span className="font-medium">Phone:</span> {booking.place.owner.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Pricing</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <PriceDisplay price={booking.totalPrice} currency={booking.place?.currency} />
                </div>
                {booking.serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <PriceDisplay price={booking.serviceFee} currency={booking.place?.currency} />
                  </div>
                )}
                {booking.protectionPlanSelected && (
                  <div className="flex justify-between">
                    <span>Protection Plan</span>
                    <PriceDisplay price={booking.protectionPlanFee} currency={booking.place?.currency} />
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <PriceDisplay 
                    price={booking.finalTotal || booking.totalPrice} 
                    currency={booking.place?.currency} 
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            {(() => {
              const actionButtons = getBookingActionButtons(booking, user, competingBookings);
              
              if (actionButtons.length === 0) {
                return null;
              }
              
              return (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Actions</h2>
                  <div className="space-y-3">
                    {actionButtons.map((button, index) => {
                      const getButtonClasses = (variant) => {
                        const baseClasses = "w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50";
                        switch (variant) {
                          case "primary":
                            return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
                          case "success":
                            return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
                          case "danger":
                            return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
                          case "secondary":
                            return `${baseClasses} bg-gray-400 text-white cursor-not-allowed`;
                          default:
                            return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
                        }
                      };
                      
                      return (
                        <button
                          key={index}
                          onClick={() => !button.disabled && showConfirmationModal(button)}
                          disabled={isUpdating || button.disabled}
                          className={getButtonClasses(button.variant)}
                          title={button.description}
                        >
                          {isUpdating ? "Processing..." : button.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          if (modalConfig.requiresPaymentCheck && !modalConfig.agentApproval) {
            // Show payment confirmation options for non-agent approvals
            return;
          }
          handleStatusUpdate(modalConfig.status);
        }}
        title={modalConfig.title}
        message={modalConfig.requiresPaymentCheck && modalConfig.paymentMessage ? 
          modalConfig.paymentMessage : 
          modalConfig.message
        }
        confirmText={modalConfig.agentApproval ? "Approve" : (modalConfig.requiresPaymentCheck ? "Approve Anyway" : "Confirm")}
        cancelText="Cancel"
        confirmButtonClass={
          modalConfig.status === "approved" || modalConfig.status === "selected"
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-red-600 hover:bg-red-700"
        }
        isLoading={isUpdating}
      >
        {/* Payment confirmation buttons for selected bookings (not for agent approvals) */}
        {modalConfig.requiresPaymentCheck && !modalConfig.agentApproval && (
          <div className="mt-4 space-y-2">
            <button
              onClick={() => handlePaymentConfirmation(true)}
              disabled={isUpdating}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Payment Confirmed - Approve
            </button>
            <button
              onClick={() => handlePaymentConfirmation(false)}
              disabled={isUpdating}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              Approve Without Payment Confirmation
            </button>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}