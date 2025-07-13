import { format } from "date-fns";
import { Link } from "react-router-dom";

/**
 * BookingProgress Component
 * Shows a visual progress indicator for booking status with timestamps
 */
export default function BookingProgress({ booking, userType }) {
  // Define progress steps with their configurations
  const getProgressSteps = () => {
    const steps = [
      {
        id: "pending",
        label: "Request Submitted",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: "Booking request submitted and awaiting review"
      },
      {
        id: "selected",
        label: "Selected for Payment",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: "Booking selected by host, proceed with payment"
      },
      {
        id: "payment_pending",
        label: "Pending Payment", 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
        description: "Payment required to confirm booking"
      },
      {
        id: "payment_complete",
        label: "Payment Complete",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        description: "Payment confirmed, awaiting final approval"
      },
      {
        id: "approved",
        label: "Confirmed",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        description: "Booking confirmed and ready"
      }
    ];

    // Add "Paid to Host" step only for HOST and AGENT users
    if (userType === 'host' || userType === 'agent') {
      steps.push({
        id: "paid_to_host",
        label: "Paid to Host",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        ),
        description: booking.paidToHost 
          ? "Agent has paid the host" 
          : userType === 'agent' 
            ? "Ready to mark payment complete" 
            : "Awaiting payment from agent"
      });
    }

    return steps;
  };

  // Get step status and timestamp information
  const getStepInfo = (stepId) => {
    const currentStatus = booking.status;
    
    // Determine if step is completed, current, or pending using dedicated timestamp fields
    let status = "pending";
    let timestamp = null;
    let completedByAgent = false;
    
    switch (stepId) {
      case "pending":
        // Always completed as booking exists
        status = "completed";
        timestamp = booking.createdAt ? new Date(booking.createdAt) : null;
        break;
        
      case "selected":
        if (booking.selectedAt || currentStatus === "selected" || currentStatus === "approved") {
          status = "completed";
          timestamp = booking.selectedAt ? new Date(booking.selectedAt) : null;
          // Check if selection was done by agent (heuristic: if approved without client payment)
          completedByAgent = userType === 'agent' && booking.selectedAt;
        } else {
          status = "pending";
        }
        break;
        
      case "payment_pending":
        if (currentStatus === "selected") {
          status = "current";
          timestamp = booking.selectedAt ? new Date(booking.selectedAt) : null;
        } else if (currentStatus === "approved") {
          status = "completed";
          timestamp = booking.selectedAt ? new Date(booking.selectedAt) : null;
        } else {
          status = "pending";
        }
        break;
        
      case "payment_complete":
        if (currentStatus === "approved") {
          status = "completed";
          timestamp = booking.approvedAt ? new Date(booking.approvedAt) : null;
          // Check if approval was done by agent (heuristic: if approved quickly after selection)
          if (booking.selectedAt && booking.approvedAt) {
            const timeDiff = new Date(booking.approvedAt) - new Date(booking.selectedAt);
            completedByAgent = userType === 'agent' && timeDiff < 60000; // Within 1 minute suggests agent approval
          }
        } else {
          status = "pending";
        }
        break;
        
      case "approved":
        if (currentStatus === "approved") {
          status = "completed";
          timestamp = booking.approvedAt ? new Date(booking.approvedAt) : null;
          // Same logic as payment_complete for agent indicator
          if (booking.selectedAt && booking.approvedAt) {
            const timeDiff = new Date(booking.approvedAt) - new Date(booking.selectedAt);
            completedByAgent = userType === 'agent' && timeDiff < 60000;
          }
        } else {
          status = "pending";
        }
        break;
        
      case "paid_to_host":
        // Only show for approved bookings and only for hosts/agents
        if (currentStatus === "approved" && (userType === 'host' || userType === 'agent')) {
          if (booking.paidToHost) {
            status = "completed";
            timestamp = booking.paidToHostAt ? new Date(booking.paidToHostAt) : null;
            completedByAgent = userType === 'agent';
          } else {
            status = "pending";
            // No timestamp for pending paid to host
          }
        } else {
          status = "pending";
        }
        break;
    }
    
    return { status, timestamp, completedByAgent };
  };

  // Handle rejected bookings differently
  const isRejected = booking.status === "rejected";
  
  if (isRejected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Booking Status</h3>
        
        {/* Rejected Progress */}
        <div className="flex items-center justify-between mb-6">
          {/* Pending Step */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">Request Submitted</div>
              <div className="text-gray-500">
                {format(new Date(booking.createdAt), "MMM d, yyyy")}
              </div>
              <div className="text-xs text-gray-400">
                {format(new Date(booking.createdAt), "h:mm a")}
              </div>
            </div>
          </div>
          
          {/* Progress Line */}
          <div className="flex-1 mx-6">
            <div className="relative">
              <div className="h-1 bg-red-200 rounded"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Rejected Step */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-red-900">Request Declined</div>
              <div className="text-gray-500">
                {format(new Date(booking.rejectedAt || booking.updatedAt), "MMM d, yyyy")}
              </div>
              <div className="text-xs text-gray-400">
                {format(new Date(booking.rejectedAt || booking.updatedAt), "h:mm a")}
              </div>
            </div>
          </div>
        </div>
        
        {/* Rejection Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                Booking Unavailable
              </h4>
              <p className="text-sm text-red-700 mb-4">
                Unfortunately, your requested time slot is no longer available. This could be due to another booking being confirmed or changes in availability. We apologize for any inconvenience.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={`/place/${booking.place?.id}`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View Available Times
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Other Venues
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular progress flow for non-rejected bookings
  const steps = getProgressSteps();
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">Booking Progress</h3>
      
      <div className="space-y-8">
        {steps.map((step, index) => {
          const stepInfo = getStepInfo(step.id);
          const isCompleted = stepInfo.status === "completed";
          const isCurrent = stepInfo.status === "current";
          const isPending = stepInfo.status === "pending";
          
          return (
            <div key={step.id} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute left-5 top-12 w-0.5 h-8 ${
                    isCompleted ? "bg-green-400" : "bg-gray-200"
                  }`}
                ></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Step icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? "bg-green-100 border-green-500 text-green-600"
                        : isCurrent
                        ? "bg-blue-100 border-blue-500 text-blue-600 shadow-md"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      <div className="w-3 h-3 rounded-full bg-current animate-pulse"></div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                    )}
                  </div>
                </div>
                
                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4
                        className={`text-base font-semibold ${
                          isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p
                        className={`text-sm mt-1 ${
                          isCompleted || isCurrent ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Timestamp and agent indicator */}
                    {stepInfo.timestamp && (
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {format(stepInfo.timestamp, "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(stepInfo.timestamp, "h:mm a")}
                        </div>
                        {stepInfo.completedByAgent && (
                          <div className="text-xs text-blue-600 font-medium mt-1 bg-blue-50 px-2 py-1 rounded">
                            by Agent
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Current step indicator */}
                  {isCurrent && (
                    <div className="mt-3 flex items-center text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm font-medium">Current Step</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Additional status information */}
      {booking.status === "selected" && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Next Steps
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                Your booking has been selected by the host. Please proceed with payment to confirm your reservation.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {booking.status === "approved" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Booking Confirmed
              </h4>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
