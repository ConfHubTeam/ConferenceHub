import React from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { formatHourTo12 } from "../utils/TimeUtils";

/**
 * SelectedDates Component
 * 
 * Displays the list of selected booking dates with actions
 */
export default function SelectedDates({ 
  selectedDates, 
  onClearAll, 
  onDateClick, 
  onRemoveDate,
  onSelectedDatesChange 
}) {
  const { t, i18n } = useTranslation("booking");
  
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
  
  // Helper function to format day of week dynamically based on current language
  const formatDayOfWeek = (dateString) => {
    try {
      return format(parseISO(dateString), "EEEE", { locale: getDateLocale() });
    } catch (error) {
      console.warn("Error formatting day of week:", error);
      return "";
    }
  };

  if (selectedDates.length === 0) return null;
  
  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <h3 className="font-semibold text-green-900 mb-3 flex items-center justify-between">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("selectedDates.titleWithCount", { count: selectedDates.length })}
        </span>
        <button
          onClick={() => {
            onClearAll();
          }}
          className="text-red-600 hover:text-red-800 text-sm font-medium underline"
        >
          {t("selectedDates.clearAll")}
        </button>
      </h3>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {selectedDates.map((dateSlot) => (
          <div key={dateSlot.date} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300">
            <div className="flex-1">
              <div className="font-medium text-green-800">
                {formatDateForDisplay(dateSlot.date)} ({formatDayOfWeek(dateSlot.date)})
              </div>
              <div className="text-sm text-green-600">
                {formatHourTo12(dateSlot.startTime)} - {formatHourTo12(dateSlot.endTime)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onDateClick(dateSlot.date)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                title={t("selectedDates.editTime")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                onClick={() => onRemoveDate(dateSlot.date)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                title={t("selectedDates.removeDate")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
