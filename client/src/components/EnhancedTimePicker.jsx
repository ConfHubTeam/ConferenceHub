import React, { useState, useEffect } from "react";
import { 
  formatHourTo12, 
  getValidStartTimeOptions, 
  getValidEndTimeOptions,
  isValidStartTimeEnhanced,
  isTimeRangeAvailableEnhanced
} from "../utils/TimeUtils";

/**
 * Enhanced Time Picker Component with Conflict Resolution
 * Prevents users from selecting conflicting time slots
 */
export default function EnhancedTimePicker({
  date,
  placeDetail,
  bookedTimeSlots = [],
  onTimeChange,
  selectedStartTime = "",
  selectedEndTime = "",
  className = ""
}) {
  const [availableStartTimes, setAvailableStartTimes] = useState([]);
  const [availableEndTimes, setAvailableEndTimes] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (!date || !placeDetail) return;

    const { checkIn, checkOut, weekdayTimeSlots, minimumHours = 1, cooldown = 0 } = placeDetail;
    
    // Get available time range for this day
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = dateObj.getDay();
    
    let startHour = checkIn || "09:00";
    let endHour = checkOut || "17:00";
    
    if (weekdayTimeSlots && weekdayTimeSlots[dayOfWeek]) {
      const timeSlot = weekdayTimeSlots[dayOfWeek];
      if (timeSlot.start && timeSlot.end) {
        startHour = timeSlot.start;
        endHour = timeSlot.end;
      }
    }

    // Get valid start time options using enhanced conflict detection
    const startOptions = getValidStartTimeOptions(
      date,
      startHour,
      endHour,
      bookedTimeSlots,
      minimumHours,
      cooldown
    );
    
    setAvailableStartTimes(startOptions);

    // If start time is selected, get valid end time options
    if (selectedStartTime) {
      const endOptions = getValidEndTimeOptions(
        date,
        selectedStartTime,
        endHour,
        bookedTimeSlots,
        minimumHours,
        cooldown
      );
      setAvailableEndTimes(endOptions);
    } else {
      setAvailableEndTimes([]);
    }

    // Check for conflicts in current selection
    if (selectedStartTime && selectedEndTime) {
      const isAvailable = isTimeRangeAvailableEnhanced(
        date,
        selectedStartTime,
        selectedEndTime,
        bookedTimeSlots,
        cooldown
      );
      
      if (!isAvailable) {
        setConflicts([`Selected time ${formatHourTo12(selectedStartTime)} - ${formatHourTo12(selectedEndTime)} conflicts with existing bookings or cooldown requirements.`]);
      } else {
        setConflicts([]);
      }
    } else {
      setConflicts([]);
    }

  }, [date, placeDetail, bookedTimeSlots, selectedStartTime, selectedEndTime]);

  const handleStartTimeChange = (startTime) => {
    // Clear end time when start time changes
    onTimeChange(startTime, "");
  };

  const handleEndTimeChange = (endTime) => {
    onTimeChange(selectedStartTime, endTime);
  };

  if (!date || !placeDetail) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">Please select a date first</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Start Time Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Time
        </label>
        <select
          value={selectedStartTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={availableStartTimes.length === 0}
        >
          <option value="">
            {availableStartTimes.length === 0 ? "No available start times" : "Select start time"}
          </option>
          {availableStartTimes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {availableStartTimes.length === 0 && (
          <p className="text-red-600 text-xs mt-1">
            No available start times due to existing bookings and cooldown requirements.
          </p>
        )}
      </div>

      {/* End Time Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          End Time
        </label>
        <select
          value={selectedEndTime}
          onChange={(e) => handleEndTimeChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!selectedStartTime || availableEndTimes.length === 0}
        >
          <option value="">
            {!selectedStartTime 
              ? "Select start time first" 
              : availableEndTimes.length === 0 
                ? "No available end times" 
                : "Select end time"
            }
          </option>
          {availableEndTimes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {selectedStartTime && availableEndTimes.length === 0 && (
          <p className="text-red-600 text-xs mt-1">
            No available end times due to conflicts or insufficient time remaining.
          </p>
        )}
      </div>

      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9-.75a9 9 0 1118 0 9 9 0 01-18 0zm9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-red-800 font-medium text-sm">Booking Conflict Detected</p>
              {conflicts.map((conflict, index) => (
                <p key={index} className="text-red-700 text-xs mt-1">{conflict}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {selectedStartTime && selectedEndTime && conflicts.length === 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 text-sm font-medium">
              Time slot available: {formatHourTo12(selectedStartTime)} - {formatHourTo12(selectedEndTime)}
            </p>
          </div>
        </div>
      )}

      {/* Information about cooldown and minimum hours */}
      {placeDetail.cooldown > 0 || placeDetail.minimumHours > 1 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-800 text-xs space-y-1">
            {placeDetail.minimumHours > 1 && (
              <p><strong>Minimum booking:</strong> {placeDetail.minimumHours} hour{placeDetail.minimumHours > 1 ? 's' : ''}</p>
            )}
            {placeDetail.cooldown > 0 && (
              <p>
                <strong>Cooldown period:</strong> {Math.floor(placeDetail.cooldown / 60)} hour{Math.floor(placeDetail.cooldown / 60) !== 1 ? 's' : ''} required after each booking
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
