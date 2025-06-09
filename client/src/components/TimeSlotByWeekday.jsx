import React from "react";

/**
 * TimeSlotByWeekday Component
 * 
 * This component handles the display and management of time slots for each weekday.
 * It shows a grid of weekdays with time selection options for each day that isn't blocked.
 */
const TimeSlotByWeekday = ({
  blockedWeekdays,
  weekdayTimeSlots,
  setWeekdayTimeSlots
}) => {
  // Array of weekday names
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div className="mt-5">
      <h4 className="text-base font-medium mb-4 text-gray-800 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Time slots by weekday
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
        {weekdays.map((day, index) => (
          <div 
            key={day} 
            className={`p-2.5 rounded-xl border-2 min-h-[140px] flex flex-col ${
              blockedWeekdays.includes(index) 
                ? 'bg-gray-50 border-gray-200 shadow-sm opacity-90' 
                : 'bg-white border-blue-100 hover:border-blue-300 transition-colors shadow-sm hover:shadow'
            }`}
          >
            {/* Day label with better styling */}
            <div className="flex flex-wrap items-center justify-between mb-2">
              <div className="flex flex-wrap items-center w-full">
                <span className={`font-medium text-sm ${blockedWeekdays.includes(index) ? 'text-gray-500' : 'text-blue-800'}`}>
                  <span className="sm:hidden">{day.substring(0, 3)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </span>
              </div>
            </div>
            
            {/* Time selection - with improved spacing and styling */}
            {!blockedWeekdays.includes(index) && (
              <div className="space-y-2.5 flex-grow">
                {/* Time selection */}
                <div className="flex flex-col gap-2">
                  {/* From selector */}
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-0.5 text-blue-500 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      From
                    </label>
                    <select
                      value={weekdayTimeSlots[index].start}
                      onChange={(e) => {
                        setWeekdayTimeSlots(prev => ({
                          ...prev, 
                          [index]: {...prev[index], start: e.target.value}
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                      disabled={blockedWeekdays.includes(index)}
                    >
                      <option value="">Select</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                        const amPm = i < 12 ? 'AM' : 'PM';
                        return (
                          <option key={hour} value={hour}>
                            {displayHour}:00 {amPm}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  {/* To selector */}
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-0.5 text-blue-500 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      To
                    </label>
                    <select
                      value={weekdayTimeSlots[index].end}
                      onChange={(e) => {
                        setWeekdayTimeSlots(prev => ({
                          ...prev, 
                          [index]: {...prev[index], end: e.target.value}
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                      disabled={blockedWeekdays.includes(index)}
                    >
                      <option value="">Select</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                        const amPm = i < 12 ? 'AM' : 'PM';
                        return (
                          <option key={hour} value={hour}>
                            {displayHour}:00 {amPm}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Showing empty state for blocked days */}
            {blockedWeekdays.includes(index) && (
              <div className="flex flex-col items-center justify-center flex-grow opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 mb-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="text-xs font-medium text-gray-400">Not available</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-600 mt-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        Set time slots for when your space is available for booking each day of the week
      </div>
    </div>
  );
};

export default TimeSlotByWeekday;
