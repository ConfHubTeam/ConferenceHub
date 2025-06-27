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
  requiresPaymentBeforeApproval,
  canPerformBookingAction
} from "../utils/bookingUtils";

export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [competingBookings, setCompetingBookings] = useState([]);
  const [agentContact, setAgentContact] = useState(null);
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

        // Fetch agent contact information for admin contact section
        if (user?.userType === 'client' || user?.userType === 'host') {
          await fetchAgentContact();
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

    const fetchAgentContact = async () => {
      try {
        // For clients and hosts, get admin contact information using dedicated endpoint
        const response = await api.get('/users/admin/contact');
        
        if (response.data) {
          setAgentContact({
            name: response.data.name,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber
          });
        }
      } catch (error) {
        console.error('Error loading admin contact:', error);
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

  // Check if payment is available for the current booking
  const isPaymentAvailable = () => {
    return canPerformBookingAction(user, booking, "pay");
  };

  // Handle payment provider selection (placeholder for future implementation)
  const handlePaymentClick = (provider) => {
    if (!isPaymentAvailable()) {
      notify("Payment is only available for selected bookings", "warning");
      return;
    }

    // Placeholder for future payment integration
    notify(`Payment with ${provider.charAt(0).toUpperCase() + provider.slice(1)} will be implemented soon`, "info");
    
    // Future implementation will:
    // 1. Redirect to third-party payment service
    // 2. Handle success/failure response
    // 3. Save non-sensitive payment transaction data to database
    // 4. Update booking status and show payment transaction info
    
    console.log(`Payment initiated with provider: ${provider} for booking ${booking.id}`);
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Booking Progress */}
            <BookingProgress booking={booking} userType={user?.userType} />
            
            {/* Place Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <div className="flex gap-4">
                {booking.place?.photos?.[0] && (
                  <div className="w-32 h-24 flex-shrink-0">
                    <CloudinaryImage
                      photo={booking.place.photos[0]}
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
              <h2 className="text-xl font-semibold mb-6">Booking Information</h2>
              
              {/* Booking Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <label className="text-sm font-medium text-gray-700">Number of Guests</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{booking.numOfGuests}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <label className="text-sm font-medium text-gray-700">Booking Date</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{format(new Date(booking.createdAt), "MMM d, yyyy 'at' HH:mm")}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <label className="text-sm font-medium text-gray-700">Request ID</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{booking.uniqueRequestId || `REQ-${booking.id}`}</p>
                </div>
              </div>

              {/* Time Slots Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center mb-4">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900">Reserved Time Slots</h3>
                </div>
                {booking.timeSlots && booking.timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {booking.timeSlots.map((slot, index) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <p className="text-blue-800 font-medium text-sm">
                              {slot.formattedDate || format(new Date(slot.date), "MMM d, yyyy")}
                            </p>
                            <p className="text-blue-700 text-sm font-semibold">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-blue-800 font-medium text-lg">Full Day Booking</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-2">This booking covers the entire day</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
              
              {/* Agent can see both client and host info */}
              {user?.userType === 'agent' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Info for agents */}
                  {booking.user && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-blue-800">Client</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-blue-700">Name:</span>
                          <span className="ml-1 text-blue-800">{booking.user.name}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-blue-700">Email:</span>
                          <a href={`mailto:${booking.user.email}`} className="ml-1 text-blue-600 hover:text-blue-800 hover:underline break-all">
                            {booking.user.email}
                          </a>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-medium text-blue-700">Phone:</span>
                          <a href={`tel:${booking.user.phoneNumber}`} className="ml-1 text-blue-600 hover:text-blue-800 hover:underline">
                            {booking.user.phoneNumber}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Host Info for agents */}
                  {booking.place?.owner && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-green-800">Host</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-green-700">Name:</span>
                          <span className="ml-1 text-green-800">{booking.place.owner.name}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-green-700">Email:</span>
                          <a href={`mailto:${booking.place.owner.email}`} className="ml-1 text-green-600 hover:text-green-800 hover:underline break-all">
                            {booking.place.owner.email}
                          </a>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-medium text-green-700">Phone:</span>
                          <a href={`tel:${booking.place.owner.phoneNumber}`} className="ml-1 text-green-600 hover:text-green-800 hover:underline">
                            {booking.place.owner.phoneNumber}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Client and Host see admin contact info instead */}
              {(user?.userType === 'client' || user?.userType === 'host') && (
                <div className="max-w-2xl">
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          <circle cx="12" cy="8" r="3" />
                          <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-blue-800 text-base">Support Contact</h3>
                    </div>
                    {agentContact ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-blue-700">Agent:</span>
                          <span className="ml-1 text-blue-800">{agentContact.name}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-blue-700">Email:</span>
                          <a href={`mailto:${agentContact.email}`} className="ml-1 text-blue-600 hover:text-blue-800 hover:underline break-all">
                            {agentContact.email}
                          </a>
                        </div>
                        {agentContact.phoneNumber && (
                          <>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="font-medium text-blue-700">Phone:</span>
                              <a href={`tel:${agentContact.phoneNumber}`} className="ml-1 text-blue-600 hover:text-blue-800 hover:underline">
                                {agentContact.phoneNumber}
                              </a>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium text-blue-700">Hours:</span>
                              <span className="ml-1 text-sm text-blue-600">Mon-Fri: 9 AM - 6 PM, Sat: 10 AM - 4 PM</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-blue-600">
                        <p>Contact information is currently unavailable. Please try again later.</p>
                      </div>
                    )}
                    <p className="text-xs text-blue-600 mt-2 italic">
                      For booking-related inquiries, questions, or assistance
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Cancellation & Refund Policy */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Cancellation & Refund Policy</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Policy at Time of Booking</h3>
                <div className="text-sm text-yellow-700 space-y-2">
                  {booking.place?.refundOptions && booking.place.refundOptions.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {booking.place.refundOptions.map((option, index) => {
                          const formatRefundOption = (option) => {
                            const optionMap = {
                              'flexible_14_day': 'Flexible 14-Day: Full refund if canceled 14+ days before check-in',
                              'moderate_7_day': 'Moderate 7-Day: 50% refund if canceled 7+ days before check-in', 
                              'strict': 'Strict: No refund unless exceptional circumstances',
                              'non_refundable': 'Non-Refundable: No refunds allowed',
                              'reschedule_only': 'Reschedule Only: Can reschedule but no monetary refund',
                              'client_protection_plan': 'Client Protection Plan: Additional insurance coverage available'
                            };
                            return optionMap[option] || option;
                          };
                          
                          return (
                            <p key={index} className="flex items-start bg-white bg-opacity-60 rounded-lg p-3 border border-yellow-100">
                              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span>{formatRefundOption(option)}</span>
                            </p>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p><span className="font-medium">Contact Support:</span> </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
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
                
                {/* Payment Status - For hosts and agents */}
                {(user?.userType === 'host' || user?.userType === 'agent') && booking.status === 'approved' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">Payment Completed</p>
                          <p className="text-xs text-green-600">
                            {/* Placeholder for payment transaction info */}
                            Transaction will be displayed here once payment integration is complete
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment Pending - For hosts and agents when booking is selected */}
                {(user?.userType === 'host' || user?.userType === 'agent') && booking.status === 'selected' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800">Awaiting Payment</p>
                          <p className="text-xs text-yellow-600">
                            Client can now proceed with payment to complete the booking
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section - Only for clients */}
            {user?.userType === 'client' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Payment</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    {isPaymentAvailable() ? 
                      'Choose your preferred payment method to complete the booking:' : 
                      'Payment options will be available once your booking is selected by the host.'}
                  </p>
                  
                  {/* Payment Provider Icons */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Click Pay */}
                    <button
                      onClick={() => isPaymentAvailable() && handlePaymentClick('click')}
                      disabled={!isPaymentAvailable()}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                        isPaymentAvailable() 
                          ? 'border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer' 
                          : 'border-gray-200 cursor-not-allowed opacity-50'
                      }`}
                      title={isPaymentAvailable() ? 'Pay with Click' : 'Available after booking selection'}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <img 
                          src="/click_pay_icon.jpg" 
                          alt="Click Pay" 
                          className="w-16 h-12 object-contain"
                        />
                        <span className="text-xs font-medium text-gray-700">Click</span>
                      </div>
                    </button>

                    {/* Payme */}
                    <button
                      onClick={() => isPaymentAvailable() && handlePaymentClick('payme')}
                      disabled={!isPaymentAvailable()}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                        isPaymentAvailable() 
                          ? 'border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer' 
                          : 'border-gray-200 cursor-not-allowed opacity-50'
                      }`}
                      title={isPaymentAvailable() ? 'Pay with Payme' : 'Available after booking selection'}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <img 
                          src="/payme_icon.png" 
                          alt="Payme" 
                          className="w-16 h-12 object-contain"
                        />
                        <span className="text-xs font-medium text-gray-700">Payme</span>
                      </div>
                    </button>

                    {/* Octo Pay */}
                    <button
                      onClick={() => isPaymentAvailable() && handlePaymentClick('octo')}
                      disabled={!isPaymentAvailable()}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                        isPaymentAvailable() 
                          ? 'border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer' 
                          : 'border-gray-200 cursor-not-allowed opacity-50'
                      }`}
                      title={isPaymentAvailable() ? 'Pay with Octo' : 'Available after booking selection'}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <img 
                          src="/octo_pay_icon.webp" 
                          alt="Octo Pay" 
                          className="w-16 h-12 object-contain"
                        />
                        <span className="text-xs font-medium text-gray-700">Octo</span>
                      </div>
                    </button>
                  </div>

                  {/* Payment Status Messages */}
                  {isPaymentAvailable() && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Your booking has been selected! You can now proceed with payment.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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