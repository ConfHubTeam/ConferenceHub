import { useTranslation } from "react-i18next";
import WeekdayBlocker from "./WeekdayBlocker";
import DateAvailability from "./DateAvailability";
import SpecificDateBlocker from "./SpecificDateBlocker";
import TimeSlotByWeekday from "./TimeSlotByWeekday";
import PricingAndCapacity from "./PricingAndCapacity";

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
  minimumHours,
  setMinimumHours,
  
  // Capacity state
  maxGuests,
  setMaxGuests,
  
  // Room properties
  squareMeters,
  setSquareMeters,
  isHotel,
  setIsHotel,
  
  // Handler functions
  toggleBlockedDate,
  
  // UI helper functions
  preInput
}) {
  const { t } = useTranslation("places");

  return (
    <>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-2">
        {/* Left column: Calendar + Pricing and Capacity */}
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
          
          {/* Pricing and Capacity section */}
          <PricingAndCapacity 
            currency={currency}
            setCurrency={setCurrency}
            availableCurrencies={availableCurrencies}
            price={price}
            setPrice={setPrice}
            fullDayHours={fullDayHours}
            setFullDayHours={setFullDayHours}
            fullDayDiscountPrice={fullDayDiscountPrice}
            setFullDayDiscountPrice={setFullDayDiscountPrice}
            cooldownMinutes={cooldownMinutes}
            setCooldownMinutes={setCooldownMinutes}
            minimumHours={minimumHours}
            setMinimumHours={setMinimumHours}
            maxGuests={maxGuests}
            setMaxGuests={setMaxGuests}
            squareMeters={squareMeters}
            setSquareMeters={setSquareMeters}
            isHotel={isHotel}
            setIsHotel={setIsHotel}
          />
        </div>
        
        {/* Right column: Time slot management section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">⏰ {t("form.scheduleAvailability.title")}</h3>
          
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
      </div>
    </>
  );
}
