import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate } from "react-router-dom";
import List from "../components/List";
import CloudinaryImage from "../components/CloudinaryImage";
import PriceDisplay from "../components/PriceDisplay";

export default function AllPlacesPage() {
  const { user } = useContext(UserContext);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all places for agent
  useEffect(() => {
    if (user?.userType === 'agent') {
      setLoading(true);
      api.get('/places')
        .then(({data}) => {
          setPlaces(data);
          setFilteredPlaces(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching places:', err);
          setLoading(false);
        });
    }
  }, [user]);

  // Redirect non-agents away from this page
  if (user && user.userType !== 'agent') {
    return <Navigate to="/account" />;
  }

  // Filter places by search term
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = places.filter(place => 
        place.title.toLowerCase().includes(term) || 
        place.address.toLowerCase().includes(term) ||
        (place.owner && place.owner.name.toLowerCase().includes(term))
      );
      setFilteredPlaces(filtered);
    } else {
      setFilteredPlaces(places);
    }
  }, [searchTerm, places]);

  // Show loading state
  if (loading) {
    return (
      <div>
        <AccountNav />
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold mb-4">All Conference Rooms</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav />
      <div className="px-8">
        <h1 className="text-2xl font-bold mb-4">All Conference Rooms</h1>
        
        {/* Search control */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full">
              <input
                type="text"
                placeholder="Search by title, address, or host name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
        
        {/* Places listing */}
        {filteredPlaces.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500">No conference rooms found</p>
          </div>
        ) : (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlaces.map(place => (
                <div key={place.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <a href={`/place/${place.id}`} className="block">
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      {place.photos?.[0] && (
                        <CloudinaryImage
                          photo={place.photos[0]}
                          alt={place.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1 truncate">{place.title}</h3>
                      <p className="text-sm text-gray-500 mb-2 truncate">{place.address}</p>
                      
                      {place.owner && (
                        <div className="flex items-center mt-2 pt-2 border-t">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Host: {place.owner.name}
                          </span>
                          <span className="ml-auto text-sm text-primary font-semibold">
                            <PriceDisplay 
                              price={place.price} 
                              currency={place.currency}
                              suffix="/hour"
                              priceClassName="text-sm"
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}