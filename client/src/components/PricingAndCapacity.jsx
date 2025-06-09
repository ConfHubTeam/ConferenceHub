import PriceInput from "./PriceInput";
import CurrencySelector from "./CurrencySelector";
import MaxAttendeesInput from "./MaxAttendeesInput";

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
        
        <div className="w-full">
          <label htmlFor="cooldownMinutes" className="block mb-5 text-sm font-medium text-gray-700">
            Cooldown Period
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

        <div className="w-full">
          <label htmlFor="fullDayHours" className="block mb-4 text-sm font-medium text-gray-700">
            Full Day Considered
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
      </div>
    </div>
  );
};

export default PricingAndCapacity;
