import PriceInput from "./PriceInput";
import CurrencySelector from "./CurrencySelector";
import MaxAttendeesInput from "./MaxAttendeesInput";
import CooldownInput from "./CooldownInput";
import FullDayHoursInput from "./FullDayHoursInput";

/**
 * PricingAndCapacity Component
 * 
 * This component handles pricing options and capacity settings for a space.
 * Extracted from AvailabilitySection to separate concerns.
 */
const PricingAndCapacity = ({
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
}) => {
  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border">
      <div className="w-full mb-3">
        <CurrencySelector 
          selectedCurrency={currency} 
          onChange={setCurrency}
          availableCurrencies={availableCurrencies}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        
        <CooldownInput
          cooldownMinutes={cooldownMinutes}
          setCooldownMinutes={setCooldownMinutes}
        />
        
        <MaxAttendeesInput 
          maxGuests={maxGuests}
          setMaxGuests={setMaxGuests}
        />

        <FullDayHoursInput
          fullDayHours={fullDayHours}
          setFullDayHours={setFullDayHours}
        />
      </div>
    </div>
  );
};

export default PricingAndCapacity;
