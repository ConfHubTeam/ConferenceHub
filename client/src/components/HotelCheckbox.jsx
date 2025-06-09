import { useState } from "react";

const HotelCheckbox = ({ isHotel, setIsHotel }) => {
  const toggleHotel = () => {
    setIsHotel(!isHotel);
  };

  return (
    <div className="w-full">
      <label htmlFor="hotel-toggle" className="block mb-1 text-sm font-medium text-gray-700">
        Is this Hotel ?
      </label>
      
      <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <button 
            type="button"
            id="hotel-toggle"
            onClick={toggleHotel}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${isHotel ? 'bg-primary' : 'bg-gray-300'} border border-gray-200 shadow-inner`}
            aria-pressed={isHotel}
            role="switch"
          >
            <span className="sr-only">Toggle Hotel Mode</span>
            <span 
              className={`absolute inline-block h-4 w-4 transform rounded-full bg-white border border-gray-100 shadow transition-transform duration-200 ease-in-out ${isHotel ? 'translate-x-[19px]' : 'translate-x-[3px]'}`}
            />
          </button>
          
          <span className="text-sm font-medium min-w-[30px] ml-2">
            {isHotel ? 
              <span className="text-primary font-semibold">Yes</span> : 
              <span className="text-gray-500">No</span>
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default HotelCheckbox;
