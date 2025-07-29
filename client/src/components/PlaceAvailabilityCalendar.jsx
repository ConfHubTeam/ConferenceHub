import React, { useState, useContext, useEffect, useMemo } from "react";
import { format, parseISO, addDays, startOfMonth, endOfMonth } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import Calendar from "./Calendar";
import { UserContext } from "./UserContext";
import TimeSlotModal from "./TimeSlotModal";
import SelectedDates from "./SelectedDates";
import UserRoleNotification from "./UserRoleNotification";
import DateAvailabilityDetails from "./DateAvailabilityDetails";
import { getAvailableTimeSlots, formatHourTo12, calculateBookingPercentage, isDateCompletelyUnbookable } from "../utils/TimeUtils";
import { getTimezoneAwareAvailability, getMinimumBookingDate, getCurrentDateObjectInUzbekistan, getCurrentDateInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * PlaceAvailabilityCalendar Component
 * 
 * Shows a calendar display with time slot selection popup for booking.
 * Only allows clients to interact with the calendar for booking purposes.
 * Hosts and agents see a read-only view with the ability to check date details.
 */
export default function PlaceAvailabilityCalendar({ 
  placeDetail,
  onSelectedDatesChange,
  selectedCalendarDates = [], // Add prop to receive external selected dates
  existingBookings = [] // Add prop to receive existing bookings data
}) {
  const { user } = useContext(UserContext);
  const { i18n } = useTranslation();
  
  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };
  
  const [selectedDates, setSelectedDates] = useState([]); // Array of selected dates with time slots
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [currentEditingDate, setCurrentEditingDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailDate, setSelectedDetailDate] = useState("");
  
  // State for tracking booked time slots from API
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  // State for timezone-aware availability
  const [availableDatesUzbekistan, setAvailableDatesUzbekistan] = useState([]);
  const [timezoneAvailability, setTimezoneAvailability] = useState(null);
  const [currentDateAvailableSlots, setCurrentDateAvailableSlots] = useState([]);
  const [timezoneAvailabilityData, setTimezoneAvailabilityData] = useState(null);
  
  // Calculate booking percentages for calendar days based on booked time slots
  const bookingPercentages = useMemo(() => {
    if (!bookedTimeSlots || bookedTimeSlots.length === 0) {
      return {};
    }
    
    // Generate dates for current month and next month using Uzbekistan timezone
    const today = getCurrentDateObjectInUzbekistan();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfNextMonth = endOfMonth(addDays(endOfMonth(today), 31)); // End of next month
    
    const percentages = {};
    let currentDate = startOfCurrentMonth;
    
    while (currentDate <= endOfNextMonth) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const percentage = calculateBookingPercentage(
        dateStr, 
        bookedTimeSlots, // Use fetched booked time slots instead of existingBookings
        placeDetail.weekdayTimeSlots,
        placeDetail.checkIn,
        placeDetail.checkOut,
        placeDetail.cooldown || 0
      );
      
      percentages[dateStr] = percentage;
      currentDate = addDays(currentDate, 1);
    }
    
    return percentages;
  }, [bookedTimeSlots, placeDetail]); // Update dependencies
  
  // Calculate completely unbookable dates (should be shown as red even if not 100% booked)
  const completelyUnbookableDates = useMemo(() => {
    if (!bookedTimeSlots || bookedTimeSlots.length === 0) {
      return {};
    }
    
    // Generate dates for current month and next month using Uzbekistan timezone
    const today = getCurrentDateObjectInUzbekistan();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfNextMonth = endOfMonth(addDays(endOfMonth(today), 31)); // End of next month
    
    const unbookable = {};
    let currentDate = startOfCurrentMonth;
    
    while (currentDate <= endOfNextMonth) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      
      // Check if this date is completely unbookable due to constraints
      const isUnbookable = isDateCompletelyUnbookable(
        dateStr,
        bookedTimeSlots,
        placeDetail.weekdayTimeSlots,
        placeDetail.checkIn,
        placeDetail.checkOut,
        placeDetail.cooldown || 0,
        placeDetail.minimumHours || 1
      );
      
      unbookable[dateStr] = isUnbookable;
      currentDate = addDays(currentDate, 1);
    }
    
    return unbookable;
  }, [bookedTimeSlots, placeDetail]); // Update dependencies
  
  const {
    startDate,
    endDate,
    blockedDates,
    blockedWeekdays,
    checkIn,
    checkOut,
    weekdayTimeSlots
  } = placeDetail;

  // Sync external selectedCalendarDates with internal selectedDates state
  useEffect(() => {
    if (selectedCalendarDates && selectedCalendarDates.length > 0) {
      setSelectedDates(selectedCalendarDates);
    }
  }, [selectedCalendarDates]);

  // Fetch booked time slots when component mounts or placeDetail changes
  useEffect(() => {
    if (placeDetail && placeDetail.id) {
      setIsLoadingAvailability(true);
      
      // Fetch both regular availability and timezone-aware availability
      Promise.all([
        // Regular availability for existing functionality
        import("../utils/api").then(({ default: api }) => 
          api.get(`/bookings/availability?placeId=${placeDetail.id}`)
        ),
        // Timezone-aware availability for Uzbekistan
        getTimezoneAwareAvailability(placeDetail.id)
      ])
      .then(([regularResponse, timezoneResponse]) => {
        // Set regular booked time slots
        if (regularResponse.data && regularResponse.data.bookedTimeSlots) {
          setBookedTimeSlots(regularResponse.data.bookedTimeSlots);
        }
        
        // Set timezone-aware data
        if (timezoneResponse) {
          setTimezoneAvailability(timezoneResponse);
          setAvailableDatesUzbekistan(timezoneResponse.availableDates || []);
        }
      })
      .catch(err => {
        console.error("Failed to fetch availability:", err);
        
        // Fallback to regular availability only
        import("../utils/api").then(({ default: api }) => {
          return api.get(`/bookings/availability?placeId=${placeDetail.id}`);
        })
        .then(response => {
          if (response.data && response.data.bookedTimeSlots) {
            setBookedTimeSlots(response.data.bookedTimeSlots);
          }
        })
        .catch(fallbackErr => {
          console.error("Fallback availability fetch also failed:", fallbackErr);
        });
      })
      .finally(() => {
        setIsLoadingAvailability(false);
      });
    }
  }, [placeDetail]);

  // Handle individual date selection
  const handleDateClick = async (dateString) => {
    // Check if date is already selected
    const existingDateIndex = selectedDates.findIndex(d => d.date === dateString);
    
    if (existingDateIndex >= 0) {
      // If date exists, edit the time slots
      const existingDate = selectedDates[existingDateIndex];
      setCurrentEditingDate(dateString);
      setSelectedStartTime(existingDate.startTime);
      setSelectedEndTime(existingDate.endTime);
      
      // Fetch timezone-aware available time slots for this specific date
      try {
        const availability = await getTimezoneAwareAvailability(placeDetail.id, dateString);
        setCurrentDateAvailableSlots(availability.availableTimeSlots || []);
      } catch (error) {
        console.error('Failed to fetch timezone-aware availability for date:', error);
        setCurrentDateAvailableSlots([]);
      }
      
      setShowTimeSlotModal(true);
    } else {
      // If new date, fetch timezone-aware availability for this specific date
      setCurrentEditingDate(dateString);
      
      try {
        // Fetch timezone-aware availability for this specific date
        const dateAvailability = await getTimezoneAwareAvailability(placeDetail.id, dateString);
        
        // Update the timezone availability data for this date
        setTimezoneAvailability(dateAvailability);
        setCurrentDateAvailableSlots(dateAvailability.availableTimeSlots || []);
        
        const timeSlots = getAvailableTimeSlots(dateString, weekdayTimeSlots, checkIn, checkOut);
        setSelectedStartTime(""); // Let TimeSlotModal set intelligent default
        setSelectedEndTime("");
        setShowTimeSlotModal(true);
      } catch (error) {
        console.error('Error fetching date-specific availability:', error);
        
        // Fallback to regular time slot generation
        const timeSlots = getAvailableTimeSlots(dateString, weekdayTimeSlots, checkIn, checkOut);
        setSelectedStartTime(""); // Let TimeSlotModal set intelligent default
        setSelectedEndTime("");
        setShowTimeSlotModal(true);
      }
    }
  };

  // Get timezone-aware available time slots for current editing date
  const getCurrentDateTimezoneSlots = () => {
    if (!currentDateAvailableSlots || currentDateAvailableSlots.length === 0) {
      return [];
    }
    
    return currentDateAvailableSlots;
  };

  // Custom date change handler for individual date selection
  const handleDateChange = (start, end) => {
    // For individual date selection, we only care about the start date
    if (start) {
      handleDateClick(start);
    }
  };

  // Remove a selected date
  const removeSelectedDate = (dateToRemove) => {
    const updatedDates = selectedDates.filter(d => d.date !== dateToRemove);
    setSelectedDates(updatedDates);
    
    // Notify parent component of the change
    if (onSelectedDatesChange) {
      setTimeout(() => onSelectedDatesChange(updatedDates), 0);
    }
  };

  // Handle time slot confirmation
  const handleTimeSlotConfirm = () => {
    if (!selectedStartTime || !selectedEndTime || !currentEditingDate) return;
    
    const newDateSlot = {
      date: currentEditingDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime
      // Removed formattedDate and dayOfWeek - these will be generated dynamically for display
    };

    // Calculate updated dates
    const existingIndex = selectedDates.findIndex(d => d.date === currentEditingDate);
    let updatedDates;
    if (existingIndex >= 0) {
      // Update existing date
      const updated = [...selectedDates];
      updated[existingIndex] = newDateSlot;
      updatedDates = updated;
    } else {
      // Add new date
      updatedDates = [...selectedDates, newDateSlot].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Update state
    setSelectedDates(updatedDates);

    // Notify parent component after state update
    if (onSelectedDatesChange) {
      setTimeout(() => onSelectedDatesChange(updatedDates), 0);
    }

    handleModalClose();
  };

  // Close modal and reset selections
  const handleModalClose = () => {
    setShowTimeSlotModal(false);
    setCurrentEditingDate("");
    setSelectedStartTime("");
    setSelectedEndTime("");
  };

  // Clear all selected dates
  const handleClearAllDates = () => {
    setSelectedDates([]);
    // Notify parent component of the change
    if (onSelectedDatesChange) {
      onSelectedDatesChange([]);
    }
  };

  // Determine user type and permissions
  const isOwner = user && placeDetail.ownerId === user.id;
  const isAgent = user && user.userType === 'agent';
  const isHost = user && user.userType === 'host';
  const canBook = user && user.userType === 'client';
  const isUnauthorized = !user;

  // Handle date click for host/agent view to show details
  const handleDetailDateClick = (dateString) => {
    setSelectedDetailDate(dateString);
    setShowDetailModal(true);
  };

  // Show interactive calendar for unauthorized users and clients
  // Show calendar with availability details for owners, agents, and hosts
  if (!isUnauthorized && !canBook) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Availability Calendar
        </h2>

        {/* User role notification */}
        <UserRoleNotification 
          isOwner={isOwner} 
          isAgent={isAgent && !isOwner} 
          isHost={isHost && !isOwner} 
        />
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="font-medium">Click on any date to see booking details</p>
          </div>
        </div>

        {/* Calendar with click functionality */}
        <div className="w-full max-w-lg lg:max-w-4xl mx-auto">
        <Calendar 
          startDate=""
          endDate=""
          onDateChange={() => {}} // We handle clicks separately
          // minDate removed when using timezone validation - let timezone logic handle past dates
          maxDate={endDate ? new Date(endDate) : null}
            blockedDates={blockedDates || []}
            blockedWeekdays={blockedWeekdays || []}
            selectedIndividualDates={[]} // No selection mode
            onIndividualDateClick={handleDetailDateClick} // Show details on date click
            individualDateMode={true} // Enable individual date selection mode
            bookingPercentages={bookingPercentages} // Pass booking percentages
            completelyUnbookableDates={completelyUnbookableDates} // Pass completely unbookable dates
            availableDatesUzbekistan={availableDatesUzbekistan} // Timezone-aware available dates
            useTimezoneValidation={true} // Enable Uzbekistan timezone validation
          />
        </div>
        
        {/* Date Availability Details Modal */}
        {showDetailModal && (
          <DateAvailabilityDetails
            date={selectedDetailDate}
            onClose={() => setShowDetailModal(false)}
            bookedTimeSlots={bookedTimeSlots} // Use fetched booked time slots
            placeDetail={{
              ...placeDetail,
              // Ensure weekdayTimeSlots is properly passed
              weekdayTimeSlots: placeDetail.weekdayTimeSlots || {}
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
                {isUnauthorized || canBook ? "Select Your Dates" : "Availability Calendar"}
      </h2>

      {/* Information for unauthenticated users */}
      {isUnauthorized && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="font-medium">Select dates and time slots to see pricing. You'll need to login to complete booking.</p>
          </div>
        </div>
      )}
      
      {/* Calendar Display */}
      <div className="w-full max-w-lg lg:max-w-4xl mx-auto">
        <Calendar 
          startDate="" // Clear range selection
          endDate=""
          onDateChange={handleDateChange}
          // minDate removed when using timezone validation - let timezone logic handle past dates
          maxDate={endDate ? new Date(endDate) : null}
          blockedDates={blockedDates || []}
          blockedWeekdays={blockedWeekdays || []}
          selectedIndividualDates={selectedDates} // Pass selected individual dates with time slots
          onIndividualDateClick={handleDateClick} // Both authenticated and unauthenticated users can select dates
          individualDateMode={true} // Enable individual date selection mode
          bookingPercentages={bookingPercentages} // Pass booking percentages
          completelyUnbookableDates={completelyUnbookableDates} // Pass completely unbookable dates
          availableDatesUzbekistan={availableDatesUzbekistan} // Timezone-aware available dates
          useTimezoneValidation={true} // Enable Uzbekistan timezone validation
        />
      </div>
      
      {/* Show date availability details modal for hosts/agents only */}
      {!isUnauthorized && !canBook && showDetailModal && (
        <DateAvailabilityDetails
          date={selectedDetailDate}
          onClose={() => setShowDetailModal(false)}
          bookedTimeSlots={bookedTimeSlots} // Use fetched booked time slots
          placeDetail={{
            ...placeDetail,
            weekdayTimeSlots: placeDetail.weekdayTimeSlots || {}
          }}
        />
      )}
      
      {/* Selected dates display - for both authenticated and unauthenticated users */}
      <SelectedDates 
        selectedDates={selectedDates}
        onClearAll={handleClearAllDates}
        onDateClick={handleDateClick}
        onRemoveDate={removeSelectedDate}
        onSelectedDatesChange={onSelectedDatesChange}
      />

      {/* Time Slot Selection Modal - for both authenticated and unauthenticated users */}
      <TimeSlotModal 
        isOpen={showTimeSlotModal}
        onClose={handleModalClose}
        onConfirm={handleTimeSlotConfirm}
        currentEditingDate={currentEditingDate}
        selectedStartTime={selectedStartTime}
        selectedEndTime={selectedEndTime}
        onStartTimeChange={setSelectedStartTime}
        onEndTimeChange={setSelectedEndTime}
        timeSlots={getAvailableTimeSlots(currentEditingDate, weekdayTimeSlots, checkIn, checkOut)}
        placeDetail={placeDetail}
        isEditMode={selectedDates.some(d => d.date === currentEditingDate)}
        bookedTimeSlots={bookedTimeSlots} // Use fetched booked time slots from API
        timezoneAvailableTimeSlots={getCurrentDateTimezoneSlots()} // Timezone-aware available time slots
      />
    </div>
  );
}
