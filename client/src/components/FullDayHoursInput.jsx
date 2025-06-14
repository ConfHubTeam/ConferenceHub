import { useState } from "react";

export default function FullDayHoursInput({ fullDayHours, setFullDayHours }) {
  const [isOpen, setIsOpen] = useState(false);
  const options = Array.from({ length: 24 }, (_, i) => i + 1);
  
  // Format the display value
  const formatDisplayValue = (hours) => {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  // Handle option selection
  const handleSelect = (hours) => {
    setFullDayHours(hours);
    setIsOpen(false);
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentIndex = options.indexOf(fullDayHours);
      const nextIndex = (currentIndex + 1) % options.length;
      setFullDayHours(options[nextIndex]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = options.indexOf(fullDayHours);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      setFullDayHours(options[prevIndex]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="fullDayHours" className="block mb-2 text-sm font-medium text-gray-700">
        Full day considered
      </label>
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="w-full border py-2 px-3 rounded-xl text-base flex justify-between items-center cursor-pointer bg-white h-[42px]"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby="fullDayHours"
          tabIndex="0"
        >
          <span>{formatDisplayValue(fullDayHours)}</span>
          <div className="pointer-events-none">
            <svg 
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>

        {isOpen && (
          <ul
            className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border"
            tabIndex="-1"
            role="listbox"
            aria-labelledby="fullDayHours"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((hours) => (
              <li
                key={hours}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${fullDayHours === hours ? 'bg-blue-100 font-medium text-blue-800' : ''}`}
                onClick={() => handleSelect(hours)}
                role="option"
                aria-selected={fullDayHours === hours}
              >
                <span>{formatDisplayValue(hours)}</span>
                {fullDayHours === hours && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
