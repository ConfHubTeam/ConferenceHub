import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useAttendeesFilter } from "../contexts/AttendeesFilterContext";
import DateTimeFilterModal from "./DateTimeFilterModal";
import PriceFilterModal from "./PriceFilterModal";
import AttendeesFilterModal from "./AttendeesFilterModal";

/**
 * Reusable Search Filter Component
 * Follows DRY principle - can be used across multiple pages
 * Enhanced styling to match screenshot requirements
 * Integrated with DateTimeFilterModal for date/time selection
 */
export default function SearchFilter({ 
  onSearch, 
  className = "",
  placeholder = {
    when: "Anytime",
    price: "Any price",
    attendees: "Number of attendees",
    size: "Conference size"
  },
  initialValues = {
    when: "Anytime",
    price: "Any price",
    attendees: "",
    size: ""
  }
}) {
  const [size, setSize] = useState(initialValues.size);
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Use the DateTimeFilter context for date/time state
  const { getFormattedDateTime, getSerializedValues } = useDateTimeFilter();
  
  // Use the PriceFilter context for price state
  const { getFormattedPriceRange, getSerializedValues: getPriceSerializedValues } = usePriceFilter();
  
  // Use the AttendeesFilter context for attendees state
  const { getFormattedAttendeesRange, getSerializedValues: getAttendeesSerializedValues } = useAttendeesFilter();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get serialized date/time values for URL parameters  
    const dateTimeValues = getSerializedValues();
    
    // Get serialized price values for URL parameters
    const priceValues = getPriceSerializedValues();
    
    // Get serialized attendees values for URL parameters
    const attendeesValues = getAttendeesSerializedValues();
    
    if (onSearch) {
      // Custom handler provided - include date/time, price, and attendees values
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
        size 
      });
    } else {
      // Default navigation behavior with date/time, price, and attendees parameters
      const params = new URLSearchParams();
      if (dateTimeValues.dates) params.set('dates', dateTimeValues.dates);
      if (dateTimeValues.startTime) params.set('startTime', dateTimeValues.startTime);
      if (dateTimeValues.endTime) params.set('endTime', dateTimeValues.endTime);
      if (priceValues.minPrice !== null) params.set('priceMin', priceValues.minPrice);
      if (priceValues.maxPrice !== null) params.set('priceMax', priceValues.maxPrice);
      if (priceValues.currency) params.set('currency', priceValues.currency);
      if (attendeesValues.minAttendees !== null) params.set('attendeesMin', attendeesValues.minAttendees);
      if (attendeesValues.maxAttendees !== null) params.set('attendeesMax', attendeesValues.maxAttendees);
      if (size) params.set('size', size);
      
      navigate(`/places?${params.toString()}`);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto mt-20 ${className}`}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row bg-white">
          {/* When? - Date/Time Filter Button */}
          <div className="flex-2 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              When?
            </label>
            <button
              type="button"
              onClick={() => setIsDateTimeModalOpen(true)}
              className="w-full text-left text-gray-900 text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0 hover:text-brand-purple transition-colors"
              aria-label="Select dates and times"
            >
              {getFormattedDateTime() || placeholder.when}
            </button>
          </div>

          {/* Price - Price Filter Button */}
          <div className="flex-2 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Price
            </label>
            <button
              type="button"
              onClick={() => setIsPriceModalOpen(true)}
              className="w-full text-left text-gray-900 text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0 hover:text-brand-purple transition-colors"
              aria-label="Select price range"
            >
              {getFormattedPriceRange() || placeholder.price}
            </button>
          </div>

          {/* Attendees - Attendees Filter Button */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Attendees
            </label>
            <button
              type="button"
              onClick={() => setIsAttendeesModalOpen(true)}
              className="w-full text-left text-gray-900 text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0 hover:text-brand-purple transition-colors"
              aria-label="Select attendees range"
            >
              {getFormattedAttendeesRange() || placeholder.attendees}
            </button>
          </div>

          {/* Size */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Size
            </label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder={placeholder.size}
              className="w-full text-gray-900 placeholder-gray-400 text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0"
              aria-label="Size"
            />
          </div>

          {/* Search Button */}
          <div className="px-4 py-3 lg:px-3 lg:py-2.5 flex items-center justify-center bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <button
              type="submit"
              className="w-full lg:w-auto bg-black hover:bg-gray-800 text-white px-5 lg:px-5 py-2 sm:py-2 lg:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center space-x-2 shadow-md"
              aria-label="Search"
            >
              <span>Search</span>
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
    </div>
  );
}
