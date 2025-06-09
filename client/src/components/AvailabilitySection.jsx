import PriceInput from "./PriceInput";
import CurrencySelector from "./CurrencySelector";
import MaxAttendeesInput from "./MaxAttendeesInput";
import WeekdayBlocker from "./WeekdayBlocker";
import DateAvailability from "./DateAvailability";
import SpecificDateBlocker from "./SpecificDateBlocker";
import TimeSlotByWeekday from "./TimeSlotByWeekday";

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
  fullDayHours,
  setFullDayHours,
  fullDayDiscountPrice,
  setFullDayDiscountPrice,
  cooldownMinutes,
  setCooldownMinutes,
  
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
      
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-2">
        {/* Left column: Calendar + Block weekdays */}
        <div className="flex flex-col gap-3">
          {/* Calendar component for date selection */}
          <DateAvailability
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            blockedDates={blockedDates}
            blockedWeekdays={blockedWeekdays}
          />
        </div>
        
        {/* Time slot management section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">⏰ Schedule & Availability</h3>
          
          {/* Weekday blocking component */}
          <WeekdayBlocker 
            blockedWeekdays={blockedWeekdays}
            setBlockedWeekdays={setBlockedWeekdays}
          />
          
          {/* Date blocking functionality */}
          <SpecificDateBlocker
            blockedDates={blockedDates}
            setBlockedDates={setBlockedDates}
            showBlockSpecificDates={showBlockSpecificDates}
            setShowBlockSpecificDates={setShowBlockSpecificDates}
            toggleBlockedDate={toggleBlockedDate}
          />
            
          {/* Time slot management per weekday */}
          <TimeSlotByWeekday 
            blockedWeekdays={blockedWeekdays}
            weekdayTimeSlots={weekdayTimeSlots}
            setWeekdayTimeSlots={setWeekdayTimeSlots}
          />
        </div>
        
        {/* Pricing section */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border">
          <div className="w-full mb-2">
            <CurrencySelector 
              selectedCurrency={currency} 
              onChange={setCurrency}
              availableCurrencies={availableCurrencies}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="w-full">
              <PriceInput 
                value={price} 
                onChange={setPrice} 
                currency={currency}
                label="Price per hour"
              />
            </div>
            <div className="w-full">
              <PriceInput 
                value={fullDayDiscountPrice} 
                onChange={setFullDayDiscountPrice} 
                currency={currency}
                label="Full day discount price"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <div className="w-full">
              <label htmlFor="fullDayHours" className="block mb-2 text-sm font-medium text-gray-700">
                Full day considered (hours)
              </label>
              <select
                id="fullDayHours"
                value={fullDayHours}
                onChange={(e) => setFullDayHours(parseInt(e.target.value))}
                className="w-full border py-2 px-3 rounded-xl text-base"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                  <option key={hour} value={hour}>
                    {hour} hour{hour !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full">
              <label htmlFor="cooldownMinutes" className="block mb-2 text-sm font-medium text-gray-700">
                Cooldown period
              </label>
              <select
                id="cooldownMinutes"
                value={cooldownMinutes}
                onChange={(e) => setCooldownMinutes(parseInt(e.target.value))}
                className="w-full border py-2 px-3 rounded-xl text-base"
              >
                {Array.from({ length: 6 }, (_, i) => (i + 1) * 30).map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes >= 60 
                      ? `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}min` : ""}`.trim()
                      : `${minutes} min`
                    }
                  </option>
                ))}
              </select>
            </div>
            
            <MaxAttendeesInput 
              maxGuests={maxGuests}
              setMaxGuests={setMaxGuests}
            />
          </div>
        </div>
      </div>
    </>
  );
}
