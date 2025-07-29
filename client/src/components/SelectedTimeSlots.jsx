import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import PriceDisplay from "./PriceDisplay";

export default function SelectedTimeSlots({ 
  selectedCalendarDates = [], 
  totalHours, 
  placeDetail,
  isAuthorized = true
}) {
  const { t, i18n } = useTranslation('booking');
  
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
  
  // Helper function to format hour to 12-hour format
  const formatHourTo12 = (hour24) => {
    if (!hour24) return "";
    const [hours] = hour24.split(':');
    const hourNum = parseInt(hours, 10);
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const amPm = hourNum < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${amPm}`;
  };

  if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
    return (
      <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-amber-600 mt-0.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-amber-800">
              {isAuthorized ? t("widget.timeSlots.selectForBooking") : t("widget.timeSlots.selectTimeSlots")}
            </p>
            <p className="text-amber-700 mt-1">
              {isAuthorized 
                ? t("widget.timeSlots.useCalendar")
                : t("widget.timeSlots.useCalendarGuest")
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-medium text-blue-900 flex items-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        {t("widget.timeSlots.selectedTimeSlots")}
      </h4>
      <div className="space-y-1 text-sm text-blue-800">
        {selectedCalendarDates.map((dateSlot, index) => (
          <div key={index} className="flex justify-between">
            <span>{formatDateForDisplay(dateSlot.date)}</span>
            <span>{formatHourTo12(dateSlot.startTime)} - {formatHourTo12(dateSlot.endTime)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-blue-200">
        <div className="flex justify-between font-medium text-blue-900">
          <span>{t("widget.timeSlots.totalHours")}:</span>
          <span>{totalHours}h</span>
        </div>
      </div>
    </div>
  );
}
