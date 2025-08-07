import { useTranslation } from "react-i18next";
import Calendar from "./Calendar";
import { getMinimumBookingDate } from "../utils/uzbekistanTimezoneUtils";

/**
 * SpecificDateBlocker Component
 * 
 * This component handles blocking specific dates in the calendar.
 * It includes the toggle, calendar for date selection, and date management.
 * Updated to use Uzbekistan timezone for consistent date validation.
 */
function SpecificDateBlocker({
  blockedDates,
  setBlockedDates,
  showBlockSpecificDates,
  setShowBlockSpecificDates,
  toggleBlockedDate
}) {
  const { t } = useTranslation("places");

  return (
    <>
      {/* Blocked dates counter */}
      {blockedDates.length > 0 && (
        <div className="mb-2 flex justify-between items-center">
          <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">{blockedDates.length}</span>
            <span className="ml-1">{blockedDates.length === 1 ? t('places:placeCreate.scheduleAvailability.dateSelected') : t('places:placeCreate.scheduleAvailability.datesSelected', { count: blockedDates.length })}</span>
            <button 
              type="button"
              onClick={() => setBlockedDates([])}
              className="ml-3 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {t('places:placeCreate.scheduleAvailability.clearAll')}
            </button>
          </div>
        </div>
      )}
      
      {/* Block specific dates toggle */}
      <div className="flex items-center mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className={`relative inline-block w-10 h-6 rounded-full transition ${showBlockSpecificDates ? 'bg-info-600' : 'bg-gray-300'}`}>
            <input
              type="checkbox"
              className="absolute opacity-0 w-0 h-0"
              checked={showBlockSpecificDates}
              onChange={() => {
                // Toggle visibility without clearing blocked dates
                setShowBlockSpecificDates(!showBlockSpecificDates);
              }}
            />
            <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showBlockSpecificDates ? 'transform translate-x-4' : ''}`}></span>
          </div>
          <span>{t("places:placeCreate.scheduleAvailability.blockSpecificDates")}</span>
        </label>
      </div>
      
      {/* Specific date picker calendar (only shown when toggle is enabled) */}
      {showBlockSpecificDates && (
        <div className="mb-2 border p-2 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">{t("places:placeCreate.scheduleAvailability.selectDatesToBlock")}:</h4>
            {blockedDates.length > 0 && (
              <button
                type="button"
                onClick={() => setBlockedDates([])}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t("places:placeCreate.scheduleAvailability.clearAllBlockedDates")}
              </button>
            )}
          </div>
          <Calendar 
            blockedDates={blockedDates}
            minDate={getMinimumBookingDate()} // Use Uzbekistan timezone for minimum date
            // For date blocking, don't use strict timezone validation
            // This allows hosts to block dates starting from today
            onBlockedDateClick={toggleBlockedDate} // Use the specific handler for date blocking
          />
          {blockedDates.length > 0 && (
            <div className="mt-2 text-sm">
              <span className="font-medium">{blockedDates.length}</span> {blockedDates.length === 1 ? t('places:placeCreate.scheduleAvailability.dateCurrentlyBlocked') : t('places:placeCreate.scheduleAvailability.datesCurrentlyBlocked', { count: blockedDates.length })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default SpecificDateBlocker;
