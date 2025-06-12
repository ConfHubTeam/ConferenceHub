import React from "react";

/**
 * WeeklyAvailabilityDisplay Component
 * 
 * Displays the weekly time slots and blocked weekdays in a read-only format
 * for the place details page.
 */
export default function WeeklyAvailabilityDisplay({ weekdayTimeSlots, blockedWeekdays }) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Helper function to format hour to 12-hour format
  const formatHour = (hour) => {
    if (!hour) return "Not set";
    const hourNum = parseInt(hour, 10);
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const amPm = hourNum < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${amPm}`;
  };

  // Check if there are any available time slots
  const hasTimeSlots = weekdayTimeSlots && Object.values(weekdayTimeSlots).some(slot => slot.start || slot.end);

  if (!hasTimeSlots && (!blockedWeekdays || blockedWeekdays.length === 0)) {
    return null; // Don't show if no availability data
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-green-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        Weekly Availability
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weekdays.map((day, index) => {
          const isBlocked = blockedWeekdays && blockedWeekdays.includes(index);
          const timeSlot = weekdayTimeSlots && weekdayTimeSlots[index];
          const hasTimeSlot = timeSlot && (timeSlot.start || timeSlot.end);
          
          return (
            <div 
              key={day} 
              className={`p-4 rounded-lg border-2 transition-all ${
                isBlocked 
                  ? 'bg-red-50 border-red-200' 
                  : hasTimeSlot 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold text-sm ${
                  isBlocked ? 'text-red-800' : hasTimeSlot ? 'text-green-800' : 'text-gray-600'
                }`}>
                  <span className="sm:hidden">{day.substring(0, 3)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </h3>
                {isBlocked && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                {hasTimeSlot && !isBlocked && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              
              {/* Content */}
              {isBlocked ? (
                <div className="text-center">
                  <p className="text-red-600 text-sm font-medium">Not Available</p>
                </div>
              ) : hasTimeSlot ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">From:</span>
                    <span className="text-sm font-bold text-green-800">
                      {formatHour(timeSlot.start)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">To:</span>
                    <span className="text-sm font-bold text-green-800">
                      {formatHour(timeSlot.end)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500 text-sm">No specific hours set</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
            <span className="text-gray-600">Available with hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
            <span className="text-gray-600">Not available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
