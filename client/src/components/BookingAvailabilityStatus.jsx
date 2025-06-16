import React from "react";
import { isTimeRangeAvailable } from "../utils/TimeUtils";

/**
 * BookingAvailabilityStatus Component
 * 
 * Displays visual indicators for booking availability
 * Shows different colors based on time slot availability for dates
 */
export default function BookingAvailabilityStatus({ 
  selectedCalendarDates = [], 
  bookedTimeSlots = [],
  isLoadingAvailability = false 
}) {
  if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
    return null;
  }

  // Check availability for each selected date
  const checkDateAvailability = (selectedDate) => {
    const { date, startTime, endTime } = selectedDate;
    
    // Use the utility function to check if the entire time range is available
    const isAvailable = isTimeRangeAvailable(date, startTime, endTime, bookedTimeSlots);
    
    return isAvailable ? 'available' : 'unavailable';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'unavailable':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        );
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Not Available';
      default:
        return 'Checking...';
    }
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Booking Availability Status
      </h4>
      
      {isLoadingAvailability ? (
        <div className="flex items-center text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm">Checking availability...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedCalendarDates.map((selectedDate, index) => {
            const status = checkDateAvailability(selectedDate);
            const statusColor = getStatusColor(status);
            const statusIcon = getStatusIcon(status);
            const statusText = getStatusText(status);
            
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-lg border ${statusColor}`}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {statusIcon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {selectedDate.formattedDate}
                    </div>
                    <div className="text-xs opacity-75">
                      {selectedDate.startTime} - {selectedDate.endTime}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {statusText}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!isLoadingAvailability && selectedCalendarDates.some(date => checkDateAvailability(date) === 'unavailable') && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-600 mr-2 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.75 0a9 9 0 0118 0zm-9.75 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Some time slots are unavailable</p>
              <p className="text-xs text-red-700 mt-1">
                Please select different time slots or dates to proceed with your booking.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
