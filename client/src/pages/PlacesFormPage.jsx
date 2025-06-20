import { useContext, useEffect, useState, useRef } from "react";
import PerkSelections from "./PerkSelections";
import PhotoUploader from "../components/PhotoUploader";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import api from "../utils/api";
import { geocodeAddress } from "../utils/formUtils";
import { validateFormWithScrolling, scrollToAndHighlightField } from "../utils/formValidationUtils";
import AddressSection from "../components/AddressSection";
import AvailabilitySection from "../components/AvailabilitySection";
import YouTubeSection, { extractYouTubeVideoId } from "../components/YouTubeSection";

export default function PlacesFormPage() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState([]);
  const [extraInfo, setExtraInfo] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState(null);
  const [fullDayHours, setFullDayHours] = useState(8);
  const [fullDayDiscountPrice, setFullDayDiscountPrice] = useState(0);
  const [cooldownMinutes, setCooldownMinutes] = useState(30);
  const [minimumHours, setMinimumHours] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [geocodingSuccess, setGeocodingSuccess] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState("");
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  
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
  
  // Room properties
  const [squareMeters, setSquareMeters] = useState(null);
  const [isHotel, setIsHotel] = useState(false);

  // Track the source of coordinate updates to prevent circular geocoding
  const coordinateUpdateSource = useRef('address'); // 'address' or 'map'

  // Redirect if user is not a host
  if (user && user.userType !== 'host' && user.userType !== 'agent') {
    return <Navigate to="/" />;
  }
  
  // Fetch currencies at component mount
  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const response = await api.get("/currency");
        if (response.data && response.data.length > 0) {
          setAvailableCurrencies(response.data);
          
          // If there's no currency selected yet, set default to UZS
          if (!currency) {
            const uzsDefault = response.data.find(c => c.charCode === "UZS");
            if (uzsDefault) {
              setCurrency(uzsDefault);
            }
          }
        } else {
          // If no currencies exist, create them
          console.log("No currencies found, creating them...");
          try {
            await api.post("/currency", { name: "Uzbekistan Som", code: "860", charCode: "UZS" });
            await api.post("/currency", { name: "United States Dollar", code: "840", charCode: "USD" });
            await api.post("/currency", { name: "Russian Ruble", code: "643", charCode: "RUB" });
            
            // Fetch again
            const newResponse = await api.get("/currency");
            if (newResponse.data && newResponse.data.length > 0) {
              setAvailableCurrencies(newResponse.data);
              
              // Set default to UZS
              const uzsDefault = newResponse.data.find(c => c.charCode === "UZS");
              if (uzsDefault && !currency) {
                setCurrency(uzsDefault);
              }
            }
          } catch (err) {
            console.error("Error creating currencies:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching currencies:", err);
      }
    }
    
    fetchCurrencies();
  }, []);

  useEffect(() => { // display data entered before by user 
    if (!id) {
      return;
    } else {
      api.get("/places/" + id).then(async (response) => {
        const { data } = response;
        console.log("Full place data loaded from database:", data);
        console.log("Loaded photos from database:", data.photos);
        setTitle(data.title);
        setAddress(data.address);
        setDescription(data.description);
        setAddedPhotos(data.photos);
        setPerks(data.perks);
        setExtraInfo(data.extraInfo);
        setPrice(data.price);
        setMaxGuests(data.maxGuests);
        setFullDayHours(data.fullDayHours || 8);
        setFullDayDiscountPrice(data.fullDayDiscountPrice || 0);
        setCooldownMinutes(data.cooldown || 30);
        setMinimumHours(data.minimumHours || 1);
        console.log("Loaded minimumHours from database:", data.minimumHours, "Setting to:", data.minimumHours || 1);
        setYoutubeLink(data.youtubeLink || "");
        
        // Load currency if it exists
        if (data.currencyId) {
          // First try to find it in our already-fetched currencies
          if (availableCurrencies.length > 0) {
            const selectedCurrency = availableCurrencies.find(c => c.id === data.currencyId);
            if (selectedCurrency) {
              setCurrency(selectedCurrency);
              console.log("Found currency in available currencies:", selectedCurrency);
            } else {
              // If not found, fetch again to be safe
              try {
                const currencyResponse = await api.get("/currency");
                const currencyData = currencyResponse.data;
                const selectedCurrency = currencyData.find(c => c.id === data.currencyId);
                if (selectedCurrency) {
                  setCurrency(selectedCurrency);
                  console.log("Set currency from fresh fetch:", selectedCurrency);
                } else {
                  console.warn("Currency with ID", data.currencyId, "not found in database");
                  // Default to UZS if we have it
                  const uzsDefault = currencyData.find(c => c.charCode === "UZS");
                  if (uzsDefault) {
                    setCurrency(uzsDefault);
                    console.log("Defaulted to UZS currency:", uzsDefault);
                  }
                }
              } catch (err) {
                console.error("Error loading currency data:", err);
              }
            }
          } else {
            // Fetch currencies if we don't have them yet
            try {
              const currencyResponse = await api.get("/currency");
              const currencyData = currencyResponse.data;
              setAvailableCurrencies(currencyData);
              const selectedCurrency = currencyData.find(c => c.id === data.currencyId);
              if (selectedCurrency) {
                setCurrency(selectedCurrency);
                console.log("Set currency after fetching:", selectedCurrency);
              }
            } catch (err) {
              console.error("Error loading currency data:", err);
            }
          }
        }
        
        // Format dates properly if they exist
        if (data.startDate) setStartDate(data.startDate.split("T")[0]);
        if (data.endDate) setEndDate(data.endDate.split("T")[0]);
        // Load coordinates - ensure they're stored as strings for consistency
        setLat(data.lat ? data.lat.toString() : "");
        setLng(data.lng ? data.lng.toString() : "");
        // Show map if coordinates exist
        if (data.lat && data.lng) {
          setShowMap(true);
          // Set geocoding success since we have valid coordinates
          setGeocodingSuccess(true);
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
        
        // Load room property data
        setSquareMeters(data.squareMeters || null);
        setIsHotel(data.isHotel || false);
      });
    }
  }, [id]); // reactive values referenced inside of the above setup code

  // Geocode address when it changes (with debounce) - but only for new places
  useEffect(() => {
    // Skip geocoding if address is empty or too short
    if (!address || address.length < 5) {
      setGeocodingSuccess(null);
      return;
    }

    // We're editing an existing place with coordinates
    if (id && lat && lng) {
      // Don't geocode address when editing places with coordinates - keep the original coordinates
      console.log("Skipping geocoding for existing place with coordinates:", { lat, lng });
      return;
    }

    // Skip geocoding if coordinates were just updated via map interaction
    // This prevents circular updates between address field and map coordinates
    if (coordinateUpdateSource.current === 'map') {
      console.log("Skipping geocoding - coordinates were just updated via map interaction");
      coordinateUpdateSource.current = 'address'; // Reset for next update
      return;
    }

    // Set a timer to geocode the address after the user stops typing
    const timer = setTimeout(() => {
      handleGeocodeAddress();
    }, 1000); // Wait 1 second after typing stops

    return () => clearTimeout(timer); // Clean up the timer
  }, [address, id, lat, lng, geocodingSuccess]);

  // Function to geocode the address
  async function handleGeocodeAddress() {
    setIsGeocodingAddress(true);
    setGeocodingSuccess(null);
    
    try {
      const coordinates = await geocodeAddress(address);
      
      if (coordinates) {
        coordinateUpdateSource.current = 'address'; // Mark as address-based update
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
    if (location && (parseFloat(lat) !== parseFloat(location.lat) || parseFloat(lng) !== parseFloat(location.lng))) {
      // Mark this update as coming from map interaction
      coordinateUpdateSource.current = 'map';
      
      // Ensure we store values as strings consistently, but compare as numbers
      setLat(location.lat.toString());
      setLng(location.lng.toString());
      
      // If coordinates are successfully updated from map, set geocoding success state
      setGeocodingSuccess(true);
    }
  }

  // Handle address update from map
  function handleAddressUpdate(newAddress) {
    if (newAddress && newAddress !== address) {
      // When editing an existing place, we want to keep the entered address
      // and not override it with the one suggested by the map
      if (id) {
        // We don't update the address but still show success indicator
        setGeocodingSuccess(true);
      } else {
        // For new places, we can use the address suggestion if desired
        setAddress(newAddress);
        setGeocodingSuccess(true);
      }
    }
  }

  function preInput(header, description, isRequired = false) {
    return (
      <div>
        {inputHeader(header, isRequired)}
        {inputDescription(description)}
      </div>
    );
  }

  function inputHeader(text, isRequired = false) {
    return (
      <h2 className="text-xl md:text-2xl mt-4 flex items-center">
        {text}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </h2>
    );
  }

  function inputDescription(text) {
    return <p className="text-gray-500 text-sm">{text}</p>;
  }

  async function savePlace(event) {
    event.preventDefault();
    setError("");

    // Define validation rules with field IDs for scrolling
    const validations = [
      {
        isValid: title.trim(),
        fieldId: "place-title",
        errorMessage: "Title is required"
      },
      {
        isValid: address.trim(),
        fieldId: "place-address", 
        errorMessage: "Address is required"
      },
      {
        isValid: price && parseFloat(price) > 0,
        fieldId: "pricing-capacity",
        errorMessage: "Price per hour is required and must be greater than 0"
      },
      {
        isValid: fullDayDiscountPrice && parseFloat(fullDayDiscountPrice) > 0,
        fieldId: "pricing-capacity",
        errorMessage: "Full day discount price is required and must be greater than 0"
      },
      {
        isValid: currency,
        fieldId: "pricing-capacity",
        errorMessage: "Please select a currency"
      },
      {
        isValid: startDate && endDate,
        fieldId: "date-availability",
        errorMessage: "Both start date and end date must be selected"
      },
      {
        customCheck: () => {
          if (startDate && endDate) {
            return new Date(startDate) <= new Date(endDate);
          }
          return true;
        },
        fieldId: "date-availability",
        errorMessage: "End date must be later than or equal to start date"
      },
      {
        customCheck: () => {
          // Check if all weekdays are blocked
          return blockedWeekdays.length < 7;
        },
        fieldId: "time-slots",
        errorMessage: "At least one weekday must be available (not blocked)"
      },
      {
        customCheck: () => {
          // Validate time slots
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            // Skip blocked weekdays
            if (blockedWeekdays.includes(dayIndex)) {
              continue;
            }

            const timeSlot = weekdayTimeSlots[dayIndex];
            
            // If a weekday is not blocked, it must have both start and end times
            if (!timeSlot.start || !timeSlot.end) {
              return false;
            }

            // Validate that start time is before end time
            const startHour = parseInt(timeSlot.start);
            const endHour = parseInt(timeSlot.end);
            
            if (startHour >= endHour) {
              return false;
            }
          }
          return true;
        },
        fieldId: "time-slots",
        errorMessage: "All available weekdays must have valid time slots (start and end times, with start before end)"
      }
    ];

    // Run validation with automatic scrolling
    const isValid = validateFormWithScrolling(validations, setError);
    
    if (!isValid) {
      return; // Stop execution if validation fails
    }

    // Validate and clean YouTube link
    const cleanedYouTubeLink = extractYouTubeVideoId(youtubeLink);
    if (youtubeLink && !cleanedYouTubeLink) {
      scrollToAndHighlightField("youtube-section", "Invalid YouTube URL", setError);
      return;
    }

    // Ensure numeric fields are valid
    const numGuests = parseInt(maxGuests) || 1;
    const numPrice = parseFloat(price) || 0;
    
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
    // Ensure we have a valid currency ID from the database
    // Not just from a local defaultCurrencies object
    if (currency && (!currency.id || isNaN(parseInt(currency.id)))) {
      setError("Invalid currency selected. Please select a currency again.");
      return;
    }
    
    const placeData = {
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      maxGuests: numGuests,
      price: numPrice,
      fullDayHours,
      fullDayDiscountPrice,
      cooldown: cooldownMinutes,
      minimumHours,
      currencyId: currency && currency.id ? parseInt(currency.id) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      youtubeLink: cleanedYouTubeLink,
      lat: coordinates.lat,
      lng: coordinates.lng,
      // Include time slot management data
      blockedWeekdays,
      blockedDates: blockedDates.filter(date => date !== ""), // Remove empty strings
      weekdayTimeSlots,
      squareMeters, // Include square meters
      isHotel // Include is hotel flag
    };

    try {
      let response;
      
      if (id) {
        //update
        response = await api.put("/places", {
          id,
          ...placeData,
        });
        // Redirect to the place detail page after successful update
        console.log("Place updated successfully, redirecting to place detail page");
        navigate(`/place/${id}`);
        return;
      } else {
        //create a new place
        response = await api.post("/places", placeData);
        // For new places, redirect to places list
        setRedirect(true);
      }
      
      console.log("Response after saving:", response.data);
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
          "title for your conference room. It's better to have a short and catchy title.",
          true // Required field
        )}
        <input
          id="place-title"
          type="text"
          placeholder="title, for example: Executive Conference Room"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
        />
        
        <AddressSection
          address={address}
          setAddress={setAddress}
          lat={lat}
          setLat={setLat}
          lng={lng}
          setLng={setLng}
          isGeocodingAddress={isGeocodingAddress}
          geocodingSuccess={geocodingSuccess}
          showMap={showMap}
          setShowMap={setShowMap}
          handleLocationSelect={handleLocationSelect}
          handleAddressUpdate={handleAddressUpdate}
          preInput={preInput}
        />
        
        {preInput("Photos", "more is better. ")}
        <PhotoUploader
          addedPhotos={addedPhotos}
          setAddedPhotos={setAddedPhotos}
        />
        
        <YouTubeSection
          youtubeLink={youtubeLink}
          setYoutubeLink={setYoutubeLink}
          preInput={preInput}
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
        <AvailabilitySection
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          blockedWeekdays={blockedWeekdays}
          setBlockedWeekdays={setBlockedWeekdays}
          blockedDates={blockedDates}
          setBlockedDates={setBlockedDates}
          showBlockSpecificDates={showBlockSpecificDates}
          setShowBlockSpecificDates={setShowBlockSpecificDates}
          weekdayTimeSlots={weekdayTimeSlots}
          setWeekdayTimeSlots={setWeekdayTimeSlots}
          currency={currency}
          setCurrency={setCurrency}
          availableCurrencies={availableCurrencies}
          price={price}
          setPrice={setPrice}
          fullDayHours={fullDayHours}
          setFullDayHours={setFullDayHours}
          fullDayDiscountPrice={fullDayDiscountPrice}
          setFullDayDiscountPrice={setFullDayDiscountPrice}
          cooldownMinutes={cooldownMinutes}
          setCooldownMinutes={setCooldownMinutes}
          minimumHours={minimumHours}
          setMinimumHours={setMinimumHours}
          maxGuests={maxGuests}
          setMaxGuests={setMaxGuests}
          squareMeters={squareMeters}
          setSquareMeters={setSquareMeters}
          isHotel={isHotel}
          setIsHotel={setIsHotel}
          toggleBlockedDate={toggleBlockedDate}
          preInput={preInput}
        />
        
        <div className="flex justify-center md:justify-start">
          <button 
            type="submit"
            className="primary my-5 max-w-xs flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Conference Room
          </button>
        </div>
      </form>
    </div>
  );
}
