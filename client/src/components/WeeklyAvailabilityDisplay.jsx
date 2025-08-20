import React from "react";
import { useTranslation } from "react-i18next";

/**
 * WeeklyAvailabilityDisplay Component
 * 
 * Displays the weekly time slots and blocked weekdays in a compact, read-only format
 * for the place details page with clear and simple layout.
 * 
 * Single Responsibility: Only handles weekly availability display
 * Open/Closed: Extensible for new UI features without modification
 * DRY: Reuses translation keys and follows project patterns
 */
export default function WeeklyAvailabilityDisplay({ weekdayTimeSlots, blockedWeekdays }) {
  const { t, i18n } = useTranslation();
  
  // Define weekdays order (Sunday = 0, Monday = 1, etc.)
  const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Helper function to format hour based on language preference
  const formatHour = (hour) => {
    if (!hour) return t("places:listing.weeklyAvailability.noSpecificHours");
    
    const hourNum = parseInt(hour, 10);
    const currentLanguage = i18n.language;
    
    // Use 24-hour format for Russian and Uzbek, 12-hour format for English
    if (currentLanguage === 'ru' || currentLanguage === 'uz') {
      // 24-hour format: 18:00
      return `${hourNum.toString().padStart(2, '0')}:00`;
    } else {
      // 12-hour format with AM/PM for English
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      const amPm = hourNum < 12 ? 'AM' : 'PM';
      return `${displayHour}:00 ${amPm}`;
    }
  };

  // Check if there are any available time slots
  const hasTimeSlots = weekdayTimeSlots && Object.values(weekdayTimeSlots).some(slot => slot.start || slot.end);

  if (!hasTimeSlots && (!blockedWeekdays || blockedWeekdays.length === 0)) {
    return null; // Don't show if no availability data
  }

  // Filter days to only show those with actual time slots or blocked days
  const availableDays = weekdayKeys.filter((dayKey, index) => {
    const isBlocked = blockedWeekdays && blockedWeekdays.includes(index);
    const timeSlot = weekdayTimeSlots && weekdayTimeSlots[index];
    const hasTimeSlot = timeSlot && (timeSlot.start || timeSlot.end);
    return isBlocked || hasTimeSlot;
  });

  if (availableDays.length === 0) {
    return null; // Don't show if no days have time slots
  }

  return (
    <div className="card-base">
      <div className="card-content">
        {/* Simple Header */}
        <h2 className="text-heading-2 text-text-primary flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-accent-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("places:listing.weeklyAvailability.title")}
        </h2>
      
        {/* Two-Row Layout: Days then Hours */}
        <div className="space-y-2">
          {/* First Row: Day Names */}
          <div className="grid grid-cols-7 gap-1">
            {weekdayKeys.map((dayKey) => {
              const dayName = t(`places:listing.weeklyAvailability.weekdays.${dayKey}`);
              return (
                <div key={`day-${dayKey}`} className="text-center py-2 px-1 bg-bg-secondary rounded-lg">
                  <span className="font-medium text-text-primary text-sm">
                    {dayName.substring(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Second Row: Hours */}
          <div className="grid grid-cols-7 gap-1">
            {weekdayKeys.map((dayKey, index) => {
              const isBlocked = blockedWeekdays && blockedWeekdays.includes(index);
              const timeSlot = weekdayTimeSlots && weekdayTimeSlots[index];
              const hasTimeSlot = timeSlot && (timeSlot.start || timeSlot.end);
              
              return (
                <div key={`time-${dayKey}`} className="text-center py-2 px-1 bg-bg-secondary rounded-lg min-h-[3rem] flex items-center justify-center">
                  {isBlocked ? (
                    <span className="text-red-600 text-sm font-medium">—</span>
                  ) : hasTimeSlot ? (
                    <div className="text-text-primary text-sm font-medium leading-tight">
                      <div>{formatHour(timeSlot.start)}</div>
                      <div>-</div>
                      <div>{formatHour(timeSlot.end)}</div>
                    </div>
                  ) : (
                    <span className="text-text-muted text-sm">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}