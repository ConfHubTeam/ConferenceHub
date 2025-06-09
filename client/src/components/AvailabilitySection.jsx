import React from "react";
import Calendar from "./Calendar";
import { format, parseISO } from "date-fns";
import PriceInput from "./PriceInput";
import CurrencySelector from "./CurrencySelector";

/**
 * AvailabilitySection Component - Step 2 Refactoring
 * 
 * Extracted from PlacesFormPage without changing any existing logic.
 * This component handles availability times, date/time management, pricing, and capacity.
 */
export default function AvailabilitySection({
  // Date state
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  
  // Time slot management state
  blockedWeekdays,
  setBlockedWeekdays,
  blockedDates,
  setBlockedDates,
  showBlockSpecificDates,
  setShowBlockSpecificDates,
  weekdayTimeSlots,
  setWeekdayTimeSlots,
  
  // Pricing state
  currency,
  setCurrency,
  availableCurrencies,
  price,
  setPrice,
  
  // Capacity state
  maxGuests,
  setMaxGuests,
  
  // Handler functions
  toggleBlockedDate,
  
  // UI helper functions
  preInput
}) {
  return (
    <>
      {preInput(
        "Availability times",
        "add available times, remember to have some time for cleaning the room between bookings."
      )}
      
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-2">
        {/* Calendar component for date selection */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border lg:col-span-2">
          <h3 className="text-base font-medium mb-3">Available dates</h3>
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
            <div className="mt-3 p-2 bg-blue-50 rounded-lg text-blue-800 text-sm">
              <p className="font-medium">Selected range:</p>
              <p>
                {format(parseISO(startDate), "MMMM d, yyyy")}
                {endDate && ` - ${format(parseISO(endDate), "MMMM d, yyyy")}`}
              </p>
            </div>
          )}
        </div>
        
        {/* Time slot management section */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border lg:col-span-2">
          <h3 className="text-base font-medium mb-3">Block weekdays & set time slots</h3>
          
          {/* Weekday blocking checkboxes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <label key={day} className="flex items-center gap-1 p-2 border rounded-lg">
                <input
                  type="checkbox"
                  checked={blockedWeekdays.includes(index)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBlockedWeekdays(prev => [...prev, index]);
                    } else {
                      setBlockedWeekdays(prev => prev.filter(d => d !== index));
                    }
                  }}
                  className="w-4 h-4 accent-blue-600"
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
          
          {/* Blocked dates counter */}
          {blockedDates.length > 0 && (
            <div className="mb-3 flex justify-between items-center">
              <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">{blockedDates.length}</span>
                <span className="ml-1">{blockedDates.length === 1 ? 'date' : 'dates'} blocked</span>
                <button 
                  type="button"
                  onClick={() => setBlockedDates([])}
                  className="ml-3 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
          
          {/* Block specific dates toggle */}
          <div className="flex items-center mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`relative inline-block w-10 h-6 rounded-full transition ${showBlockSpecificDates ? 'bg-blue-600' : 'bg-gray-300'}`}>
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
              <span>Block Specific Dates</span>
            </label>
          </div>
          
          {/* Specific date picker calendar (only shown when toggle is enabled) */}
          {showBlockSpecificDates && (
            <div className="mb-4 border p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Select dates to block:</h4>
                {blockedDates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBlockedDates([])}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear all blocked dates
                  </button>
                )}
              </div>
              <Calendar 
                blockedDates={blockedDates}
                minDate={new Date(new Date().setHours(0, 0, 0, 0))} // Allow blocking from today
                onBlockedDateClick={toggleBlockedDate} // Use the specific handler for date blocking
              />
              {blockedDates.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">{blockedDates.length}</span> {blockedDates.length === 1 ? 'date' : 'dates'} currently blocked
                </div>
              )}
            </div>
          )}
          
          {/* Time slot management per weekday */}
          <div className="mb-2">
            <h4 className="text-base font-medium mb-3">Time slots by weekday</h4>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={day} className={`p-3 mb-2 rounded-lg border ${blockedWeekdays.includes(index) ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                {/* Day label */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm sm:text-base">
                    <span className="sm:hidden">{day.substring(0, 3)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </span>
                  {blockedWeekdays.includes(index) && (
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Blocked</span>
                  )}
                </div>
                
                {/* Time selection - stack on mobile, side by side on larger screens */}
                {!blockedWeekdays.includes(index) && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-600 w-12 sm:w-auto">From:</span>
                      <select
                        value={weekdayTimeSlots[index].start}
                        onChange={(e) => {
                          setWeekdayTimeSlots(prev => ({
                            ...prev, 
                            [index]: {...prev[index], start: e.target.value}
                          }));
                        }}
                        className="flex-1 sm:flex-none border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={blockedWeekdays.includes(index)}
                      >
                        <option value="">Select start time</option>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <option key={hour} value={hour}>
                              {hour}:00
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-600 w-12 sm:w-auto">To:</span>
                      <select
                        value={weekdayTimeSlots[index].end}
                        onChange={(e) => {
                          setWeekdayTimeSlots(prev => ({
                            ...prev, 
                            [index]: {...prev[index], end: e.target.value}
                          }));
                        }}
                        className="flex-1 sm:flex-none border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={blockedWeekdays.includes(index)}
                      >
                        <option value="">Select end time</option>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <option key={hour} value={hour}>
                              {hour}:00
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-2xl shadow-sm border">
          <div className="w-full">
            <CurrencySelector 
              selectedCurrency={currency} 
              onChange={setCurrency}
              availableCurrencies={availableCurrencies}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="w-full">
              <PriceInput 
                value={price} 
                onChange={setPrice} 
                currency={currency}
                label="Price per hour"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-2xl shadow-sm border">
          <h3 className="text-base font-medium mb-1">Max number of attendees</h3>
          <input
            type="number"
            min="1"
            placeholder="10"
            value={maxGuests}
            onChange={(event) => setMaxGuests(event.target.value)}
            className="w-full border py-2 px-3 rounded-xl"
          />
        </div>
      </div>
    </>
  );
}
