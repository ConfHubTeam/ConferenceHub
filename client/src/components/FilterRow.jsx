export default function FilterRow({ 
  isMapVisible, 
  toggleMap, 
  showMobileMap, 
  isMobileMapView 
}) {
  return (
    <div className="w-full px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      {/* Mobile: Single row with resizing */}
      <div className="flex md:hidden">
        <div className="flex items-center justify-between w-full min-w-0">
          {/* Left side - Filters that resize */}
          <div className="flex items-center space-x-1 min-w-0 flex-1 mr-2">
            <button className="flex px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full text-xs flex-shrink-0">
              When
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full text-xs flex-shrink-0">
              Filter
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Right side - Map toggle */}
          {!isMobileMapView && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                showMobileMap();
              }}
              className="flex px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full text-xs flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </button>
          )}
        </div>
      </div>

      {/* Desktop: Single row */}
      <div className="hidden md:flex items-center justify-between w-full min-w-0">
        {/* Left side - Filters aligned to the left */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Filter buttons */}
          <div className="flex items-center space-x-2">
            <button className="flex px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full">
              When
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full">
              Price
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full">
              Attendees
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full">
              Filters
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Right side - Map toggle button aligned to the right */}
        <div className="flex items-center flex-shrink-0">
          {!isMobileMapView && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                toggleMap();
              }}
              className="flex px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 items-center transition-all duration-200 border border-gray-300 hover:border-gray-400 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {isMapVisible ? "Hide map" : "Show map"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
