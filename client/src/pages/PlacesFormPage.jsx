import { useContext, useEffect, useState } from "react";
import PerkSelections from "./PerkSelections";
import PhotoUploader from "../components/PhotoUploader";
import { Navigate, useParams } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import api from "../utils/api";
import { geocodeAddress } from "../utils/formUtils";
import MapPicker from "../components/MapPicker";
import Calendar from "../components/Calendar";
import { format, parseISO } from "date-fns";

// Helper function to validate and convert YouTube URL to embed format
function extractYouTubeVideoId(url) {
  if (!url || url.trim() === "") return "";
  
  // Regular expression patterns for different YouTube URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,     // Regular URL format: youtube.com/watch?v=ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,       // Embed URL format: youtube.com/embed/ID
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,                 // Shortened URL format: youtu.be/ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^/?]+)/i       // Shorts URL format: youtube.com/shorts/ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return the URL in embed format
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return "";  // Return empty string if invalid YouTube URL
}

export default function PlacesFormPage() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState([]);
  const [extraInfo, setExtraInfo] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [geocodingSuccess, setGeocodingSuccess] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState("");
  
  // New state variables for time slot management
  const [blockedWeekdays, setBlockedWeekdays] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [showBlockSpecificDates, setShowBlockSpecificDates] = useState(false);
  const [weekdayTimeSlots, setWeekdayTimeSlots] = useState({
    0: { start: "", end: "" }, // Sunday
    1: { start: "", end: "" }, // Monday
    2: { start: "", end: "" }, // Tuesday
    3: { start: "", end: "" }, // Wednesday
    4: { start: "", end: "" }, // Thursday
    5: { start: "", end: "" }, // Friday
    6: { start: "", end: "" }  // Saturday
  });

  // Redirect if user is not a host
  if (user && user.userType !== 'host') {
    return <Navigate to="/" />;
  }

  useEffect(() => { // display data entered before by user 
    if (!id) {
      return;
    } else {
      api.get("/places/" + id).then((response) => {
        const { data } = response;
        console.log("Loaded photos from database:", data.photos);
        setTitle(data.title);
        setAddress(data.address);
        setDescription(data.description);
        setAddedPhotos(data.photos);
        setPerks(data.perks);
        setExtraInfo(data.extraInfo);
        setPrice(data.price);
        setMaxGuests(data.maxGuests);
        setYoutubeLink(data.youtubeLink || "");
        // Format dates properly if they exist
        if (data.startDate) setStartDate(data.startDate.split("T")[0]);
        if (data.endDate) setEndDate(data.endDate.split("T")[0]);
        // Load coordinates
        setLat(data.lat || "");
        setLng(data.lng || "");
        // Show map if coordinates exist
        if (data.lat && data.lng) {
          setShowMap(true);
        }
        
        // Load time slot data if available
        if (data.blockedWeekdays) {
          setBlockedWeekdays(data.blockedWeekdays);
        }
        if (data.blockedDates) {
          setBlockedDates(data.blockedDates);
          setShowBlockSpecificDates(data.blockedDates.length > 0);
        }
        if (data.weekdayTimeSlots) {
          setWeekdayTimeSlots(data.weekdayTimeSlots);
        }
      });
    }
  }, [id]); // reactive values referenced inside of the above setup code

  // Geocode address when it changes (with debounce)
  useEffect(() => {
    // Skip geocoding if address is empty or too short
    if (!address || address.length < 5) {
      setGeocodingSuccess(null);
      return;
    }

    // Set a timer to geocode the address after the user stops typing
    const timer = setTimeout(() => {
      handleGeocodeAddress();
    }, 1000); // Wait 1 second after typing stops

    return () => clearTimeout(timer); // Clean up the timer
  }, [address]);

  // Function to geocode the address
  async function handleGeocodeAddress() {
    setIsGeocodingAddress(true);
    setGeocodingSuccess(null);
    
    try {
      const coordinates = await geocodeAddress(address);
      
      if (coordinates) {
        setLat(coordinates.lat);
        setLng(coordinates.lng);
        setGeocodingSuccess(true);
        setShowMap(true);
      } else {
        setGeocodingSuccess(false);
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      setGeocodingSuccess(false);
    } finally {
      setIsGeocodingAddress(false);
    }
  }

  // Handle map location selection
  function handleLocationSelect(location) {
    if (location && (lat !== location.lat || lng !== location.lng)) {
      setLat(location.lat);
      setLng(location.lng);
    }
  }

  // Handle address update from map
  function handleAddressUpdate(newAddress) {
    if (newAddress && newAddress !== address) {
      setAddress(newAddress);
      setGeocodingSuccess(true);
    }
  }

  function preInput(header, description) {
    return (
      <div>
        {inputHeader(header)}
        {inputDescription(description)}
      </div>
    );
  }

  function inputHeader(text) {
    return <h2 className="text-xl md:text-2xl mt-4">{text}</h2>;
  }

  function inputDescription(text) {
    return <p className="text-gray-500 text-sm">{text}</p>;
  }

  async function savePlace(event) {
    event.preventDefault();
    setError("");

    // Validate required fields
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!address.trim()) {
      setError("Address is required");
      return;
    }

    // Validate dates if both are provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be later than Start date");
      return;
    }

    // Ensure numeric fields are valid
    const numGuests = parseInt(maxGuests) || 1;
    const numPrice = parseFloat(price) || 0;

    // Validate and clean YouTube link
    const cleanedYouTubeLink = extractYouTubeVideoId(youtubeLink);
    if (youtubeLink && !cleanedYouTubeLink) {
      setError("Invalid YouTube URL");
      return;
    }
    
    console.log("Photos before saving:", addedPhotos);
    
    // Try geocoding the address one last time if we don't have coordinates
    let coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };
    if ((!lat || !lng) && address) {
      try {
        const result = await geocodeAddress(address);
        if (result) {
          coordinates = result;
        }
      } catch (error) {
        console.error("Last attempt geocoding failed:", error);
      }
    }
    
    // No need to format photos extensively - just ensure we send the complete object
    // The backend will handle the proper extraction of URLs
    const placeData = {
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      // checkIn and checkOut removed as the UI elements were removed
      maxGuests: numGuests,
      price: numPrice,
      startDate: startDate || null,
      endDate: endDate || null,
      youtubeLink: cleanedYouTubeLink,
      lat: coordinates.lat,
      lng: coordinates.lng,
      // Include time slot management data
      blockedWeekdays,
      blockedDates: blockedDates.filter(date => date !== ""), // Remove empty strings
      weekdayTimeSlots
    };

    try {
      let response;
      
      if (id) {
        //update
        response = await api.put("/places", {
          id,
          ...placeData,
        });
      } else {
        //create a new place
        response = await api.post("/places", placeData);
      }
      
      console.log("Response after saving:", response.data);
      setRedirect(true);
    } catch (error) {
      console.error("Submission error:", error.response?.data || error);
      setError(error.response?.data?.error || "Submit failed, please try again later.");
    }
  }

  if (redirect) {
    return <Navigate to="/account/user-places" />;
  }

  // Handler for toggling a specific date's blocked status
  function toggleBlockedDate(date) {
    console.log("Toggling date:", date, "Current blocked dates:", blockedDates);
    
    // Check if date is already in the blockedDates array
    // Using exact string comparison for reliability
    const isBlocked = blockedDates.includes(date);
    
    if (isBlocked) {
      // Date is already blocked, so unblock it
      console.log("Unblocking date:", date);
      setBlockedDates(prev => prev.filter(d => d !== date));
    } else {
      // Date is not blocked, block it
      console.log("Blocking date:", date);
      setBlockedDates(prev => [...prev, date]);
    }
  }

  // Handler for toggling a weekday's blocked status
  function toggleBlockedWeekday(dayIndex) {
    if (blockedWeekdays.includes(dayIndex)) {
      setBlockedWeekdays(prev => prev.filter(d => d !== dayIndex));
    } else {
      setBlockedWeekdays(prev => [...prev, dayIndex]);
    }
  }

  // Helper for updating time slots for a specific weekday
  function updateWeekdayTimeSlot(dayIndex, field, value) {
    setWeekdayTimeSlots(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value
      }
    }));
  }

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={savePlace} className="px-4 md:px-8 lg:px-14">
        {error && (
          <div className="bg-red-100 text-red-800 p-4 mb-4 rounded-lg">
            {error}
          </div>
        )}
        
        {preInput(
          "Title",
          "title for your conference room. It's better to have a short and catchy title."
        )}
        <input
          type="text"
          placeholder="title, for example: Executive Conference Room"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
        />
        
        {preInput("Address", "address of this conference room. You can enter it manually or pin on the map.")}
        <div className="relative">
          <input
            type="text"
            placeholder="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={`w-full border my-2 py-2 px-3 rounded-2xl ${
              geocodingSuccess === false ? 'border-red-500' : 
              geocodingSuccess === true ? 'border-green-500' : ''
            }`}
          />
          {isGeocodingAddress && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          {geocodingSuccess === true && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {geocodingSuccess === false && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 items-center mt-1 mb-4">
          <button 
            type="button" 
            onClick={() => {
              setShowMap(!showMap);
              // Force a reflow/repaint by waiting a tiny bit before toggling
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
              }, 100);
            }}
            className="bg-primary text-white px-3 py-1 rounded-md text-sm"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          {geocodingSuccess === false && (
            <p className="text-red-500 text-sm">
              Could not get coordinates for this address. Try pinning the location on the map.
            </p>
          )}
          {geocodingSuccess === true && (
            <p className="text-green-500 text-sm">
              Map coordinates found! Your location will appear on the map.
            </p>
          )}
        </div>
        
        {showMap && (
          <div className="mb-4">
            <MapPicker 
              initialCoordinates={lat && lng ? { lat, lng } : null}
              onLocationSelect={handleLocationSelect}
              onAddressUpdate={handleAddressUpdate}
            />
          </div>
        )}
        
        {preInput("Photos", "more is better. ")}
        <PhotoUploader
          addedPhotos={addedPhotos}
          setAddedPhotos={setAddedPhotos}
        />
        
        {preInput("YouTube Video", "add a YouTube link showcasing your conference room.")}
        <input
          type="text"
          placeholder="https://www.youtube.com/watch?v=example"
          value={youtubeLink}
          onChange={(event) => setYoutubeLink(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
        />
        
        {preInput("Description", "description of the conference room. ")}
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
          rows={5}
          placeholder="Describe your conference room's features, ambiance, available resources, etc."
        />
        {preInput("Perks", "select all the perks of your conference room.")}
        <PerkSelections selectedPerks={perks} setPerks={setPerks} />
        {preInput("Extra info", "house rules, etc. ")}
        <textarea
          value={extraInfo}
          onChange={(event) => setExtraInfo(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
          rows={4}
          placeholder="Any additional information such as booking rules, cancellation policy, or special instructions."
        />
        {preInput(
          "Availability times",
          "add available times, remember to have some time for cleaning the room between bookings."
        )}
        
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-2">
          {/* Calendar component for date selection */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border lg:col-span-2">
            <h3 className="text-base font-medium mb-3">Available dates</h3>
            <Calendar 
              startDate={startDate}
              endDate={endDate}
              onDateChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              blockedDates={blockedDates}
              blockedWeekdays={blockedWeekdays}
              // No onBlockedDateClick prop here - this is the main calendar for selecting available dates
            />
            {/* Display formatted date range */}
            {startDate && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg text-blue-800 text-sm">
                <p className="font-medium">Selected range:</p>
                <p>
                  {format(parseISO(startDate), "MMMM d, yyyy")}
                  {endDate && ` - ${format(parseISO(endDate), "MMMM d, yyyy")}`}
                </p>
              </div>
            )}
          </div>
          
          {/* Time slot management section */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border lg:col-span-2">
            <h3 className="text-base font-medium mb-3">Block weekdays & set time slots</h3>
            
            {/* Weekday blocking checkboxes */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <label key={day} className="flex items-center gap-1 p-2 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={blockedWeekdays.includes(index)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBlockedWeekdays(prev => [...prev, index]);
                      } else {
                        setBlockedWeekdays(prev => prev.filter(d => d !== index));
                      }
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
            
            {/* Blocked dates counter */}
            {blockedDates.length > 0 && (
              <div className="mb-3 flex justify-between items-center">
                <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-medium">{blockedDates.length}</span>
                  <span className="ml-1">{blockedDates.length === 1 ? 'date' : 'dates'} blocked</span>
                  <button 
                    type="button"
                    onClick={() => setBlockedDates([])}
                    className="ml-3 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
            
            {/* Block specific dates toggle */}
            <div className="flex items-center mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`relative inline-block w-10 h-6 rounded-full transition ${showBlockSpecificDates ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <input
                    type="checkbox"
                    className="absolute opacity-0 w-0 h-0"
                    checked={showBlockSpecificDates}
                    onChange={() => {
                      // Toggle visibility without clearing blocked dates
                      setShowBlockSpecificDates(!showBlockSpecificDates);
                    }}
                  />
                  <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showBlockSpecificDates ? 'transform translate-x-4' : ''}`}></span>
                </div>
                <span>Block Specific Dates</span>
              </label>
            </div>
            
            {/* Specific date picker calendar (only shown when toggle is enabled) */}
            {showBlockSpecificDates && (
              <div className="mb-4 border p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Select dates to block:</h4>
                  {blockedDates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBlockedDates([])}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear all blocked dates
                    </button>
                  )}
                </div>
                <Calendar 
                  blockedDates={blockedDates}
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))} // Allow blocking from today
                  onBlockedDateClick={toggleBlockedDate} // Use the specific handler for date blocking
                />
                {blockedDates.length > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">{blockedDates.length}</span> {blockedDates.length === 1 ? 'date' : 'dates'} currently blocked
                  </div>
                )}
              </div>
            )}
            
            {/* Time slot management per weekday */}
            <div className="mb-2">
              <h4 className="text-base font-medium mb-3">Time slots by weekday</h4>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                <div key={day} className={`p-2 mb-2 rounded-lg ${blockedWeekdays.includes(index) ? 'bg-gray-100 opacity-60' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-24">{day}:</span>
                    
                    {!blockedWeekdays.includes(index) ? (
                      <>
                        <select
                          value={weekdayTimeSlots[index].start}
                          onChange={(e) => {
                            setWeekdayTimeSlots(prev => ({
                              ...prev, 
                              [index]: {...prev[index], start: e.target.value}
                            }));
                          }}
                          className="border rounded p-1 text-sm"
                          disabled={blockedWeekdays.includes(index)}
                        >
                          <option value="">Start time</option>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <option key={hour} value={hour}>
                                {hour}:00
                              </option>
                            );
                          })}
                        </select>
                        
                        <span>to</span>
                        
                        <select
                          value={weekdayTimeSlots[index].end}
                          onChange={(e) => {
                            setWeekdayTimeSlots(prev => ({
                              ...prev, 
                              [index]: {...prev[index], end: e.target.value}
                            }));
                          }}
                          className="border rounded p-1 text-sm"
                          disabled={blockedWeekdays.includes(index)}
                        >
                          <option value="">End time</option>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <option key={hour} value={hour}>
                                {hour}:00
                              </option>
                            );
                          })}
                        </select>
                      </>
                    ) : (
                      <span className="text-gray-500">Blocked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border">
            <h3 className="text-base font-medium mb-1">Price per hour ($)</h3>
            <input
              type="number"
              min="0"
              placeholder="50"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full border py-2 px-3 rounded-xl"
            />
          </div>
          
          <div className="bg-white p-3 rounded-2xl shadow-sm border">
            <h3 className="text-base font-medium mb-1">Max number of attendees</h3>
            <input
              type="number"
              min="1"
              placeholder="10"
              value={maxGuests}
              onChange={(event) => setMaxGuests(event.target.value)}
              className="w-full border py-2 px-3 rounded-xl"
            />
          </div>
        </div>
        
        <div className="flex justify-center md:justify-start">
          <button className="primary my-5 max-w-xs">Save Conference Room</button>
        </div>
      </form>
    </div>
  );
}
