import React, { useState, useContext } from "react";
import Calendar from "./Calendar";
import { format, parseISO } from "date-fns";
import { UserContext } from "./UserContext";

/**
 * PlaceAvailabilityCalendar Component
 * 
 * Shows a calendar display with time slot selection popup for booking.
 * Only allows clients to interact with the calendar for booking purposes.
 * Hosts and agents see a read-only view.
 */
export default function PlaceAvailabilityCalendar({ 
  placeDetail,
  onSelectedDatesChange 
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
      const timeSlots = getAvailableTimeSlots(dateString);
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
      onSelectedDatesChange(updatedDates);
    }
  };

  // Get available time slots for a specific day
  const getAvailableTimeSlots = (dateString) => {
    if (!dateString) return { start: checkIn || "09:00", end: checkOut || "17:00" };
    
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    
    // Check if there are specific time slots for this weekday
    if (weekdayTimeSlots && weekdayTimeSlots[dayOfWeek]) {
      const timeSlot = weekdayTimeSlots[dayOfWeek];
      if (timeSlot.start && timeSlot.end) {
        return {
          start: formatHourTo24(timeSlot.start),
          end: formatHourTo24(timeSlot.end)
        };
      }
    }
    
    // Fallback to general check-in/check-out times
    return { start: checkIn || "09:00", end: checkOut || "17:00" };
  };

  // Convert hour string to 24-hour format
  const formatHourTo24 = (hour) => {
    if (!hour) return "09:00";
    return hour.padStart(2, '0') + ":00";
  };

  // Convert 24-hour format to 12-hour format for display
  const formatHourTo12 = (hour24) => {
    if (!hour24) return "";
    const [hours] = hour24.split(':');
    const hourNum = parseInt(hours, 10);
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const amPm = hourNum < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${amPm}`;
  };

  // Generate time options for select dropdowns
  const generateTimeOptions = (startHour, endHour) => {
    const options = [];
    const start = parseInt(startHour.split(':')[0], 10);
    const end = parseInt(endHour.split(':')[0], 10);
    
    for (let i = start; i <= end; i++) {
      const hour24 = i.toString().padStart(2, '0') + ':00';
      const hour12 = formatHourTo12(hour24);
      options.push({ value: hour24, label: hour12 });
    }
    
    return options;
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

    setSelectedDates(prev => {
      const existingIndex = prev.findIndex(d => d.date === currentEditingDate);
      let updatedDates;
      if (existingIndex >= 0) {
        // Update existing date
        const updated = [...prev];
        updated[existingIndex] = newDateSlot;
        updatedDates = updated;
      } else {
        // Add new date
        updatedDates = [...prev, newDateSlot].sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      
      // Notify parent component of the change
      if (onSelectedDatesChange) {
        onSelectedDatesChange(updatedDates);
      }
      
      return updatedDates;
    });

    handleModalClose();
  };

  // Close modal and reset selections
  const handleModalClose = () => {
    setShowTimeSlotModal(false);
    setCurrentEditingDate("");
    setSelectedStartTime("");
    setSelectedEndTime("");
  };

  // Determine if user can book (only clients can book, not hosts or agents)
  const canBook = user && user.userType === 'client';
  const isOwner = user && placeDetail.ownerId === user.id;
  const isAgent = user && user.userType === 'agent';
  const isHost = user && user.userType === 'host';

  // If user is not a client, show read-only availability information
  if (!canBook) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Availability Calendar
        </h2>

        {/* Owner notification */}
        {isOwner && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <p className="text-green-800 font-medium">You own this conference room</p>
            </div>
            <p className="text-green-700 text-sm mt-1">You can view the calendar to see availability, but booking is for clients only.</p>
          </div>
        )}

        {/* Agent notification */}
        {isAgent && !isOwner && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 font-medium">Agent View</p>
            </div>
            <p className="text-blue-700 text-sm mt-1">You can view the calendar to see availability, but booking is for clients only.</p>
          </div>
        )}

        {/* Host notification */}
        {isHost && !isOwner && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-purple-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <p className="text-purple-800 font-medium">Host View</p>
            </div>
            <p className="text-purple-700 text-sm mt-1">You can view the calendar to see availability, but booking is for clients only.</p>
          </div>
        )}

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

        {/* Information for non-clients */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Calendar Information
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Gray dates:</strong> Not available for booking</li>
            <li>• <strong>White dates:</strong> Available for booking</li>
            <li>• <strong>Red dates:</strong> Specifically blocked dates</li>
            {!user && <li>• <strong>To book:</strong> Please log in as a client</li>}
          </ul>
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
        Select Your Dates
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
      {selectedDates.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center justify-between">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Selected Booking Slots ({selectedDates.length})
            </span>
            <button
              onClick={() => {
                setSelectedDates([]);
                // Notify parent component of the change
                if (onSelectedDatesChange) {
                  onSelectedDatesChange([]);
                }
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium underline"
            >
              Clear All
            </button>
          </h3>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedDates.map((dateSlot, index) => (
              <div key={dateSlot.date} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300">
                <div className="flex-1">
                  <div className="font-medium text-green-800">
                    {dateSlot.formattedDate} ({dateSlot.dayOfWeek})
                  </div>
                  <div className="text-sm text-green-600">
                    {formatHourTo12(dateSlot.startTime)} - {formatHourTo12(dateSlot.endTime)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDateClick(dateSlot.date)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    title="Edit time"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeSelectedDate(dateSlot.date)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    title="Remove date"
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
      )}

      {/* Time Slot Selection Modal */}
      {showTimeSlotModal && currentEditingDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Set Time Slot
              </h3>
              <button 
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-900 font-medium text-sm">
                {format(parseISO(currentEditingDate), "EEEE, MMM d, yyyy")}
              </p>
            </div>

            {/* Minimum hours requirement info */}
            {placeDetail.minimumHours && placeDetail.minimumHours > 1 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center text-amber-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs">
                    <strong>Minimum booking:</strong> {placeDetail.minimumHours} hour{placeDetail.minimumHours > 1 ? 's' : ''} required
                  </p>
                </div>
              </div>
            )}

            {(() => {
              const timeSlots = getAvailableTimeSlots(currentEditingDate);
              const timeOptions = generateTimeOptions(timeSlots.start, timeSlots.end);
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <select
                        value={selectedStartTime}
                        onChange={(e) => setSelectedStartTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select start time</option>
                        {timeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <select
                        value={selectedEndTime}
                        onChange={(e) => setSelectedEndTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!selectedStartTime}
                      >
                        <option value="">Select end time</option>
                        {timeOptions
                          .filter(option => {
                            if (!selectedStartTime) return true;
                            
                            // Get minimum hours requirement
                            const minimumHours = placeDetail.minimumHours || 1;
                            
                            // Calculate the minimum end time based on start time + minimum hours
                            const startHour = parseInt(selectedStartTime.split(':')[0], 10);
                            const minimumEndHour = startHour + minimumHours;
                            const endHour = parseInt(option.value.split(':')[0], 10);
                            
                            // End time must be greater than start time and meet minimum hours requirement
                            return endHour >= minimumEndHour;
                          })
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Available hours:</strong> {formatHourTo12(timeSlots.start)} - {formatHourTo12(timeSlots.end)}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleModalClose}
                      className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTimeSlotConfirm}
                      disabled={!selectedStartTime || !selectedEndTime}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {selectedDates.some(d => d.date === currentEditingDate) ? 'Update' : 'Add'} Slot
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
