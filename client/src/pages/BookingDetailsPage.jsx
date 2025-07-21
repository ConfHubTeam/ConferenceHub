import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import AccountNav from "../components/AccountNav";
import PriceDisplay from "../components/PriceDisplay";
import CloudinaryImage from "../components/CloudinaryImage";
import ConfirmationModal from "../components/ConfirmationModal";
import LoadingSpinner from "../components/LoadingSpinner";
import BookingProgress from "../components/BookingProgress";
import { 
  SectionCard, 
  InfoCard, 
  ContactInfoCard, 
  EnhancedContactInfoCard,
  StatusIndicator, 
  TimeSlotCard, 
  FullDayBookingCard, 
  PaymentButton,
  PricingSection,
  PaymentStatusIndicator,
  PaymentSection,
  RefundPolicySection,
  PropertyDetailsSection,
  SupportContactSection,
  ActionButtonsSection,
  getIconComponent
} from "../components/BookingDetailsComponents";
import {
  getBookingInfoCards,
  getActionButtonClasses,
  getPaymentProviders,
  canViewContactInfo,
  canViewSupportContact,
  getSupportContactHours,
  formatRefundOption,
  getContactDisplayInfo,
  getLatestContactInfo,
  shouldShowUpdatedIndicator,
  shouldShowPaymentSection,
  getModalConfiguration
} from "../utils/bookingDetailsHelpers";
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [booking, setBooking] = useState(null);
  const [competingBookings, setCompetingBookings] = useState([]);
  const [agentContact, setAgentContact] = useState(null);
  const [latestContactInfo, setLatestContactInfo] = useState({
    client: null,
    host: null
  });
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  /**
   * Handles return from Click payment page
   */
  const handlePaymentReturn = async (paymentStatus, transactionId, error) => {
    try {
      if (error) {
        notify(`Payment failed: ${error}`, "error");
        return;
      }

      if (paymentStatus === 'success' || transactionId) {
        notify("Payment completed! Refreshing booking status...", "success");
        
        // Refresh booking data to get updated status
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data);
        
        // Show success message
        setTimeout(() => {
          notify("Booking status updated successfully!", "success");
        }, 1000);
      } else if (paymentStatus === 'failed') {
        notify("Payment was not completed. You can try again.", "warning");
      } else if (paymentStatus === 'cancelled') {
        notify("Payment was cancelled. You can try again when ready.", "info");
      }
    } catch (error) {
      console.error('Error handling payment return:', error);
      notify("Error updating booking status. Please refresh the page.", "error");
    }
  };

  // Check for payment return parameters
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    const transactionId = searchParams.get('transaction_id');
    const error = searchParams.get('error');

    if (paymentStatus || transactionId || error) {
      // Handle payment completion return
      handlePaymentReturn(paymentStatus, transactionId, error);
      
      // Clean up URL parameters
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, bookingId, notify]);

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

        // Fetch latest contact information for users involved in booking
        if (user?.userType === 'agent') {
          await fetchLatestContactInfo(data);
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

    const fetchLatestContactInfo = async (bookingData) => {
      try {
        // Use contact info already included in booking response
        const contactInfo = { client: null, host: null };
        
        // Set client contact info from booking user data
        if (bookingData.user) {
          contactInfo.client = {
            name: bookingData.user.name,
            email: bookingData.user.email,
            phoneNumber: bookingData.user.phoneNumber
          };
        }
        
        // Set host contact info from booking place owner data
        if (bookingData.place?.owner) {
          contactInfo.host = {
            name: bookingData.place.owner.name,
            email: bookingData.place.owner.email,
            phoneNumber: bookingData.place.owner.phoneNumber
          };
        }
        
        setLatestContactInfo(contactInfo);
      } catch (error) {
        console.error('Error processing contact info:', error);
        // Fallback to booking's stored contact info if processing fails
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

  // Handle paid to host action
  const handlePaidToHost = async () => {
    setIsUpdating(true);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/paid-to-host`);
      
      setBooking(data.booking);
      notify(data.message || "Payment to host marked successfully", "success");
      setShowModal(false);
    } catch (error) {
      notify(`Error: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Show confirmation modal for booking actions
  const showConfirmationModal = (actionButton) => {
    const { label, action, description, requiresPaymentCheck, agentApproval } = actionButton;
    
    // Handle paid to host action differently
    if (action === 'paid_to_host') {
      setModalConfig({
        title: `${label}`,
        message: description || `Are you sure you want to mark payment to host as complete?`,
        status: action,
        action: 'paid_to_host',
        requiresPaymentCheck: false,
        agentApproval: false
      });
    } else {
      setModalConfig({
        title: `${label} Booking`,
        message: description || `Are you sure you want to ${label.toLowerCase()} this booking?`,
        status: action,
        action: label.toLowerCase(),
        requiresPaymentCheck: requiresPaymentCheck || false,
        agentApproval: agentApproval || false
      });
    }
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

  // Handle payment provider selection
  const handlePaymentClick = async (provider) => {
    if (!isPaymentAvailable()) {
      notify("Payment is only available for selected bookings", "warning");
      return;
    }

    if (provider === 'click') {
      try {
        setLoading(true);
        notify("Generating payment link...", "info");
        
        const response = await api.post('/click/checkout', {
          bookingId: booking.id
        });

        if (response.data.success && response.data.url) {
          // Open Click payment page in new tab
          window.open(response.data.url, '_blank', 'noopener,noreferrer');
          
          notify("Payment window opened or allow window pop up. Complete payment to confirm booking.", "success");
          
          // Optionally refresh booking details after a delay to check for payment updates
          setTimeout(() => {
            fetchBookingDetails();
            
            // Set up periodic checking for payment status updates
            const paymentCheckInterval = setInterval(() => {
              fetchBookingDetails();
            }, 10000); // Check every 10 seconds
            
            // Clear interval after 5 minutes (30 checks)
            setTimeout(() => {
              clearInterval(paymentCheckInterval);
            }, 300000);
          }, 5000);
        } else {
          throw new Error("Failed to generate payment link");
        }
      } catch (error) {
        console.error("Payment error:", error);
        const errorMessage = error.response?.data?.error || error.message || "Failed to initiate payment";
        notify(`Payment Error: ${errorMessage}`, "error");
      } finally {
        setLoading(false);
      }
    } else if (provider === 'payme') {
      // Placeholder for Payme integration
      notify("Payme integration will be implemented soon", "info");
    } else if (provider === 'octo') {
      // Placeholder for Octo integration 
      notify("Octo integration will be implemented soon", "info");
    } else {
      // Generic fallback
      notify(`${provider.charAt(0).toUpperCase() + provider.slice(1)} integration will be implemented soon`, "info");
    }
    
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
            <PropertyDetailsSection place={booking.place} />

            {/* Booking Information */}
            <SectionCard title="Booking Information">
              {/* Booking Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {getBookingInfoCards(booking).map((card, index) => (
                  <InfoCard 
                    key={index}
                    title={card.title}
                    icon={card.icon}
                    value={card.value}
                  />
                ))}
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
                      <TimeSlotCard key={index} slot={slot} index={index} />
                    ))}
                  </div>
                ) : (
                  <FullDayBookingCard />
                )}
              </div>
            </SectionCard>

            {/* Contact Information */}
            <SectionCard title="Contact Information">
              {/* Agent can see both client and host info */}
              {canViewContactInfo(user?.userType) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Info for agents */}
                  {booking.user && (
                    <EnhancedContactInfoCard
                      title="Client"
                      userType="client"
                      booking={booking}
                      latestContactInfo={latestContactInfo}
                      bgGradient="from-blue-50 to-cyan-50"
                      borderColor="border-blue-200"
                      iconBgColor="bg-blue-100"
                      iconTextColor="text-blue-600"
                      titleTextColor="text-blue-800"
                    />
                  )}
                  
                  {/* Host Info for agents */}
                  {booking.place?.owner && (
                    <EnhancedContactInfoCard
                      title="Host"
                      userType="host"
                      booking={booking}
                      latestContactInfo={latestContactInfo}
                      bgGradient="from-green-50 to-emerald-50"
                      borderColor="border-green-200"
                      iconBgColor="bg-green-100"
                      iconTextColor="text-green-600"
                      titleTextColor="text-green-800"
                    />
                  )}
                </div>
              )}
              
              {/* Client and Host see admin contact info instead */}
              {canViewSupportContact(user?.userType) && (
                <SupportContactSection 
                  agentContact={agentContact}
                  getSupportContactHours={getSupportContactHours}
                />
              )}
            </SectionCard>

            {/* Cancellation & Refund Policy */}
            <RefundPolicySection 
              booking={booking}
              formatRefundOption={formatRefundOption}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              {/* Pricing */}
            <PricingSection booking={booking} user={user}>
              <PaymentStatusIndicator status={booking.status} userType={user?.userType} booking={booking} />
            </PricingSection>

            {/* Payment Section - Only for clients */}
            {shouldShowPaymentSection(user) && (
              <PaymentSection 
                isPaymentAvailable={isPaymentAvailable()}
                paymentProviders={getPaymentProviders()}
                onPaymentClick={handlePaymentClick}
              />
            )}

            {/* Actions */}
            {(() => {
              const { buttons, note } = getBookingActionButtons(booking, user, competingBookings);
              return (
                <>
                  {note && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm text-amber-800">{note}</p>
                      </div>
                    </div>
                  )}
                  <ActionButtonsSection 
                    actionButtons={buttons}
                    isUpdating={isUpdating}
                    onActionClick={showConfirmationModal}
                    getActionButtonClasses={getActionButtonClasses}
                  />
                </>
              );
            })()}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {(() => {
        const modalProps = getModalConfiguration(modalConfig, isUpdating);
        return (
          <ConfirmationModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onConfirm={() => {
              if (modalConfig.action === 'paid_to_host') {
                handlePaidToHost();
              } else if (modalConfig.requiresPaymentCheck && !modalConfig.agentApproval) {
                // Show payment confirmation options for non-agent approvals
                return;
              } else {
                handleStatusUpdate(modalConfig.status);
              }
            }}
            title={modalProps.title}
            message={modalProps.message}
            confirmText={modalProps.confirmText}
            cancelText={modalProps.cancelText}
            confirmButtonClass={modalProps.confirmButtonClass}
            isLoading={modalProps.isLoading}
          >
            {/* Payment confirmation buttons for selected bookings (not for agent approvals) */}
            {modalProps.showPaymentOptions && (
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
        );
      })()}
    </div>
  );
}