import React, { useState, useContext, useEffect, useMemo } from "react";
import { format, parseISO, addDays, startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { UserContext } from "./UserContext";
import DateAvailabilityDetails from "./DateAvailabilityDetails";
import CalendarDetailedView from "./CalendarDetailedView";
import UserRoleNotification from "./UserRoleNotification";
import { calculateBookingPercentage, isDateCompletelyUnbookable } from "../utils/TimeUtils";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * CalendarPageCalendar Component
 * 
 * Tailored calendar view for the CalendarPage specifically for hosts/agents
 * Shows single month view with availability overview and detailed date information
 * 
 * Single Responsibility: Calendar display for availability management
 * Open/Closed: Extensible for new calendar management features
 * DRY: Reuses existing availability calculation logic and date utilities
 */
export default function CalendarPageCalendar({ 
  placeDetail,
  onDateSelect = () => {}, // Callback when a date is selected for details
  leftTopSlot = null // Optional: render extra content above the calendar in the left column
}) {
  const { user } = useContext(UserContext);
  const { t, i18n } = useTranslation(["calendar", "booking", "places"]);
  
  // Get locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru':
        return ru;
      case 'uz':
        return uz;
      default:
        return enUS;
    }
  };
  
  // State management
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentDateObjectInUzbekistan());
  const [availabilityData, setAvailabilityData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load availability data when place or month changes
  useEffect(() => {
    if (!placeDetail?.id) return;

    const loadAvailabilityData = async () => {
      setLoading(true);
      setError(null);

      try {
        const startOfCurrentMonth = startOfMonth(currentMonth);
        const endOfCurrentMonth = endOfMonth(currentMonth);
        
        // Fetch availability data for the entire month
        const response = await fetch(
          `/api/bookings/availability?placeId=${placeDetail.id}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch availability data');
        }
        
        const data = await response.json();
        setAvailabilityData(data);
      } catch (error) {
        console.error("Error loading availability data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAvailabilityData();
  }, [placeDetail?.id, currentMonth]);

  // Fetch availability data for a specific place and date
  const fetchAvailabilityData = async (placeId, date) => {
    try {
      const response = await fetch(
        `/api/bookings/availability?placeId=${placeId}&date=${date}`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch availability for ${date}`);
        return { bookedTimeSlots: [], operatingHours: {}, blockedDates: [], blockedWeekdays: [] };
      }
      
      const data = await response.json();
      return {
        bookedTimeSlots: data.bookedTimeSlots || [],
        operatingHours: data.operatingHours || {},
        blockedDates: data.blockedDates || [],
        blockedWeekdays: data.blockedWeekdays || []
      };
    } catch (error) {
      console.error("Error fetching availability data:", error);
      return { bookedTimeSlots: [], operatingHours: {}, blockedDates: [], blockedWeekdays: [] };
    }
  };

  // Calculate booking percentages for calendar display
  const bookingPercentages = useMemo(() => {
    if (!availabilityData.bookedTimeSlots || availabilityData.bookedTimeSlots.length === 0) {
      return {};
    }
    
    const today = getCurrentDateObjectInUzbekistan();
    const startOfCurrentMonth = startOfMonth(currentMonth);
    const endOfCurrentMonth = endOfMonth(currentMonth);
    
    const percentages = {};
    let currentDate = startOfCurrentMonth;
    
    while (currentDate <= endOfCurrentMonth) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const percentage = calculateBookingPercentage(
        dateStr, 
        availabilityData.bookedTimeSlots,
        placeDetail.weekdayTimeSlots,
        placeDetail.checkIn,
        placeDetail.checkOut,
        placeDetail.cooldown || 0
      );
      
      percentages[dateStr] = percentage;
      currentDate = addDays(currentDate, 1);
    }
    
    return percentages;
  }, [availabilityData.bookedTimeSlots, placeDetail, currentMonth]);

  // Calculate completely unbookable dates
  const completelyUnbookableDates = useMemo(() => {
    if (!availabilityData.bookedTimeSlots || availabilityData.bookedTimeSlots.length === 0) {
      return {};
    }
    
    const startOfCurrentMonth = startOfMonth(currentMonth);
    const endOfCurrentMonth = endOfMonth(currentMonth);
    
    const unbookable = {};
    let currentDate = startOfCurrentMonth;
    
    while (currentDate <= endOfCurrentMonth) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if date is blocked
      if (availabilityData.blockedDates?.includes(dateStr)) {
        unbookable[dateStr] = true;
      }
      // Check if weekday is blocked  
      else if (availabilityData.blockedWeekdays?.includes(dayOfWeek)) {
        unbookable[dateStr] = true;
      }
      // Check if completely booked
      else {
        const isUnbookable = isDateCompletelyUnbookable(
          dateStr,
          availabilityData.bookedTimeSlots,
          placeDetail.weekdayTimeSlots,
          placeDetail.checkIn,
          placeDetail.checkOut,
          placeDetail.cooldown || 0,
          placeDetail.minimumHours || 1
        );
        
        if (isUnbookable) {
          unbookable[dateStr] = true;
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    return unbookable;
  }, [availabilityData, placeDetail, currentMonth]);

  // Generate calendar grid for single month
  const generateCalendarDays = () => {
    const startOfMonthDate = startOfMonth(currentMonth);
    const endOfMonthDate = endOfMonth(currentMonth);
    const startDate = startOfWeek(startOfMonthDate);
    const endDate = endOfWeek(endOfMonthDate);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Handle date click
  const handleDateClick = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    onDateSelect(dateStr);
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setCurrentMonth(prev => addMonths(prev, direction));
  };

  // Get availability color for date
  const getDateAvailabilityColor = (dateStr) => {
    const percentage = bookingPercentages[dateStr] || 0;
    const isUnbookable = completelyUnbookableDates[dateStr];
    
    if (isUnbookable || percentage === 100) {
      return "bg-red-100 text-red-800"; // Fully booked or completely unavailable
    } else if (percentage > 0) {
      return "bg-orange-100 text-orange-800"; // Partially booked
    } else {
      return ""; // Available (no background color)
    }
  };

  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">{t("common.loading", "Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Calendar Section - 30% width on desktop */}
      <div className="w-full lg:w-[30%] bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        {/* Optional left column top slot (e.g., PlaceSelector) */}
        {leftTopSlot ? (
          <div className="mb-4">
            {typeof leftTopSlot === "function" ? leftTopSlot() : leftTopSlot}
          </div>
        ) : null}

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
              {t(`days.${day.toLowerCase()}`, day)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = selectedDate === dateStr;
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            
            // Check if date is blocked
            const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const isDateBlocked = availabilityData.blockedDates?.includes(dateStr);
            const isWeekdayBlocked = availabilityData.blockedWeekdays?.includes(dayOfWeek);
            const isBlocked = isDateBlocked || isWeekdayBlocked;
            
            // Check if date is in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentDate = new Date(day);
            currentDate.setHours(0, 0, 0, 0);
            const isPastDate = currentDate < today;
            
            const isUnavailable = isBlocked || isPastDate;
            
            return (
              <button
                key={index}
                onClick={() => isCurrentMonth && !isUnavailable && handleDateClick(day)}
                disabled={!isCurrentMonth || isUnavailable}
                className={`
                  relative h-10 text-sm rounded-lg transition-all duration-200 flex items-center justify-center border
                  ${!isCurrentMonth 
                    ? "text-gray-300 cursor-not-allowed border-transparent" 
                    : isUnavailable
                      ? "text-gray-400 cursor-not-allowed border-transparent"
                      : "cursor-pointer hover:border-gray-400 border-transparent"
                  }
                  ${isSelected ? "ring-2 ring-primary border-primary" : ""}
                  ${isToday && !isSelected ? "ring-1 ring-gray-400" : ""}
                  ${isCurrentMonth && !isUnavailable ? getDateAvailabilityColor(dateStr) : ""}
                `}
              >
                {isUnavailable && isCurrentMonth ? (
                  <div className="relative flex items-center justify-center w-full h-full">
                    <span className="text-gray-400">{format(day, "d")}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-gray-400 absolute inset-0 m-auto" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                ) : (
                  format(day, "d")
                )}
              </button>
            );
          })}
        </div>

        {/* Availability Legend */}
        <div className="mt-4 text-xs">
          <div className="text-gray-700 font-medium mb-2">
            {t("availability", "Availability")}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
              <span className="text-gray-600">{t("available", "Available")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
              <span className="text-gray-600">{t("partiallyBooked", "Partially Booked")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-gray-600">{t("fullyBooked", "Fully Booked")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section - 70% width on desktop */}
      <div className="w-full lg:w-[70%] bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {selectedDate ? (
          <div>
            {/* Selected Date Header */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy", { locale: getDateLocale() })}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${getDateAvailabilityColor(selectedDate) || "bg-white border border-gray-300"}`}></div>
                  <span className="text-sm text-gray-600">
                    {(() => {
                      const percentage = bookingPercentages[selectedDate] || 0;
                      const isUnbookable = completelyUnbookableDates[selectedDate];
                      
                      // Check if date is blocked
                      const selectedDay = parseISO(selectedDate);
                      const dayOfWeek = selectedDay.getDay();
                      const isDateBlocked = availabilityData.blockedDates?.includes(selectedDate);
                      const isWeekdayBlocked = availabilityData.blockedWeekdays?.includes(dayOfWeek);
                      
                      if (isDateBlocked || isWeekdayBlocked) {
                        return t("calendar:status.blockedByHost");
                      } else if (isUnbookable || percentage === 100) {
                        return t("calendar:status.fullyBooked");
                      } else if (percentage > 0) {
                        return t("calendar:status.percentageBooked", { percentage: Math.round(percentage) });
                      } else {
                        return t("calendar:status.available");
                      }
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* User Role Notification for non-clients */}
            {user && (user.userType === 'host' || user.userType === 'agent') && (
              <div className="mb-6">
                <UserRoleNotification userType={user.userType} />
              </div>
            )}

            {/* Date Availability Details */}
            <CalendarDetailedView 
              date={selectedDate}
              placeDetail={placeDetail}
              bookedTimeSlots={availabilityData.bookedTimeSlots || []}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("selectDate", "Select a date")}
              </h3>
              <p className="text-gray-600">
                {t("clickDateToView", "Click on any date in the calendar to view its availability details.")}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
