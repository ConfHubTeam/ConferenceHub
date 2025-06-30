import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable Search Filter Component
 * Follows DRY principle - can be used across multiple pages
 * Enhanced styling to match screenshot requirements
 */
export default function SearchFilter({ 
  onSearch, 
  className = "",
  placeholder = {
    when: "Anytime",
    attendance: "Number of attendees",
    size: "Conference size"
  },
  initialValues = {
    when: "Anytime",
    attendance: "Any number of people",
    size: "Any square meters"
  }
}) {
  const [when, setWhen] = useState(initialValues.when);
  const [attendance, setAttendance] = useState(initialValues.attendance);
  const [size, setSize] = useState(initialValues.size);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (onSearch) {
      // Custom handler provided
      onSearch({ when, attendance, size });
    } else {
      // Default navigation behavior
      navigate(`/places?when=${encodeURIComponent(when)}&attendance=${encodeURIComponent(attendance)}&size=${encodeURIComponent(size)}`);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto mt-20 ${className}`}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row bg-white">
          {/* When? */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              When?
            </label>
            <input
              type="text"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder={placeholder.when}
              className="w-full text-gray-900 placeholder-gray-500 text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0"
              aria-label="When?"
            />
          </div>

          {/* Attendance */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Attendance
            </label>
            <input
              type="text"
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              placeholder={placeholder.attendance}
              className="w-full text-gray-900 placeholder-gray-500 text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0"
              aria-label="Attendance"
            />
          </div>

          {/* Size */}
          <div className="flex-1 px-4 sm:px-4 lg:px-5 py-2 sm:py-2 lg:py-2.5 hover:bg-gray-50 transition-colors duration-200 bg-white border-t lg:border-t-0 lg:border-l border-gray-100">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Conference Size
            </label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder={placeholder.size}
              className="w-full text-gray-900 placeholder-gray-500 text-sm sm:text-base lg:text-lg bg-transparent outline-none focus:ring-0 border-0 font-medium pt-0 pl-0"
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
    </div>
  );
}
