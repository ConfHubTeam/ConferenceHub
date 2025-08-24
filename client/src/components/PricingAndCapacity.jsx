import { useTranslation } from "react-i18next";
import PriceInput from "./PriceInput";
import CurrencySelector from "./CurrencySelector";
import MaxAttendeesInput from "./MaxAttendeesInput";
import CooldownInput from "./CooldownInput";
import FullDayHoursInput from "./FullDayHoursInput";
import SquareMetersInput from "./SquareMetersInput";
import HotelCheckbox from "./HotelCheckbox";
import MinimumHoursInput from "./MinimumHoursInput";

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
}) => {
  const { t } = useTranslation("places");

  return (
    <div id="pricing-capacity" className="bg-white p-3 rounded-2xl shadow-sm border">
      {/* Section Title */}
      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
        {t("places:placeCreate.pricingAndCapacity.title")}
        <span className="text-red-500 ml-1">*</span>
      </h3>
      
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
            label={t("places:placeCreate.pricingAndCapacity.pricePerHour")}
            isRequired={false}
          />
        </div>
        <div className="w-full">
          <PriceInput 
            value={fullDayDiscountPrice} 
            onChange={setFullDayDiscountPrice} 
            currency={currency}
            label={t("places:placeCreate.pricingAndCapacity.fullDayDiscountPrice")}
            isRequired={false}
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

        <MinimumHoursInput
          minimumHours={minimumHours}
          setMinimumHours={setMinimumHours}
        />

        <SquareMetersInput
          squareMeters={squareMeters}
          setSquareMeters={setSquareMeters}
        />
        
        <HotelCheckbox
          isHotel={isHotel}
          setIsHotel={setIsHotel}
        />
      </div>
    </div>
  );
};

export default PricingAndCapacity;
