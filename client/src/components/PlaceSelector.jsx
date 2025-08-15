import { useState, useEffect, useRef, useContext } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "./UserContext";
import api from "../utils/api";

/**
 * PlaceSelector Component
 * 
 * Allows hosts to select from their own places and agents to select from all places
 * Used in Calendar page for place-specific calendar management
 * Features search functionality for agents with many places
 */
export default function PlaceSelector({ selectedPlace, onPlaceSelect, compact = false }) {
  const { t } = useTranslation(["places", "common"]);
  const { user } = useContext(UserContext);
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch places on component mount
  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true);
      try {
        let response;
        
        if (user?.userType === 'host') {
          // Hosts see only their own places
          response = await api.get("/places/user-places");
          setPlaces(response.data || []);
          setFilteredPlaces(response.data || []);
        } else if (user?.userType === 'agent') {
          // Agents see all places with owner information
          response = await api.get("/places");
          // Handle both old format (direct array) and new format (with pagination)
          const placesData = response.data.places || response.data || [];
          setPlaces(placesData);
          setFilteredPlaces(placesData);
        } else {
          setPlaces([]);
          setFilteredPlaces([]);
        }
      } catch (error) {
        console.error("Error fetching places:", error);
        setPlaces([]);
        setFilteredPlaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (user.userType === 'host' || user.userType === 'agent')) {
      fetchPlaces();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Filter places based on search term (for agents with many places)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPlaces(places);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = places.filter(place => {
      const titleMatch = place.title?.toLowerCase().includes(term);
      const addressMatch = place.address?.toLowerCase().includes(term);
      const ownerMatch = user?.userType === 'agent' && place.owner?.name?.toLowerCase().includes(term);
      
      return titleMatch || addressMatch || ownerMatch;
    });
    
    setFilteredPlaces(filtered);
  }, [searchTerm, places, user?.userType]);

  // Auto-select first place if none selected and places are loaded
  useEffect(() => {
    if (!selectedPlace && filteredPlaces.length > 0 && !isLoading) {
      onPlaceSelect(filteredPlaces[0]);
    }
  }, [filteredPlaces, selectedPlace, isLoading, onPlaceSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    }
    
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens (for agents)
  useEffect(() => {
    if (isOpen && user?.userType === 'agent' && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, user?.userType]);

  const handleSelect = (place) => {
    onPlaceSelect(place);
    setIsOpen(false);
    setSearchTerm(""); // Clear search after selection
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      setSearchTerm(""); // Clear search when opening
    }
    setIsOpen(!isOpen);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Format place display text
  const formatPlaceDisplay = (place) => {
    if (user?.userType === 'agent' && place.owner) {
      return `${place.title} (${place.owner.name})`;
    }
    return place.title;
  };

  const formatPlaceAddress = (place) => {
    return place.address;
  };

  return (
    <div className={`relative ${compact ? 'w-full' : 'w-full max-w-md'}`} ref={dropdownRef} id="place-selector">
      {/* Place selector button */}
      <div 
        className={`border rounded-xl p-3 cursor-pointer bg-white hover:border-gray-400 transition-colors ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'
        }`}
        onClick={toggleDropdown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        {selectedPlace ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 21V9.75m0 0V6.75a.75.75 0 01.75-.75h3.75M6.75 9.75V21m-2.25 0h5.25m13.5-18v18m-2.25 0H21m-3.75 0V6.75a.75.75 0 00-.75-.75h-3.75M21 21V9.75m0 0V6.75a.75.75 0 00-.75-.75h-3.75M6.75 6.75V9.75m13.5 0V6.75" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate" title={formatPlaceDisplay(selectedPlace)}>
                  {formatPlaceDisplay(selectedPlace)}
                </div>
                <div className="text-sm text-gray-500 truncate" title={formatPlaceAddress(selectedPlace)}>
                  {formatPlaceAddress(selectedPlace)}
                </div>
              </div>
            </div>
            <span className={`transition-transform duration-200 ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" 
                   className="h-5 w-5" fill="none" 
                   viewBox="0 0 24 24" stroke="currentColor"
                   style={{ opacity: 0.7 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 21V9.75m0 0V6.75a.75.75 0 01.75-.75h3.75M6.75 9.75V21m-2.25 0h5.25m13.5-18v18m-2.25 0H21m-3.75 0V6.75a.75.75 0 00-.75-.75h-3.75M21 21V9.75m0 0V6.75a.75.75 0 00-.75-.75h-3.75M6.75 6.75V9.75m13.5 0V6.75" />
                </svg>
              </div>
              <span>{t("calendar.selectPlace", "Select a place...")}</span>
            </div>
            <span className={`transition-transform duration-200 ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" 
                   className="h-5 w-5" fill="none" 
                   viewBox="0 0 24 24" stroke="currentColor"
                   style={{ opacity: 0.7 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        )}
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div 
          id="place-listbox"
          role="listbox"
          className={`absolute z-[65] mt-1 w-full bg-white border rounded-md shadow-lg max-h-80 overflow-hidden`}
          style={{ 
            borderRadius: "0.75rem"
          }}
        >
          {/* Search input for agents */}
          {user?.userType === 'agent' && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={t("calendar.searchPlaces", "Search places by name, address, or owner...")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 hover:text-gray-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                {t("common.loading", "Loading...")}
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? (
                  <div>
                    <p className="font-medium mb-1">{t("calendar.noSearchResults", "No places found")}</p>
                    <p className="text-sm">{t("calendar.tryDifferentSearch", "Try a different search term")}</p>
                  </div>
                ) : (
                  user?.userType === 'host' 
                    ? t("calendar.noPlaces", "No places found. Create your first listing to get started.")
                    : t("calendar.noPlacesAgent", "No places found in the system.")
                )}
              </div>
            ) : (
              <>
                {/* Show search results count for agents */}
                {user?.userType === 'agent' && searchTerm && (
                  <div className="px-3 py-2 text-xs text-gray-500 bg-blue-50 border-b border-blue-100">
                    {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'} found
                  </div>
                )}
                
                {filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    role="option"
                    aria-selected={selectedPlace?.id === place.id}
                    className={`p-3 hover:bg-gray-100 cursor-pointer flex items-center transition-colors ${
                      selectedPlace && selectedPlace.id === place.id ? 'bg-blue-50 font-medium border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => handleSelect(place)}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 21V9.75m0 0V6.75a.75.75 0 01.75-.75h3.75M6.75 9.75V21m-2.25 0h5.25m13.5-18v18m-2.25 0H21m-3.75 0V6.75a.75.75 0 00-.75-.75h-3.75M21 21V9.75m0 0V6.75a.75.75 0 00-.75-.75h-3.75M6.75 6.75V9.75m13.5 0V6.75" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate" title={formatPlaceDisplay(place)}>
                        {/* Highlight search terms */}
                        {searchTerm && user?.userType === 'agent' ? (
                          <span dangerouslySetInnerHTML={{
                            __html: formatPlaceDisplay(place).replace(
                              new RegExp(`(${searchTerm})`, 'gi'),
                              '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                            )
                          }} />
                        ) : (
                          formatPlaceDisplay(place)
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate" title={formatPlaceAddress(place)}>
                        {/* Highlight search terms in address */}
                        {searchTerm && user?.userType === 'agent' ? (
                          <span dangerouslySetInnerHTML={{
                            __html: formatPlaceAddress(place).replace(
                              new RegExp(`(${searchTerm})`, 'gi'),
                              '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                            )
                          }} />
                        ) : (
                          formatPlaceAddress(place)
                        )}
                      </div>
                      {/* Show owner name for agents with highlighting */}
                      {user?.userType === 'agent' && place.owner && (
                        <div className="text-xs text-gray-400 truncate mt-1">
                          {t("calendar.ownedBy", "Owner")}: {" "}
                          {searchTerm ? (
                            <span dangerouslySetInnerHTML={{
                              __html: place.owner.name.replace(
                                new RegExp(`(${searchTerm})`, 'gi'),
                                '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                              )
                            }} />
                          ) : (
                            place.owner.name
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
