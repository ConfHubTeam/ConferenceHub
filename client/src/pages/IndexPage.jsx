import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CloudinaryImage from "../components/CloudinaryImage";
import MapView from "../components/MapView";
import api from "../utils/api";

export default function IndexPage() {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "map"
  const [isMapVisible, setIsMapVisible] = useState(true); // Default to true for desktop view
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  const location = useLocation();
  
  useEffect(() => {
    setIsLoading(true);
    // Get URL params if any
    const params = new URLSearchParams(location.search);
    
    // Using our API utility instead of direct axios import
    api.get("/home" + (location.search ? location.search : "")).then((response) => {
      setPlaces(response.data);
      setFilteredPlaces(response.data);
      setIsLoading(false);
    });
  }, [location.search]);

  // Format price display for better readability
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Toggle map visibility function
  const toggleMap = () => {
    setIsMapVisible(!isMapVisible);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-166px)]">
      {/* View toggle buttons */}
      <div className="flex justify-center items-center my-4 gap-2">
        {/* Mobile-only view toggle buttons */}
        <button 
          onClick={() => setViewMode("grid")}
          className={`md:hidden px-4 py-2 rounded-full flex items-center transition ${
            viewMode === "grid" 
            ? "bg-primary text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2-2v-2z" />
          </svg>
          List View
        </button>
        <button 
          onClick={() => setViewMode("map")}
          className={`md:hidden px-4 py-2 rounded-full flex items-center transition ${
            viewMode === "map" 
            ? "bg-primary text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Map View
        </button>
        
        {/* Desktop-only map toggle button */}
        <button 
          onClick={toggleMap}
          className={`hidden md:flex px-4 py-2 rounded-full items-center transition ${
            isMapVisible 
            ? "bg-primary text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {isMapVisible ? "Hide Map" : "Show Map"}
        </button>
      </div>

      {/* Main content */}
      {viewMode === "grid" ? (
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Listings section - takes full width on mobile, 55% or 100% on desktop based on map visibility */}
          <div 
            className={`px-4 md:px-8 py-4 overflow-y-auto transition-all duration-300 ease-in-out ${
              isMapVisible ? "md:w-[55%] md:pr-2" : "w-full"
            }`}
          >
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center my-12">
                <h3 className="text-xl font-bold text-gray-700">No results found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your filters to find more options</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredPlaces.map((place) => (
                  <Link key={place.id} to={"/place/" + place.id}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-md transition-shadow">
                      <div className="aspect-square overflow-hidden">
                        {place.photos?.length > 0 && (
                          <CloudinaryImage
                            photo={place.photos[0]}
                            alt={place.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <h2 className="font-bold text-sm truncate">{place.address}</h2>
                        <h3 className="text-gray-500 text-sm truncate">{place.title}</h3>
                        {place.startDate && place.endDate && (
                          <p className="text-gray-500 text-xs">
                            {new Date(place.startDate).getDate()} {months[new Date(place.startDate).getMonth()]}
                            {" - "}{new Date(place.endDate).getDate()} {months[new Date(place.endDate).getMonth()]}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <p className="font-bold text-primary text-sm">{formatPrice(place.price)}<span className="text-gray-500 font-normal text-xs"> / hour</span></p>
                          {place.type && (
                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{place.type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Map section - hidden on mobile, 45% width on desktop when visible, with rounded corners */}
          <div className={`hidden md:block md:w-[45%] h-full transition-all duration-300 ease-in-out ${
            isMapVisible ? "opacity-100 max-w-[45%]" : "opacity-0 max-w-0"
          }`}>
            <div className="h-full w-full rounded-l-2xl overflow-hidden shadow-lg">
              <MapView places={filteredPlaces} />
            </div>
          </div>
        </div>
      ) : (
        // Full map view (when viewMode is "map")
        <div className="h-full px-4 md:px-8 py-4">
          <div className="h-full relative rounded-2xl overflow-hidden shadow-lg">
            <MapView places={filteredPlaces} />
          </div>
        </div>
      )}
    </div>
  );
}
