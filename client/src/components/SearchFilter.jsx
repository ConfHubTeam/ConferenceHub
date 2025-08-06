import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useAttendeesFilter, ATTENDEES_RANGES } from "../contexts/AttendeesFilterContext";
import { useSizeFilter, SIZE_RANGES } from "../contexts/SizeFilterContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { formatCurrency, getCurrencySymbol } from "../utils/currencyUtils";
import { formatHourTo12, formatHourLocalized } from "../utils/TimeUtils";
import { format } from "date-fns";
import DateTimeFilterModal from "./DateTimeFilterModal";
import PriceFilterModal from "./PriceFilterModal";
import AttendeesFilterModal from "./AttendeesFilterModal";
import SizeFilterModal from "./SizeFilterModal";

/**
 * Reusable Search Filter Component
 * Follows DRY principle - can be used across multiple pages
 * Enhanced styling to match screenshot requirements
 * Integrated with DateTimeFilterModal for date/time selection
 */
export default function SearchFilter({ 
  onSearch, 
  className = "",
  placeholder = {},
  initialValues = {}
}) {
  const { t, i18n } = useTranslation("search");
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Use the DateTimeFilter context for date/time state
  const { 
    selectedDates, 
    startTime, 
    endTime, 
    getSerializedValues, 
    hasActiveDateTimeFilter 
  } = useDateTimeFilter();
  
  // Use the PriceFilter context for price state
  const { 
    minPrice, 
    maxPrice, 
    getSerializedValues: getPriceSerializedValues, 
    hasActivePriceFilter 
  } = usePriceFilter();
  
  // Use the AttendeesFilter context for attendees state
  const { 
    minAttendees, 
    maxAttendees, 
    selectedRangeId: attendeesRangeId,
    getSerializedValues: getAttendeesSerializedValues, 
    hasActiveAttendeesFilter 
  } = useAttendeesFilter();

  // Use the SizeFilter context for size state
  const { 
    minSize, 
    maxSize, 
    selectedRangeId: sizeRangeId,
    getSerializedValues: getSizeSerializedValues, 
    hasActiveSizeFilter 
  } = useSizeFilter();

  // Get currency from context
  const { selectedCurrency } = useCurrency();

  // Formatting functions with translation support
  const getFormattedDateTime = () => {
    if (selectedDates.length === 0) return "";
    if (selectedDates.length === 1) {
      const formattedDate = format(selectedDates[0], "MMM d");
      // Include time information if available
      if (startTime && endTime) {
        return `${formattedDate}, ${formatHourLocalized(startTime, i18n.language)}-${formatHourLocalized(endTime, i18n.language)}`;
      }
      return formattedDate;
    }
    return t("filters.buttons.multiple_dates", { count: selectedDates.length });
  };
  
  const getFormattedPriceRange = () => {
    if (!selectedCurrency) return "";
    
    const symbol = getCurrencySymbol(selectedCurrency);
    const hasMin = minPrice !== null && minPrice !== undefined && minPrice !== "";
    const hasMax = maxPrice !== null && maxPrice !== undefined && maxPrice !== "";

    if (!hasMin && !hasMax) return "";

    if (hasMin && hasMax) {
      const formattedMin = formatCurrency(minPrice, selectedCurrency);
      const formattedMax = formatCurrency(maxPrice, selectedCurrency);
      
      if (selectedCurrency.charCode === "USD") {
        return `${symbol}${formattedMin} - ${symbol}${formattedMax}`;
      } else {
        return `${formattedMin} - ${formattedMax} ${symbol}`;
      }
    } else if (hasMin) {
      const formattedMin = formatCurrency(minPrice, selectedCurrency);
      
      if (selectedCurrency.charCode === "USD") {
        return `${symbol}${formattedMin}+`;
      } else {
        return `${formattedMin}+ ${symbol}`;
      }
    } else if (hasMax) {
      const formattedMax = formatCurrency(maxPrice, selectedCurrency);
      
      if (selectedCurrency.charCode === "USD") {
        // Handle Uzbek word order: "amount gacha" instead of "Up to amount"
        if (i18n.language === "uz") {
          return `${symbol}${formattedMax} ${t("filters.buttons.up_to")}`;
        } else {
          return `${t("filters.buttons.up_to")} ${symbol}${formattedMax}`;
        }
      } else {
        // Handle Uzbek word order: "amount gacha" instead of "Up to amount"
        if (i18n.language === "uz") {
          return `${formattedMax} ${symbol} ${t("filters.buttons.up_to")}`;
        } else {
          return `${t("filters.buttons.up_to")} ${formattedMax} ${symbol}`;
        }
      }
    }

    return "";
  };
  
  const getFormattedAttendeesRange = () => {
    const hasMin = minAttendees !== null && minAttendees !== undefined;
    const hasMax = maxAttendees !== null && maxAttendees !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check for predefined ranges with translation keys
    if (attendeesRangeId && attendeesRangeId !== "custom") {
      // Convert hyphen to underscore for translation keys
      const translationKey = attendeesRangeId.replace(/-/g, "_").replace(/\+/g, "plus");
      return t(`filters.modals.attendees.presets.${translationKey}`);
    }

    // Custom formatting with translations
    if (hasMin && hasMax) {
      return t("filters.buttons.attendees_range", { min: minAttendees, max: maxAttendees });
    } else if (hasMin) {
      return t("filters.buttons.attendees_min", { min: minAttendees });
    } else if (hasMax) {
      return t("filters.buttons.attendees_max", { max: maxAttendees });
    }

    return "";
  };
  
  const getFormattedSizeRange = () => {
    const hasMin = minSize !== null && minSize !== undefined;
    const hasMax = maxSize !== null && maxSize !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check for predefined ranges with translation keys
    if (sizeRangeId && sizeRangeId !== "custom") {
      // Convert "extra-large" to "extraLarge" for translation keys
      const translationKey = sizeRangeId === "extra-large" ? "extraLarge" : sizeRangeId;
      return t(`filters.modals.size.presets.${translationKey}`);
    }

    // Custom formatting with translations
    if (hasMin && hasMax) {
      return t("filters.buttons.size_range", { min: minSize, max: maxSize });
    } else if (hasMin) {
      return t("filters.buttons.size_min", { min: minSize });
    } else if (hasMax) {
      return t("filters.buttons.size_max", { max: maxSize });
    }

    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get serialized date/time values for URL parameters  
    const dateTimeValues = getSerializedValues();
    
    // Get serialized price values for URL parameters
    const priceValues = getPriceSerializedValues();
    
    // Get serialized attendees values for URL parameters
    const attendeesValues = getAttendeesSerializedValues();
    
    // Get serialized size values for URL parameters
    const sizeValues = getSizeSerializedValues();
    
    if (onSearch) {
      // Custom handler provided - include date/time, price, attendees, and size values
      onSearch({ 
        when: getFormattedDateTime(),
        dates: dateTimeValues.dates,
        startTime: dateTimeValues.startTime,
        endTime: dateTimeValues.endTime,
        price: getFormattedPriceRange(), 
        priceMin: priceValues.minPrice,
        priceMax: priceValues.maxPrice,
        priceCurrency: priceValues.currency,
        attendees: getFormattedAttendeesRange(),
        attendeesMin: attendeesValues.minAttendees,
        attendeesMax: attendeesValues.maxAttendees,
        size: getFormattedSizeRange(),
        sizeMin: sizeValues.minSize,
        sizeMax: sizeValues.maxSize
      });
    } else {
      // Default navigation behavior with date/time, price, attendees, and size parameters
      const params = new URLSearchParams();
      if (dateTimeValues.dates) params.set('dates', dateTimeValues.dates);
      if (dateTimeValues.startTime) params.set('startTime', dateTimeValues.startTime);
      if (dateTimeValues.endTime) params.set('endTime', dateTimeValues.endTime);
      if (priceValues.minPrice !== null) params.set('priceMin', priceValues.minPrice);
      if (priceValues.maxPrice !== null) params.set('priceMax', priceValues.maxPrice);
      if (priceValues.currency) params.set('currency', priceValues.currency);
      if (attendeesValues.minAttendees !== null) params.set('attendeesMin', attendeesValues.minAttendees);
      if (attendeesValues.maxAttendees !== null) params.set('attendeesMax', attendeesValues.maxAttendees);
      if (sizeValues.minSize !== null) params.set('minSize', sizeValues.minSize);
      if (sizeValues.maxSize !== null) params.set('maxSize', sizeValues.maxSize);
      if (sizeValues.sizeRange) params.set('sizeRange', sizeValues.sizeRange);
      
      navigate(`/places?${params.toString()}`);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto mt-20 ${className}`}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row bg-white">
          {/* When? - Date/Time Filter Button */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("form.when")}
            </label>
            <button
              type="button"
              onClick={() => setIsDateTimeModalOpen(true)}
              className={`w-full text-left text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0 hover:text-brand-purple transition-colors truncate ${
                hasActiveDateTimeFilter ? 'text-orange-500' : 'text-gray-400'
              }`}
              aria-label={t("form.aria_labels.select_dates")}
            >
              {getFormattedDateTime() || t("form.placeholders.when")}
            </button>
          </div>

          {/* Price - Price Filter Button */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("form.price")}
            </label>
            <button
              type="button"
              onClick={() => setIsPriceModalOpen(true)}
              className={`w-full text-left text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0 hover:text-brand-purple transition-colors truncate ${
                hasActivePriceFilter ? 'text-orange-500' : 'text-gray-400'
              }`}
              aria-label={t("form.aria_labels.select_price")}
            >
              {getFormattedPriceRange() || t("form.placeholders.price")}
            </button>
          </div>

          {/* Attendees - Attendees Filter Button */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("form.attendees")}
            </label>
            <button
              type="button"
              onClick={() => setIsAttendeesModalOpen(true)}
              className={`w-full text-left text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0 hover:text-brand-purple transition-colors truncate ${
                hasActiveAttendeesFilter ? 'text-orange-500' : 'text-gray-400'
              }`}
              aria-label={t("form.aria_labels.select_attendees")}
            >
              {getFormattedAttendeesRange() || t("form.placeholders.attendees")}
            </button>
          </div>

          {/* Size - Size Filter Button */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("form.size")}
            </label>
            <button
              type="button"
              onClick={() => setIsSizeModalOpen(true)}
              className={`w-full text-left text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0 hover:text-brand-purple transition-colors truncate ${
                hasActiveSizeFilter ? 'text-orange-500' : 'text-gray-400'
              }`}
              aria-label={t("form.aria_labels.select_size")}
            >
              {getFormattedSizeRange() || t("form.placeholders.size")}
            </button>
          </div>

          {/* Search Button */}
          <div className="px-4 py-3 lg:px-3 lg:py-2.5 flex items-center justify-center bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <button
              type="submit"
              className="w-full lg:w-auto bg-black hover:bg-gray-800 text-white px-5 lg:px-5 py-2 sm:py-2 lg:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center space-x-2 shadow-md"
              aria-label={t("form.aria_labels.search")}
            >
              <span>{t("form.search")}</span>
              <svg 
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 8l4 4m0 0l-4 4m4-4H3" 
                />
              </svg>
            </button>
          </div>
        </div>
      </form>
      
      {/* Date/Time Filter Modal */}
      <DateTimeFilterModal
        isOpen={isDateTimeModalOpen}
        onClose={() => setIsDateTimeModalOpen(false)}
      />
      
      {/* Price Filter Modal */}
      <PriceFilterModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
      />
      
      {/* Attendees Filter Modal */}
      <AttendeesFilterModal
        isOpen={isAttendeesModalOpen}
        onClose={() => setIsAttendeesModalOpen(false)}
      />
      
      {/* Size Filter Modal */}
      <SizeFilterModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
      />
    </div>
  );
}
