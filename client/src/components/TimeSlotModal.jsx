import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { formatHourTo12, generateTimeOptions, isTimeBlocked } from "../utils/TimeUtils";

/**
 * TimeSlotModal Component
 * 
 * Modal for selecting time slots for booking a place
 * Handles display and selection of available time slots with blocked time validation
 */
export default function TimeSlotModal({
  isOpen,
  onClose,
  onConfirm,
  currentEditingDate,
  selectedStartTime,
  selectedEndTime,
  onStartTimeChange,
  onEndTimeChange,
  timeSlots,
  placeDetail,
  isEditMode,
  bookedTimeSlots = [] // Array of existing bookings
}) {
  if (!isOpen || !currentEditingDate) return null;

  // Generate time options and mark blocked times
  const timeOptions = useMemo(() => {
    const options = generateTimeOptions(timeSlots.start, timeSlots.end);
    
    // Add blocked status to each time option
    return options.map(option => ({
      ...option,
      isBlocked: isTimeBlocked(currentEditingDate, option.value, bookedTimeSlots)
    }));
  }, [timeSlots, currentEditingDate, bookedTimeSlots]);

  // Handle start time change with validation
  const handleStartTimeChange = (value) => {
    onStartTimeChange(value);
    
    // If the selected end time is now invalid due to the new start time, clear it
    if (selectedEndTime) {
      const startHour = parseInt(value.split(':')[0], 10);
      const endHour = parseInt(selectedEndTime.split(':')[0], 10);
      const minimumHours = placeDetail.minimumHours || 1;
      
      // Clear end time if it's less than start time + minimum hours
      if (endHour < startHour + minimumHours) {
        onEndTimeChange('');
      }
      
      // Check if there are any blocked hours between start and end time
      const hasBlockedHoursInRange = Array.from(
        { length: endHour - startHour },
        (_, i) => startHour + i + 1
      ).some(hour => {
        const hourStr = hour.toString().padStart(2, '0') + ':00';
        return isTimeBlocked(currentEditingDate, hourStr, bookedTimeSlots);
      });
      
      // Clear end time if there are blocked hours in the range
      if (hasBlockedHoursInRange) {
        onEndTimeChange('');
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Set Time Slot
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-900 font-medium text-sm">
            {format(parseISO(currentEditingDate), "EEEE, MMM d, yyyy")}
          </p>
        </div>

        {/* Minimum hours requirement info */}
        {placeDetail.minimumHours && placeDetail.minimumHours > 1 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">
                <strong>Minimum booking:</strong> {placeDetail.minimumHours} hour{placeDetail.minimumHours > 1 ? 's' : ''} required
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <select
                value={selectedStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select start time</option>
                {timeOptions.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.isBlocked}
                    className={option.isBlocked ? "bg-red-100 text-red-800 line-through" : ""}
                  >
                    {option.label}{option.isBlocked ? " (Booked)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <select
                value={selectedEndTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedStartTime}
              >
                <option value="">Select end time</option>
                {timeOptions
                  .filter(option => {
                    if (!selectedStartTime) return false;
                    
                    // Get minimum hours requirement
                    const minimumHours = placeDetail.minimumHours || 1;
                    
                    // Calculate the minimum end time based on start time + minimum hours
                    const startHour = parseInt(selectedStartTime.split(':')[0], 10);
                    const minimumEndHour = startHour + minimumHours;
                    const endHour = parseInt(option.value.split(':')[0], 10);
                    
                    // End time must be greater than start time and meet minimum hours requirement
                    // We explicitly check that end hour is greater, not equal to the start hour
                    return endHour > startHour && endHour >= minimumEndHour;
                  })
                  .map((option) => {
                    // Check if any hour between start time and this option is blocked
                    const startHour = parseInt(selectedStartTime.split(':')[0], 10);
                    const endHour = parseInt(option.value.split(':')[0], 10);
                    
                    // Check if any hour in the range is blocked
                    const hasBlockedHoursInRange = Array.from(
                      { length: endHour - startHour },
                      (_, i) => startHour + i + 1
                    ).some(hour => {
                      const hourStr = hour.toString().padStart(2, '0') + ':00';
                      return isTimeBlocked(currentEditingDate, hourStr, bookedTimeSlots);
                    });
                    
                    // Also check if the end time itself is blocked
                    const isEndTimeBlocked = option.isBlocked;
                    const isDisabled = hasBlockedHoursInRange || isEndTimeBlocked;
                    
                    return (
                      <option 
                        key={option.value} 
                        value={option.value}
                        disabled={isDisabled}
                        className={
                          isDisabled
                            ? "bg-red-100 text-red-800 line-through" 
                            : ""
                        }
                      >
                        {option.label}
                        {hasBlockedHoursInRange ? " (Conflict with booking)" : ""}
                        {isEndTimeBlocked ? " (Booked)" : ""}
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>

          
          {/* Visual time slot availability indicator */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Today's Availability</h4>
            <div className="flex overflow-x-auto pb-2">
              {timeOptions.map(option => {
                const hourParts = option.label.split(':');
                const displayHour = hourParts[0];
                const amPm = option.label.includes('AM') ? 'AM' : 'PM';
                const optionHour = parseInt(option.value.split(':')[0], 10);
                
                // Check if this time slot is within the selected range
                let isInSelectedRange = false;
                if (selectedStartTime && selectedEndTime) {
                  const startHour = parseInt(selectedStartTime.split(':')[0], 10);
                  const endHour = parseInt(selectedEndTime.split(':')[0], 10);
                  isInSelectedRange = optionHour > startHour && optionHour < endHour;
                }
                
                return (
                  <div 
                    key={option.value} 
                    className={`
                      flex-shrink-0 text-xs text-center p-2 rounded-md mr-1 w-16
                      ${option.isBlocked 
                        ? 'bg-red-100 text-red-800'
                        : selectedStartTime === option.value
                          ? 'bg-blue-500 text-white' // Start time
                          : selectedEndTime === option.value
                            ? 'bg-blue-700 text-white' // End time
                            : isInSelectedRange
                              ? 'bg-blue-200 text-blue-800 border border-blue-300' // In range
                              : 'bg-green-100 text-green-800' // Available
                      }
                    `}
                  >
                    <div>{displayHour}</div>
                    <div>{amPm}</div>
                    {option.isBlocked && (
                      <div className="mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {selectedEndTime === option.value && (
                      <div className="mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-auto text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center mt-3 text-xs text-gray-600 gap-4">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-red-100 rounded mr-1"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-100 rounded mr-1"></div>
                <span>Available</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedStartTime || !selectedEndTime}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isEditMode ? 'Update' : 'Add'} Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
