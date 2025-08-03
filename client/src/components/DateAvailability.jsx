import React from "react";
import { useTranslation } from "react-i18next";
import Calendar from "./Calendar";
import { format, parseISO, differenceInDays } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
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
  const { t, i18n } = useTranslation('places');
  
  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };
  
  // Helper function to format date dynamically based on current language
  const formatDateForDisplay = (dateString) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy", { locale: getDateLocale() });
    } catch (error) {
      console.warn("Error formatting date:", error);
      return dateString;
    }
  };
  
  return (
    <div id="date-availability" className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          📅 {t('placeCreate.dateAvailability.title')}
          <span className="text-red-500 ml-1">*</span>
        </h3>
        {/* Clear Button near calendar */}
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            title={t('placeCreate.dateAvailability.clearSelectedPeriod')}
          >
            {t('placeCreate.dateAvailability.clearSelectedPeriod')}
          </button>
        )}
      </div>
      <Calendar 
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        blockedDates={blockedDates}
        blockedWeekdays={blockedWeekdays}
        minDate={getMinimumBookingDate()} // Fix: Don't pass startDate - use today as minimum
        // For place editing/creation, don't use strict timezone validation
        // This allows hosts to set availability starting from today
        // No onBlockedDateClick prop here - this is the main calendar for selecting available dates
      />
      {/* Display formatted date range with improved styling */}
      {startDate && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2 text-sm uppercase tracking-wide">
                {t('placeCreate.dateAvailability.selectedPeriod')}
              </p>
              <p className="text-blue-800 font-bold text-lg">
                {formatDateForDisplay(startDate)}
                {endDate && (
                  <>
                    <span className="mx-3 text-blue-600">→</span>
                    {formatDateForDisplay(endDate)}
                  </>
                )}
              </p>
              {endDate && (
                <p className="text-blue-600 text-sm mt-1 font-medium">
                  {t('placeCreate.dateAvailability.daysSelected', { 
                    count: differenceInDays(parseISO(endDate), parseISO(startDate)) + 1 
                  })}
                </p>
              )}
            </div>
            {/* Clear Button */}
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
              title={t('placeCreate.dateAvailability.clearSelectedPeriod')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateAvailability;
