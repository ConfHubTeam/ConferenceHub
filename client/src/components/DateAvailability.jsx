import React from "react";
import Calendar from "./Calendar";
import { format, parseISO } from "date-fns";

/**
 * DateAvailability Component
 * 
 * This component handles date selection and displays the main calendar
 * with blocked dates and selected date range.
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
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">📅 Available dates</h3>
      <Calendar 
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        blockedDates={blockedDates}
        blockedWeekdays={blockedWeekdays}
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
              {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} days selected
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DateAvailability;
