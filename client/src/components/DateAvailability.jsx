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
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="text-base font-medium mb-2">Available dates</h3>
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
      {/* Display formatted date range */}
      {startDate && (
        <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="font-semibold text-blue-900 mb-1">Selected Period:</p>
          <p className="text-blue-800 font-medium">
            {format(parseISO(startDate), "MMM d, yyyy")}
            {endDate && ` → ${format(parseISO(endDate), "MMM d, yyyy")}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default DateAvailability;
