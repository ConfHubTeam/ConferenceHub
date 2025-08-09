import { useMemo, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { generateTimeOptions, generateStartTimeOptions, isTimeBlocked, isTimeRangeAvailableEnhanced, isValidStartTimeEnhanced } from "../utils/TimeUtils";
import { generateTimezoneAwareTimeOptions, isTimeInPastUzbekistan, getFirstAvailableHour } from "../utils/uzbekistanTimezoneUtils";

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
  bookedTimeSlots = [], // Array of existing bookings
  timezoneAvailableTimeSlots = [] // New prop for timezone-aware available time slots
}) {
  const { t, i18n } = useTranslation('booking');
  
  // Ref for the time slots scroll container
  const timeSlotScrollRef = useRef(null);
  
  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };
  
  // Generate time options and mark blocked times
  const timeOptions = useMemo(() => {
    const minimumHours = placeDetail.minimumHours || 1;
    const cooldownMinutes = placeDetail.cooldown || 0;
    
    // Use timezone-aware available time slots if provided, otherwise fall back to regular generation
    let availableOptions = [];
    if (timezoneAvailableTimeSlots && timezoneAvailableTimeSlots.length > 0) {
      // Use the working hours for the date to show all time slots
      const workingHours = timeSlots; // This should contain start/end times
      availableOptions = generateTimezoneAwareTimeOptions(
        timezoneAvailableTimeSlots,
        workingHours,
        minimumHours,
        cooldownMinutes,
        currentEditingDate // Pass the current editing date for timezone checking
      );
    } else {
      // Fallback to regular time generation
      availableOptions = generateTimeOptions(timeSlots.start, timeSlots.end, minimumHours, cooldownMinutes, i18n.language)
        .map(option => {
          // Check if this time is in the past for the editing date
          // Add validation to prevent invalid time value errors
          let isPastTime = false;
          if (currentEditingDate && option && option.value) {
            try {
              isPastTime = isTimeInPastUzbekistan(currentEditingDate, option.value);
            } catch (error) {
              console.warn('Error checking past time:', { currentEditingDate, optionValue: option.value, error });
              isPastTime = false; // Default to not past if there's an error
            }
          }
          
          return {
            ...option, 
            isAvailable: !isPastTime, 
            isDisabled: isPastTime,
            disabledReason: isPastTime ? 'Past time (Uzbekistan timezone)' : null
          };
        });
    }
    
    // Add booking conflict status to each time option
    return availableOptions.map(option => {
      // If already disabled due to timezone, keep it disabled
      if (option.isDisabled) {
        return {
          ...option,
          isBlocked: true,
          disabledReason: 'Past time (Uzbekistan timezone)'
        };
      }
      
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
          isBlocked: true,
          disabledReason: 'Already booked or in cooldown period'
        };
      }
      
      // Additional check: if there are any conflicts in the minimum required range
      const startHour = parseInt(option.value.split(':')[0], 10);
      const minimumEndHour = startHour + minimumHours;
      const minimumEndTime = minimumEndHour.toString().padStart(2, '0') + ':00';
      
      const isRangeAvailable = isTimeRangeAvailableEnhanced(
        currentEditingDate, 
        option.value, 
        minimumEndTime, 
        bookedTimeSlots,
        cooldownMinutes
      );
      
      return {
        ...option,
        isBlocked: !isRangeAvailable,
        disabledReason: !isRangeAvailable ? 'Conflicts with existing booking' : null
      };
    });
  }, [timeSlots, currentEditingDate, bookedTimeSlots, placeDetail.minimumHours, placeDetail.cooldown, timezoneAvailableTimeSlots]);

  // Auto-scroll to selected time range when time slots change
  useEffect(() => {
    if (!timeSlotScrollRef.current || !selectedStartTime || !selectedEndTime) return;
    
    const scrollContainer = timeSlotScrollRef.current;
    const timeSlotElements = scrollContainer.querySelectorAll('[data-time-value]');
    
    // Find the start time element
    const startTimeElement = Array.from(timeSlotElements).find(
      el => el.getAttribute('data-time-value') === selectedStartTime
    );
    
    if (startTimeElement) {
      const containerWidth = scrollContainer.clientWidth;
      const elementLeft = startTimeElement.offsetLeft;
      const elementWidth = startTimeElement.offsetWidth;
      
      // Calculate scroll position to center the selected range
      const scrollLeft = Math.max(0, elementLeft - (containerWidth / 2) + (elementWidth / 2));
      
      // Smooth scroll to the calculated position
      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [selectedStartTime, selectedEndTime, timeOptions]);

  // Generate start time options (limited by cooldown and minimum duration)
  const startTimeOptions = useMemo(() => {
    const minimumHours = placeDetail.minimumHours || 1;
    const cooldownMinutes = placeDetail.cooldown || 0;
    
    // Use timezone-aware available time slots if provided
    if (timezoneAvailableTimeSlots && timezoneAvailableTimeSlots.length > 0) {
      const workingHours = timeSlots;
      return generateTimezoneAwareTimeOptions(
        timezoneAvailableTimeSlots,
        workingHours,
        minimumHours,
        cooldownMinutes,
        currentEditingDate // Pass the current editing date for timezone checking
      ).map(option => {
        // If disabled due to timezone, mark as blocked
        if (option.isDisabled) {
          return {
            ...option,
            isBlocked: true,
            disabledReason: option.disabledReason || 'Past time (Uzbekistan timezone)'
          };
        }
        
        // Check for booking conflicts and timing constraints
        const isValidStart = isValidStartTimeEnhanced(
          currentEditingDate, 
          option.value, 
          bookedTimeSlots, 
          minimumHours, 
          timeSlots.end,
          cooldownMinutes
        );
        
        return {
          ...option,
          isBlocked: !isValidStart,
          disabledReason: !isValidStart ? 'Cannot start booking at this time' : null
        };
      });
    }
    
    // Fallback to regular generation
    const startOptions = generateStartTimeOptions(timeSlots.start, timeSlots.end, minimumHours, cooldownMinutes, i18n.language);
    
    return startOptions.map(option => {
      // Check if this time is in the past for the editing date
      // Add validation to prevent invalid time value errors
      let isPastTime = false;
      if (currentEditingDate && option && option.value) {
        try {
          isPastTime = isTimeInPastUzbekistan(currentEditingDate, option.value);
        } catch (error) {
          console.warn('Error checking past time for start options:', { currentEditingDate, optionValue: option.value, error });
          isPastTime = false; // Default to not past if there's an error
        }
      }
      
      if (isPastTime) {
        return {
          ...option,
          isBlocked: true,
          disabledReason: 'Past time (Uzbekistan timezone)'
        };
      }
      
      // Use isValidStartTimeEnhanced to check if this can be a start time (includes end-of-day restrictions)
      const isValidStart = isValidStartTimeEnhanced(
        currentEditingDate, 
        option.value, 
        bookedTimeSlots, 
        minimumHours, 
        timeSlots.end,
        cooldownMinutes
      );
      
      return {
        ...option,
        isBlocked: !isValidStart,
        disabledReason: !isValidStart ? 'Cannot start booking at this time' : null
      };
    });
  }, [timeSlots, currentEditingDate, bookedTimeSlots, placeDetail.minimumHours, placeDetail.cooldown, timezoneAvailableTimeSlots]);

  // Set default start time to first available hour when modal opens or date changes
  useEffect(() => {
    if (isOpen && currentEditingDate && !selectedStartTime) {
      // Get the first available hour for this date
      const firstAvailableHour = getFirstAvailableHour(currentEditingDate, timeSlots);
      
      // Check if this hour is actually available (not blocked by bookings)
      const isFirstHourAvailable = startTimeOptions.find(option => 
        option.value === firstAvailableHour && !option.isBlocked
      );
      
      if (isFirstHourAvailable) {
        onStartTimeChange(firstAvailableHour);
      } else {
        // Find the first non-blocked option from startTimeOptions
        const firstAvailableOption = startTimeOptions.find(option => !option.isBlocked);
        if (firstAvailableOption) {
          onStartTimeChange(firstAvailableOption.value);
        }
      }
    }
  }, [isOpen, currentEditingDate, selectedStartTime, timeSlots, startTimeOptions, onStartTimeChange]);

  // Handle start time change with validation
  const handleStartTimeChange = (value) => {
    onStartTimeChange(value);
    
    // If the selected end time is now invalid due to the new start time, clear it
    if (selectedEndTime) {
      const startHour = parseInt(value.split(':')[0], 10);
      const endHour = parseInt(selectedEndTime.split(':')[0], 10);
      const minimumHours = placeDetail.minimumHours || 1;
      const cooldownMinutes = placeDetail.cooldown || 0;
      
      // Clear end time if it's less than start time + minimum hours
      if (endHour < startHour + minimumHours) {
        onEndTimeChange('');
      }
      
      // Check if the current start-end range would span any blocked time
      const isCurrentRangeAvailable = isTimeRangeAvailableEnhanced(
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
  
  // Conditional return moved after hooks to follow React rules of hooks
  if (!isOpen || !currentEditingDate) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("timeSlotModal.title")}
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
            {t("timeSlotModal.dateLabel")}: {format(parseISO(currentEditingDate), "EEEE, MMM d, yyyy", { locale: getDateLocale() })}
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
                <strong>{t("timeSlotModal.minimumBooking")}:</strong> {placeDetail.minimumHours} {t("timeSlotModal.hoursRequired")}
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
                <strong>{t("timeSlotModal.cooldownPeriod")}:</strong> {placeDetail.cooldown >= 60 ? `${Math.floor(placeDetail.cooldown / 60)}h ${placeDetail.cooldown % 60 > 0 ? `${placeDetail.cooldown % 60}min` : ''}`.trim() : `${placeDetail.cooldown} min`} {t("timeSlotModal.afterEachBooking")}
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("timeSlotModal.startTime")}
              </label>
              <select
                value={selectedStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t("timeSlotModal.selectStartTime")}</option>
                {startTimeOptions.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.isBlocked}
                    title={option.disabledReason || ''}
                    className={option.isBlocked ? "text-gray-400 bg-gray-100" : ""}
                  >
                    {option.label}
                    {option.isBlocked ? ` (${t("timeSlotModal.unavailable")})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("timeSlotModal.endTime")}
              </label>
              <select
                value={selectedEndTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedStartTime}
              >
                <option value="">{t("timeSlotModal.selectEndTime")}</option>
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
                    const isRangeAvailable = isTimeRangeAvailableEnhanced(
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
                        {isDisabled ? ` (${t("timeSlotModal.unavailable")})` : ""}
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>

          
          {/* Visual time slot availability indicator */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("timeSlotModal.todaysAvailability")}</h4>
            <div ref={timeSlotScrollRef} className="flex overflow-x-auto pb-2">
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
                
                // Check if this hour is actually blocked by real bookings (not end-of-day restrictions)
                const isActuallyBlocked = isTimeBlocked(
                  currentEditingDate, 
                  option.value, 
                  bookedTimeSlots, 
                  placeDetail.minimumHours || 1, 
                  timeSlots.end,
                  placeDetail.cooldown || 0
                );
                
                // Check if this hour is in a cooldown period (for visual indication)
                const isInCooldownPeriod = bookedTimeSlots.some(slot => {
                  if (slot.date !== currentEditingDate) return false;
                  const bookedEndHour = parseInt(slot.endTime.split(':')[0], 10);
                  const cooldownMinutes = placeDetail.cooldown || 0;
                  const cooldownHours = cooldownMinutes / 60;
                  const cooldownEndHour = bookedEndHour + cooldownHours;
                  return optionHour >= bookedEndHour && optionHour < cooldownEndHour;
                });
                
                // Check if this hour is the working hours end time (for visual grayout)
                const workingEndHour = parseInt(timeSlots.end.split(':')[0], 10);
                const isWorkingHoursEndTime = optionHour === workingEndHour;
                
                // Check if this time slot is disabled due to timezone (past time) - but NOT if it's day end
                const isPastTimeInTimezone = !isWorkingHoursEndTime && option.isDisabled && option.disabledReason === 'Past time (Uzbekistan timezone)';
                
                return (
                  <div 
                    key={option.value}
                    data-time-value={option.value}
                    className={`
                      flex-shrink-0 text-xs text-center p-2 rounded-md mr-1 w-16
                      ${isPastTimeInTimezone
                        ? 'bg-gray-300 text-gray-600' // Past time in timezone - same as day end grey
                        : isActuallyBlocked 
                          ? isInCooldownPeriod
                            ? 'bg-orange-100 text-orange-800' // Cooldown period
                            : 'bg-red-100 text-red-800' // Booked
                          : selectedStartTime === option.value
                            ? 'bg-blue-500 text-white' // Start time
                            : selectedEndTime === option.value
                              ? 'bg-blue-700 text-white' // Selected end time
                              : isWorkingHoursEndTime
                                ? 'bg-gray-300 text-gray-600' // Working hours end time (grayed out)
                                : isInSelectedRange
                                  ? 'bg-blue-200 text-blue-800 border border-blue-300' // In range
                                  : 'bg-green-100 text-green-800' // Available
                      }
                    `}
                  >
                    <div>{displayHour}</div>
                    <div>{amPm}</div>
                    {isPastTimeInTimezone && (
                      <div className="mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {isActuallyBlocked && !isPastTimeInTimezone && (
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
                    {isWorkingHoursEndTime && !isActuallyBlocked && selectedEndTime !== option.value && (
                      <div className="mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <span>{t("timeSlotModal.legend.booked")}</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-orange-100 rounded mr-1"></div>
                <span>{t("timeSlotModal.legend.cooldown")}</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-gray-300 rounded mr-1"></div>
                <span>{t("timeSlotModal.legend.unavailable")}</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-100 rounded mr-1"></div>
                <span>{t("timeSlotModal.legend.available")}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t("timeSlotModal.buttons.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedStartTime || !selectedEndTime}
              className="flex-1 py-2 px-4 sm:py-2.5 bg-info-600 text-white rounded-lg hover:bg-info-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isEditMode ? t("timeSlotModal.buttons.update") : t("timeSlotModal.buttons.add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
