import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CloudinaryImage from "../components/CloudinaryImage";
import api from "../utils/api";

export default function IndexPage() {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className="px-4 md:px-14 py-4">      
      {/* Results section */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <div className="p-4">
                  <h2 className="font-bold truncate">{place.address}</h2>
                  <h3 className="text-gray-500 truncate">{place.title}</h3>
                  {place.startDate && place.endDate && (
                    <p className="text-gray-500">
                      {new Date(place.startDate).getDate()} {months[new Date(place.startDate).getMonth()]}
                      {" - "}{new Date(place.endDate).getDate()} {months[new Date(place.endDate).getMonth()]}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-bold text-primary">{formatPrice(place.price)}<span className="text-gray-500 font-normal"> / hour</span></p>
                    {place.type && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{place.type}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
