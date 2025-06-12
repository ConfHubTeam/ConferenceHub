import React, { useState, useContext, useEffect } from "react";
import { format, parseISO } from "date-fns";
import Calendar from "./Calendar";
import { UserContext } from "./UserContext";
import TimeSlotModal from "./TimeSlotModal";
import SelectedDates from "./SelectedDates";
import UserRoleNotification from "./UserRoleNotification";
import { getAvailableTimeSlots, formatHourTo12 } from "../utils/TimeUtils";

/**
 * PlaceAvailabilityCalendar Component
 * 
 * Shows a calendar display with time slot selection popup for booking.
 * Only allows clients to interact with the calendar for booking purposes.
 * Hosts and agents see a read-only view.
 */
export default function PlaceAvailabilityCalendar({ 
  placeDetail,
  onSelectedDatesChange,
  selectedCalendarDates = [] // Add prop to receive external selected dates
}) {
  const { user } = useContext(UserContext);
  const [selectedDates, setSelectedDates] = useState([]); // Array of selected dates with time slots
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [currentEditingDate, setCurrentEditingDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  
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

  // Handle individual date selection
  const handleDateClick = (dateString) => {
    // Check if date is already selected
    const existingDateIndex = selectedDates.findIndex(d => d.date === dateString);
    
    if (existingDateIndex >= 0) {
      // If date exists, edit the time slots
      const existingDate = selectedDates[existingDateIndex];
      setCurrentEditingDate(dateString);
      setSelectedStartTime(existingDate.startTime);
      setSelectedEndTime(existingDate.endTime);
      setShowTimeSlotModal(true);
    } else {
      // If new date, add it and open time slot modal
      setCurrentEditingDate(dateString);
      const timeSlots = getAvailableTimeSlots(dateString, weekdayTimeSlots, checkIn, checkOut);
      setSelectedStartTime(timeSlots.start);
      setSelectedEndTime("");
      setShowTimeSlotModal(true);
    }
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
      endTime: selectedEndTime,
      formattedDate: format(parseISO(currentEditingDate), "MMM d, yyyy"),
      dayOfWeek: format(parseISO(currentEditingDate), "EEEE")
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

  // Show interactive calendar for unauthorized users and clients
  // Show read-only for owners, agents, and hosts
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

        {/* Read-only calendar */}
        <div className="max-w-lg mx-auto">
          <Calendar 
            startDate=""
            endDate=""
            onDateChange={() => {}} // No-op for read-only view
            minDate={startDate ? new Date(startDate) : new Date()}
            maxDate={endDate ? new Date(endDate) : null}
            blockedDates={blockedDates || []}
            blockedWeekdays={blockedWeekdays || []}
            selectedIndividualDates={[]} // No selection in read-only mode
            onIndividualDateClick={() => {}} // No-op for read-only view
            individualDateMode={false} // Disable individual date selection mode
          />
        </div>
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
      
      {/* Calendar Display */}
      <div className="max-w-lg mx-auto">
        <Calendar 
          startDate="" // Clear range selection
          endDate=""
          onDateChange={handleDateChange}
          minDate={startDate ? new Date(startDate) : new Date()}
          maxDate={endDate ? new Date(endDate) : null}
          blockedDates={blockedDates || []}
          blockedWeekdays={blockedWeekdays || []}
          selectedIndividualDates={selectedDates} // Pass selected individual dates with time slots
          onIndividualDateClick={handleDateClick} // Handler for individual date selection
          individualDateMode={true} // Enable individual date selection mode
        />
      </div>
      
      {/* Selected dates display */}
      <SelectedDates 
        selectedDates={selectedDates}
        onClearAll={handleClearAllDates}
        onDateClick={handleDateClick}
        onRemoveDate={removeSelectedDate}
        onSelectedDatesChange={onSelectedDatesChange}
      />

      {/* Time Slot Selection Modal */}
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
      />
    </div>
  );
}
