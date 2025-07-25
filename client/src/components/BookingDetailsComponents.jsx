import { format } from "date-fns";
import { Link } from "react-router-dom";
import CloudinaryImage from "./CloudinaryImage";
import PriceDisplay from "./PriceDisplay";
import { getLatestContactInfo, shouldShowUpdatedIndicator } from "../utils/bookingDetailsHelpers";

/**
 * Reusable UI components for BookingDetailsPage
 */

/**
 * Section card wrapper component
 */
export const SectionCard = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
};

/**
 * Information card component
 */
export const InfoCard = ({ 
  title, 
  icon, 
  value, 
  bgColor = "bg-gray-50", 
  borderColor = "border-gray-200" 
}) => {
  const iconComponent = typeof icon === 'string' ? getIconComponent(icon) : icon;
  
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-center mb-2">
        {iconComponent}
        <label className="text-sm font-medium text-gray-700">{title}</label>
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
};

/**
 * Contact information card component
 */
export const ContactInfoCard = ({ 
  title, 
  contactInfo, 
  bgGradient = "from-blue-50 to-cyan-50", 
  borderColor = "border-blue-200",
  iconBgColor = "bg-blue-100",
  iconTextColor = "text-blue-600",
  titleTextColor = "text-blue-800"
}) => {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center mb-4">
        <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center mr-3`}>
          <svg className={`w-4 h-4 ${iconTextColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className={`font-semibold ${titleTextColor}`}>{title}</h3>
      </div>
      <div className="space-y-3 text-sm">
        {contactInfo.name && (
          <ContactInfoRow 
            icon={<UserIcon />}
            label="Name"
            value={contactInfo.name}
            iconColor={iconTextColor}
            titleColor={titleTextColor}
          />
        )}
        {contactInfo.email && (
          <ContactInfoRow 
            icon={<EmailIcon />}
            label="Email"
            value={
              <a href={`mailto:${contactInfo.email}`} className={`ml-1 ${iconTextColor} hover:${titleTextColor} hover:underline break-all`}>
                {contactInfo.email}
              </a>
            }
            iconColor={iconTextColor}
            titleColor={titleTextColor}
            isLink
          />
        )}
        {contactInfo.phoneNumber && (
          <ContactInfoRow 
            icon={<PhoneIcon />}
            label="Phone"
            value={
              <a href={`tel:${contactInfo.phoneNumber}`} className={`ml-1 ${iconTextColor} hover:${titleTextColor} hover:underline`}>
                {contactInfo.phoneNumber}
              </a>
            }
            iconColor={iconTextColor}
            titleColor={titleTextColor}
            isLink
          />
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced contact information card component with update indicator
 */
export const EnhancedContactInfoCard = ({ 
  title, 
  userType,
  booking,
  latestContactInfo,
  bgGradient = "from-blue-50 to-cyan-50", 
  borderColor = "border-blue-200",
  iconBgColor = "bg-blue-100",
  iconTextColor = "text-blue-600",
  titleTextColor = "text-blue-800"
}) => {
  const contactInfo = getLatestContactInfo(userType, booking, latestContactInfo);
  const hasUpdates = shouldShowUpdatedIndicator(userType, booking, latestContactInfo);
  
  if (!contactInfo) return null;

  return (
    <div className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-lg p-6 shadow-sm relative`}>
      {/* Updated indicator */}
      {hasUpdates && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Updated
          </div>
        </div>
      )}
      
      <div className="flex items-center mb-4">
        <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center mr-3`}>
          <svg className={`w-4 h-4 ${iconTextColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className={`font-semibold ${titleTextColor}`}>{title}</h3>
      </div>
      <div className="space-y-3 text-sm">
        {contactInfo.name && (
          <ContactInfoRow 
            icon={<UserIcon />}
            label="Name"
            value={contactInfo.name}
            iconColor={iconTextColor}
            titleColor={titleTextColor}
          />
        )}
        {contactInfo.email && (
          <ContactInfoRow 
            icon={<EmailIcon />}
            label="Email"
            value={
              <a href={`mailto:${contactInfo.email}`} className={`ml-1 ${iconTextColor} hover:${titleTextColor} hover:underline break-all`}>
                {contactInfo.email}
              </a>
            }
            iconColor={iconTextColor}
            titleColor={titleTextColor}
            isLink
          />
        )}
        {contactInfo.phoneNumber && (
          <ContactInfoRow 
            icon={<PhoneIcon />}
            label="Phone"
            value={
              <a href={`tel:${contactInfo.phoneNumber}`} className={`ml-1 ${iconTextColor} hover:${titleTextColor} hover:underline`}>
                {contactInfo.phoneNumber}
              </a>
            }
            iconColor={iconTextColor}
            titleColor={titleTextColor}
            isLink
          />
        )}
      </div>
      
      {/* Show timestamp of last update if available */}
      {hasUpdates && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">
            * Contact information has been updated since booking was created
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Pricing section component
 */
export const PricingSection = ({ booking, user, children }) => {
  return (
    <SectionCard title="Pricing">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <PriceDisplay price={booking.totalPrice} currency={booking.place?.currency} />
        </div>
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
        
        {/* Additional content like payment status */}
        {children}
      </div>
    </SectionCard>
  );
};

/**
 * Payment status indicator component
 */
export const PaymentStatusIndicator = ({ status, userType, booking }) => {
  if (!((userType === 'host' || userType === 'agent'))) return null;

  // Format timestamp for display
  const formatPaymentTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting payment timestamp:', error);
      return '';
    }
  };

  if (status === 'approved') {
    // Check if payment to host has been made
    if (booking?.paidToHost) {
      const paidAtTimestamp = formatPaymentTimestamp(booking.paidToHostAt);
      return (
        <StatusIndicator
          status="Payment Completed & Paid to Host"
          message={paidAtTimestamp ? `Host was paid on ${paidAtTimestamp}` : "Host has been paid for this booking"}
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          iconColor="text-blue-600"
          titleColor="text-blue-800"
          descColor="text-blue-600"
        />
      );
    } else {
      return (
        <StatusIndicator
          status="Payment Completed"
          message={userType === 'agent' ? "Ready to pay host" : "Payment pending from agent"}
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
          bgColor="bg-green-50"
          borderColor="border-green-200"
          iconColor="text-green-600"
          titleColor="text-green-800"
          descColor="text-green-600"
        />
      );
    }
  }

  if (status === 'selected') {
    return (
      <StatusIndicator
        status="Awaiting Payment"
        message="Client can now proceed with payment to complete the booking"
        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        bgColor="bg-yellow-50"
        borderColor="border-yellow-200"
        iconColor="text-yellow-600"
        titleColor="text-yellow-800"
        descColor="text-yellow-600"
      />
    );
  }

  return null;
};

/**
 * Payment section component for clients
 */
export const PaymentSection = ({ isPaymentAvailable, paymentProviders, onPaymentClick }) => {
  return (
    <SectionCard title="Payment">
      <div className="space-y-4">
        {/* Payment Provider Icons */}
        <div className="grid grid-cols-3 gap-4">
          {paymentProviders.map((provider) => (
            <PaymentButton
              key={provider.id}
              provider={provider.id}
              isAvailable={isPaymentAvailable}
              onClick={onPaymentClick}
              iconSrc={provider.iconSrc}
              alt={provider.alt}
            />
          ))}
        </div>

        {/* Payment Status Messages */}
        {isPaymentAvailable ? (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <div className="font-medium text-green-800 mb-1">
                  Your booking has been selected! You can now proceed with payment.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-amber-800">
                Payment options will be available once your booking is selected by the host.
              </span>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

/**
 * Refund option item component
 */
export const RefundOptionItem = ({ option, formatRefundOption }) => {
  return (
    <p className="flex items-start bg-white bg-opacity-60 rounded-lg p-3 border border-yellow-100">
      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
      <span>{formatRefundOption(option)}</span>
    </p>
  );
};

/**
 * Refund policy section component
 */
export const RefundPolicySection = ({ booking, formatRefundOption }) => {
  // Get refund policy from booking snapshot, not from current place policy
  const refundPolicySnapshot = booking.refundPolicySnapshot;
  const protectionPlanSelected = booking.protectionPlanSelected;

  // Filter out protection plan if it wasn't selected by the client
  const filteredRefundOptions = refundPolicySnapshot && Array.isArray(refundPolicySnapshot)
    ? refundPolicySnapshot.filter(option => {
        if (option === 'client_protection_plan') {
          return protectionPlanSelected; // Only show if client selected protection
        }
        return true; // Show all other options
      })
    : [];

  // Check if we have any valid refund options to display
  const hasValidOptions = filteredRefundOptions.length > 0;

  return (
    <SectionCard title="Cancellation & Refund Policy">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-yellow-800">Policy at Time of Booking</h3>
          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
            {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
          </span>
        </div>
        
        <div className="text-sm text-yellow-700 space-y-2">
          {hasValidOptions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRefundOptions.map((option, index) => (
                <RefundOptionItem 
                  key={index}
                  option={option}
                  formatRefundOption={formatRefundOption}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-yellow-700 mb-2">
                <span className="font-medium">No specific refund policy was captured at the time of booking.</span>
              </p>
              <p className="text-sm text-yellow-600">
                Please contact customer support for assistance with cancellation and refund requests.
              </p>
            </div>
          )}
          
          {/* Show protection plan status */}
          {refundPolicySnapshot && refundPolicySnapshot.includes('client_protection_plan') && (
            <div className="mt-4 p-3 border border-yellow-300 rounded-lg bg-yellow-25">
              <div className="flex items-center">
                {protectionPlanSelected ? (
                  <>
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">
                      Client Protection Plan: Active
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Client Protection Plan: Not Selected
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

/**
 * Property details section component
 */
export const PropertyDetailsSection = ({ place }) => {
  return (
    <SectionCard title="Property Details">
      <div className="flex gap-4">
        {place?.photos?.[0] && (
          <div className="w-32 h-24 flex-shrink-0">
            <CloudinaryImage
              photo={place.photos[0]}
              alt={place.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
        <div className="flex-1">
          <Link 
            to={`/place/${place?.id}`}
            className="text-lg font-medium text-blue-600 hover:underline"
          >
            {place?.title}
          </Link>
          <p className="text-gray-600 mt-1">{place?.address}</p>
          <div className="mt-2 text-sm text-gray-500">
            {place?.checkIn && (
              <>
                <span> • Check-in: {place.checkIn}</span>
                <span> • Check-out: {place.checkOut}</span>
              </>
            )}
          </div>
          {place?.description && (
            <p className="text-gray-600 mt-2 text-sm line-clamp-2">
              {place.description}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

/**
 * Support contact section component
 */
export const SupportContactSection = ({ agentContact, getSupportContactHours }) => {
  return (
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
            <ContactInfoRow 
              icon={<UserIcon />}
              label="Agent"
              value={agentContact.name}
              iconColor="text-blue-500"
              titleColor="text-blue-700"
              valueColor="text-blue-800"
            />
            <ContactInfoRow 
              icon={<EmailIcon />}
              label="Email"
              value={
                <a href={`mailto:${agentContact.email}`} className="ml-1 text-blue-600 hover:text-blue-800 hover:underline break-all">
                  {agentContact.email}
                </a>
              }
              iconColor="text-blue-500"
              titleColor="text-blue-700"
              isLink
            />
            {agentContact.phoneNumber && (
              <>
                <ContactInfoRow 
                  icon={<PhoneIcon />}
                  label="Phone"
                  value={
                    <a href={`tel:${agentContact.phoneNumber}`} className="ml-1 text-blue-600 hover:text-blue-800 hover:underline">
                      {agentContact.phoneNumber}
                    </a>
                  }
                  iconColor="text-blue-500"
                  titleColor="text-blue-700"
                  isLink
                />
                <ContactInfoRow 
                  icon={<ClockIcon />}
                  label="Hours"
                  value={getSupportContactHours()}
                  iconColor="text-blue-500"
                  titleColor="text-blue-700"
                  valueColor="text-blue-600"
                  className="text-sm"
                />
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
  );
};

/**
 * Action buttons section component
 */
export const ActionButtonsSection = ({ 
  actionButtons, 
  isUpdating, 
  onActionClick, 
  getActionButtonClasses 
}) => {
  if (actionButtons.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Actions">
      <div className="space-y-3">
        {actionButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => !button.disabled && onActionClick(button)}
            disabled={isUpdating || button.disabled}
            className={getActionButtonClasses(button.variant)}
            title={button.description}
          >
            {isUpdating ? "Processing..." : button.label}
          </button>
        ))}
      </div>
    </SectionCard>
  );
};

/**
 * Status indicator component
 */
export const StatusIndicator = ({ 
  status, 
  message, 
  icon, 
  bgColor = "bg-green-50", 
  borderColor = "border-green-200",
  iconColor = "text-green-600",
  titleColor = "text-green-800",
  descColor = "text-green-600"
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className={`${bgColor} border ${borderColor} rounded-lg p-3`}>
        <div className="flex items-center">
          <svg className={`w-5 h-5 ${iconColor} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
          <div className="flex-1">
            <p className={`text-sm font-medium ${titleColor}`}>{status}</p>
            <p className={`text-xs ${descColor}`}>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Time slot card component
 */
export const TimeSlotCard = ({ slot, index }) => {
  return (
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
  );
};

/**
 * Full day booking indicator
 */
export const FullDayBookingCard = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm text-center">
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
        <span className="text-blue-800 font-medium text-lg">Full Day Booking</span>
      </div>
      <p className="text-blue-600 text-sm mt-2">This booking covers the entire day</p>
    </div>
  );
};

/**
 * Payment button component
 */
export const PaymentButton = ({ provider, isAvailable, onClick, iconSrc, alt }) => {
  const getProviderSpecificMessage = (providerId) => {
    if (providerId === 'click') {
      return isAvailable ? 'Pay with Click' : 'Click Pay - Available after selection';
    }
    if (providerId === 'payme') {
      return isAvailable ? 'Pay with Payme' : 'Payme - Available after selection';
    }
    if (providerId === 'octo') {
      return isAvailable ? 'Pay with Octo' : 'Octo Pay - Available after selection';
    }
    return isAvailable ? `Pay with ${alt}` : 'Available after booking selection';
  };

  const getButtonStyles = () => {
    if (provider === 'click' && isAvailable) {
      return 'border-blue-500 hover:border-blue-600 hover:shadow-lg hover:bg-blue-50 cursor-pointer transform hover:scale-105';
    }
    if (isAvailable) {
      return 'border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer';
    }
    return 'border-gray-200 cursor-not-allowed opacity-50';
  };

  return (
    <button
      onClick={() => isAvailable && onClick(provider)}
      disabled={!isAvailable}
      className={`p-4 border-2 rounded-lg transition-all duration-200 ${getButtonStyles()}`}
      title={getProviderSpecificMessage(provider)}
    >
      <div className="flex flex-col items-center">
        <img 
          src={iconSrc} 
          alt={alt} 
          className="w-32 h-20 object-contain"
        />
      </div>
    </button>
  );
};

/**
 * Booking Timeline Component
 * Shows the complete booking status progression with timestamps
 * Visible to hosts and agents only
 */
export const BookingTimeline = ({ booking, userType }) => {
  // Only show for hosts and agents
  if (userType !== 'host' && userType !== 'agent') return null;

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return null;
    }
  };

  // Build timeline steps based on booking data
  const getTimelineSteps = () => {
    const steps = [];
    
    // 1. Request Submitted (always present)
    steps.push({
      title: 'Request Submitted',
      timestamp: booking.createdAt ? formatTimestamp(booking.createdAt) : null,
      status: 'completed',
      icon: 'submit'
    });

    // 2. Selected for Payment (if booking was selected)
    if (booking.selectedAt || booking.status === 'selected' || 
        booking.status === 'approved' || booking.status === 'rejected') {
      steps.push({
        title: 'Selected for Payment',
        timestamp: booking.selectedAt ? formatTimestamp(booking.selectedAt) : null,
        status: booking.selectedAt ? 'completed' : 'unknown',
        icon: 'selected'
      });
    }

    // 3. Pending Payment (transitional step for selected bookings)
    if (booking.status === 'selected' || booking.status === 'approved') {
      steps.push({
        title: 'Pending Payment',
        timestamp: booking.selectedAt ? formatTimestamp(booking.selectedAt) : null,
        status: booking.status === 'approved' ? 'completed' : 'current',
        icon: 'pending'
      });
    }

    // 4. Payment Complete (for approved bookings)
    if (booking.status === 'approved') {
      steps.push({
        title: 'Payment Complete',
        timestamp: booking.approvedAt ? formatTimestamp(booking.approvedAt) : null,
        status: 'completed',
        icon: 'payment'
      });
    }

    // 5. Confirmed (for approved bookings)
    if (booking.status === 'approved') {
      steps.push({
        title: 'Confirmed',
        timestamp: booking.approvedAt ? formatTimestamp(booking.approvedAt) : null,
        status: 'completed',
        icon: 'confirmed'
      });
    }

    // 6. Paid to Host (for approved bookings with agent payment)
    if (booking.status === 'approved') {
      steps.push({
        title: 'Paid to Host',
        timestamp: booking.paidToHostAt ? formatTimestamp(booking.paidToHostAt) : null,
        status: booking.paidToHost ? 'completed' : 'pending',
        icon: 'paid',
        description: booking.paidToHost 
          ? `Agent marked payment complete`
          : userType === 'agent' 
            ? 'Ready to mark payment complete' 
            : 'Awaiting payment from agent'
      });
    }

    // 7. Rejected (if booking was rejected)
    if (booking.status === 'rejected') {
      steps.push({
        title: 'Rejected',
        timestamp: booking.rejectedAt ? formatTimestamp(booking.rejectedAt) : null,
        status: 'rejected',
        icon: 'rejected'
      });
    }

    return steps;
  };

  const getStepIcon = (iconType, status) => {
    const iconClass = `w-4 h-4 ${
      status === 'completed' ? 'text-green-600' :
      status === 'current' ? 'text-blue-600' :
      status === 'pending' ? 'text-gray-400' :
      status === 'rejected' ? 'text-red-600' :
      'text-gray-400'
    }`;

    switch (iconType) {
      case 'submit':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'selected':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'confirmed':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'paid':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <div className={`w-2 h-2 rounded-full ${
            status === 'completed' ? 'bg-green-500' :
            status === 'current' ? 'bg-blue-500' :
            status === 'pending' ? 'bg-gray-300' :
            status === 'rejected' ? 'bg-red-500' :
            'bg-gray-300'
          }`}></div>
        );
    }
  };

  const timelineSteps = getTimelineSteps();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Booking Timeline
        </h3>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {timelineSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 mr-3">
                {getStepIcon(step.icon, step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-gray-900' :
                  step.status === 'current' ? 'text-blue-900' :
                  step.status === 'pending' ? 'text-gray-500' :
                  step.status === 'rejected' ? 'text-red-900' :
                  'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-600">
                  {step.timestamp || 
                   (step.status === 'pending' ? step.description || 'Pending' : 
                    step.status === 'unknown' ? 'Status transition occurred' : 
                    'No timestamp available')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Legacy PaymentTimeline Component (kept for backward compatibility)
 * Use BookingTimeline for new implementations
 */
export const PaymentTimeline = ({ booking, userType }) => {
  // Redirect to the new BookingTimeline component
  return <BookingTimeline booking={booking} userType={userType} />;
};

// Icon components
const UserIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GuestsIcon = () => (
  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

/**
 * Get icon component by name
 */
export const getIconComponent = (iconName) => {
  const icons = {
    guests: <GuestsIcon />,
    calendar: <CalendarIcon />,
    code: <CodeIcon />,
    user: <UserIcon />,
    email: <EmailIcon />,
    phone: <PhoneIcon />,
    clock: <ClockIcon />
  };
  
  return icons[iconName] || null;
};

// Updated ContactInfoRow component
const ContactInfoRow = ({ icon, label, value, iconColor, titleColor, valueColor, isLink = false, className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className={`w-3 h-3 ${iconColor} mr-2 flex-shrink-0`}>
        {icon}
      </span>
      <span className={`font-medium ${titleColor}`}>{label}:</span>
      {isLink ? value : <span className={`ml-1 ${valueColor || titleColor}`}>{value}</span>}
    </div>
  );
};

export default SectionCard;
