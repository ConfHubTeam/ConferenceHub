import React from "react";
import Calendar from "./Calendar";
import { format, parseISO, differenceInDays } from "date-fns";
import { getMinimumBookingDate, getCurrentDateInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * DateAvailability Component
 * 
 * This component handles date selection and displays the main calendar
 * with blocked dates and selected date range.
 * Updated to use Uzbekistan timezone for consistent date validation.
 */
const DateAvailability = ({ 
  startDate, 
  setStartDate,
  endDate, 
  setEndDate,
  blockedDates,
  blockedWeekdays
}) => {
  return (
    <div id="date-availability" className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
        📅 Available dates
        <span className="text-red-500 ml-1">*</span>
      </h3>
      <Calendar 
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        blockedDates={blockedDates}
        blockedWeekdays={blockedWeekdays}
        minDate={getMinimumBookingDate(startDate)} // Use Uzbekistan timezone for minimum date
        // For place editing/creation, don't use strict timezone validation
        // This allows hosts to set availability starting from today
        // No onBlockedDateClick prop here - this is the main calendar for selecting available dates
      />
      {/* Display formatted date range with improved styling */}
      {startDate && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
          <p className="font-semibold text-blue-900 mb-2 text-sm uppercase tracking-wide">Selected Period</p>
          <p className="text-blue-800 font-bold text-lg">
            {format(parseISO(startDate), "MMM d, yyyy")}
            {endDate && (
              <>
                <span className="mx-3 text-blue-600">→</span>
                {format(parseISO(endDate), "MMM d, yyyy")}
              </>
            )}
          </p>
          {endDate && (
            <p className="text-blue-600 text-sm mt-1 font-medium">
              {differenceInDays(parseISO(endDate), parseISO(startDate)) + 1} days selected
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DateAvailability;
