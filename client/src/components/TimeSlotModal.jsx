import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { formatHourTo12, generateTimeOptions, generateStartTimeOptions, isTimeBlocked, isTimeRangeAvailable } from "../utils/TimeUtils";

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
    const minimumHours = placeDetail.minimumHours || 1;
    const cooldownMinutes = placeDetail.cooldown || 0;
    
    // Generate all time options (for visual display and end time selection)
    const allOptions = generateTimeOptions(timeSlots.start, timeSlots.end, minimumHours, cooldownMinutes);
    
    // Add blocked status to each time option
    return allOptions.map(option => {
      const isHourBlocked = isTimeBlocked(
        currentEditingDate, 
        option.value, 
        bookedTimeSlots, 
        minimumHours, 
        timeSlots.end,
        cooldownMinutes
      );
      
      if (isHourBlocked) {
        return {
          ...option,
          isBlocked: true
        };
      }
      
      // Additional check: if there are any conflicts in the minimum required range
      const startHour = parseInt(option.value.split(':')[0], 10);
      const minimumEndHour = startHour + minimumHours;
      const minimumEndTime = minimumEndHour.toString().padStart(2, '0') + ':00';
      
      const isRangeAvailable = isTimeRangeAvailable(
        currentEditingDate, 
        option.value, 
        minimumEndTime, 
        bookedTimeSlots,
        cooldownMinutes
      );
      
      return {
        ...option,
        isBlocked: !isRangeAvailable
      };
    });
  }, [timeSlots, currentEditingDate, bookedTimeSlots, placeDetail.minimumHours, placeDetail.cooldown]);

  // Generate start time options (limited by cooldown and minimum duration)
  const startTimeOptions = useMemo(() => {
    const minimumHours = placeDetail.minimumHours || 1;
    const cooldownMinutes = placeDetail.cooldown || 0;
    
    const startOptions = generateStartTimeOptions(timeSlots.start, timeSlots.end, minimumHours, cooldownMinutes);
    
    return startOptions.map(option => {
      const isHourBlocked = isTimeBlocked(
        currentEditingDate, 
        option.value, 
        bookedTimeSlots, 
        minimumHours, 
        timeSlots.end,
        cooldownMinutes
      );
      
      return {
        ...option,
        isBlocked: isHourBlocked
      };
    });
  }, [timeSlots, currentEditingDate, bookedTimeSlots, placeDetail.minimumHours, placeDetail.cooldown]);

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
      
      // Check if the current start-end range would span any blocked time
      const isCurrentRangeAvailable = isTimeRangeAvailable(
        currentEditingDate,
        value, // new start time
        selectedEndTime,
        bookedTimeSlots,
        cooldownMinutes
      );
      
      // Clear end time if the range would span blocked time
      if (!isCurrentRangeAvailable) {
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

        {/* Cooldown information */}
        {placeDetail.cooldown && placeDetail.cooldown > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">
                <strong>Cooldown period:</strong> {placeDetail.cooldown >= 60 ? `${Math.floor(placeDetail.cooldown / 60)}h ${placeDetail.cooldown % 60 > 0 ? `${placeDetail.cooldown % 60}min` : ''}`.trim() : `${placeDetail.cooldown} min`} after each booking
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
                {startTimeOptions.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.isBlocked}
                    className={option.isBlocked ? "bg-red-100 text-red-800 line-through" : ""}
                  >
                    {option.label}{option.isBlocked ? " (Unavailable)" : ""}
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
                    const cooldownMinutes = placeDetail.cooldown || 0;
                    
                    // Calculate the minimum end time based on start time + minimum hours
                    const startHour = parseInt(selectedStartTime.split(':')[0], 10);
                    const minimumEndHour = startHour + minimumHours;
                    const endHour = parseInt(option.value.split(':')[0], 10);
                    
                    // Calculate if this end time would require cooldown beyond operating hours
                    const cooldownHours = cooldownMinutes / 60;
                    const endTimeWithCooldown = endHour + cooldownHours;
                    const operatingEndHour = parseInt(timeSlots.end.split(':')[0], 10);
                    
                    // End time must be greater than start time and meet minimum hours requirement
                    // We explicitly check that end hour is greater, not equal to the start hour
                    // Also check that end time + cooldown doesn't exceed operating hours
                    return endHour > startHour && 
                           endHour >= minimumEndHour && 
                           endTimeWithCooldown <= operatingEndHour;
                  })
                  .map((option) => {
                    // Check if the range from start time to this end time is available
                    // This prevents selecting end times that would create a range spanning blocked periods
                    const isRangeAvailable = isTimeRangeAvailable(
                      currentEditingDate, 
                      selectedStartTime, 
                      option.value, 
                      bookedTimeSlots,
                      placeDetail.cooldown || 0
                    );
                    
                    const isDisabled = !isRangeAvailable;
                    
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
                        {isDisabled ? " (Unavailable)" : ""}
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
                
                // Check if this hour is in a cooldown period (for visual indication)
                const isInCooldownPeriod = bookedTimeSlots.some(slot => {
                  if (slot.date !== currentEditingDate) return false;
                  const bookedEndHour = parseInt(slot.endTime.split(':')[0], 10);
                  const cooldownMinutes = placeDetail.cooldown || 0;
                  const cooldownHours = cooldownMinutes / 60;
                  const cooldownEndHour = bookedEndHour + cooldownHours;
                  return optionHour >= bookedEndHour && optionHour < cooldownEndHour;
                });
                
                return (
                  <div 
                    key={option.value} 
                    className={`
                      flex-shrink-0 text-xs text-center p-2 rounded-md mr-1 w-16
                      ${option.isBlocked 
                        ? isInCooldownPeriod
                          ? 'bg-orange-100 text-orange-800' // Cooldown period
                          : 'bg-red-100 text-red-800' // Booked
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
                <div className="h-3 w-3 bg-orange-100 rounded mr-1"></div>
                <span>Cooldown</span>
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
