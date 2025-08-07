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
import MatterportSection from "../components/MatterportSection";
import HostSelector from "../components/HostSelector";
import RefundOptions from "../components/RefundOptions";
import { useTranslation } from "react-i18next";

export default function PlacesFormPage() {
  const { t } = useTranslation(['places', 'forms', 'common']);
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
  const [cooldownMinutes, setCooldownMinutes] = useState(60);
  const [minimumHours, setMinimumHours] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [matterportLink, setMatterportLink] = useState("");
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

  // Agent-specific state for selecting host
  const [selectedHost, setSelectedHost] = useState(null);

  // Refund options state
  const [refundOptions, setRefundOptions] = useState([]);

  // Track the source of coordinate updates to prevent circular geocoding
  const coordinateUpdateSource = useRef('address'); // 'address' or 'map'
  
  // Track the last successfully geocoded address to prevent repeated API calls
  const lastGeocodedAddress = useRef('');

  // Auto-hide error notification after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000); // 5 seconds

      return () => clearTimeout(timer); // Cleanup timer if component unmounts or error changes
    }
  }, [error]);

  // Redirect if user is not a host or agent
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
        setCooldownMinutes(data.cooldown || 60);
        setMinimumHours(data.minimumHours || 1);
        console.log("Loaded minimumHours from database:", data.minimumHours, "Setting to:", data.minimumHours || 1);
        setYoutubeLink(data.youtubeLink || "");
        setMatterportLink(data.matterportLink || "");
        
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
        
        // Load refund options if available
        setRefundOptions(data.refundOptions || []);
        
        // Set the selected host for agents when editing a place
        if (user?.userType === 'agent' && data.owner) {
          setSelectedHost(data.owner);
        }
      });
    }
  }, [id, user?.userType]); // reactive values referenced inside of the above setup code

  // Geocode address when it changes (with debounce) - but only for new places
  useEffect(() => {
    // Skip geocoding if address is empty or too short
    if (!address || address.length < 5) {
      setGeocodingSuccess(null);
      lastGeocodedAddress.current = '';
      return;
    }

    // We're editing an existing place with coordinates
    if (id && lat && lng) {
      return;
    }

    // Skip geocoding if coordinates were just updated via map interaction
    // This prevents circular updates between address field and map coordinates
    if (coordinateUpdateSource.current === 'map') {
      coordinateUpdateSource.current = 'address'; // Reset for next update
      return;
    }

    // Skip geocoding if we already geocoded this exact address successfully
    if (lastGeocodedAddress.current === address && geocodingSuccess === true && lat && lng) {
      return;
    }

    // Set a timer to geocode the address after the user stops typing
    const timer = setTimeout(() => {
      handleGeocodeAddress();
    }, 1000); // Wait 1 second after typing stops

    return () => clearTimeout(timer); // Clean up the timer
  }, [address, id, lat, lng]); // Removed geocodingSuccess from dependencies to prevent repeated calls

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
        // Track the successfully geocoded address to prevent repeated calls
        lastGeocodedAddress.current = address;
      } else {
        setGeocodingSuccess(false);
        lastGeocodedAddress.current = ''; // Reset on failure
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      setGeocodingSuccess(false);
      lastGeocodedAddress.current = ''; // Reset on error
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

  // Handle manual address input changes
  function handleAddressInputChange(newAddress) {
    // If the user significantly changes the address, reset the geocoding tracking
    if (lastGeocodedAddress.current && newAddress !== lastGeocodedAddress.current) {
      const similarity = calculateSimilarity(newAddress, lastGeocodedAddress.current);
      if (similarity < 0.7) { // If less than 70% similar, allow new geocoding
        lastGeocodedAddress.current = '';
        setGeocodingSuccess(null);
      }
    }
    setAddress(newAddress);
  }

  // Simple similarity function to check if address has changed significantly
  function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  }

  // Simple edit distance calculation
  function editDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  function preInput(headerKey, descriptionKey, isRequired = false) {
    return (
      <div>
        {inputHeader(t(headerKey), isRequired)}
        {inputDescription(descriptionKey ? t(descriptionKey) : '')}
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
    return text ? <p className="text-gray-500 text-sm">{text}</p> : null;
  }

  async function savePlace(event) {
    event.preventDefault();
    setError("");

    // Define validation rules with field IDs for scrolling
    const validations = [
      // Agent must select a host
      ...(user?.userType === 'agent' ? [{
        isValid: selectedHost && selectedHost.id,
        fieldId: "host-selector",
        errorMessage: t('places:placeCreate.validation.hostRequired')
      }] : []),
      {
        isValid: title.trim(),
        fieldId: "place-title",
        errorMessage: t('places:placeCreate.validation.titleRequired')
      },
      {
        isValid: address.trim(),
        fieldId: "place-address", 
        errorMessage: t('places:placeCreate.validation.addressRequired')
      },
      {
        isValid: price && parseFloat(price) > 0,
        fieldId: "pricing-capacity",
        errorMessage: t('places:placeCreate.validation.priceRequired')
      },
      {
        isValid: fullDayDiscountPrice && parseFloat(fullDayDiscountPrice) > 0,
        fieldId: "pricing-capacity",
        errorMessage: t('places:placeCreate.validation.fullDayPriceRequired')
      },
      {
        isValid: currency,
        fieldId: "pricing-capacity",
        errorMessage: t('places:placeCreate.validation.currencyRequired')
      },
      {
        isValid: startDate && endDate,
        fieldId: "date-availability",
        errorMessage: t('places:placeCreate.validation.datesRequired')
      },
      {
        customCheck: () => {
          if (startDate && endDate) {
            return new Date(startDate) <= new Date(endDate);
          }
          return true;
        },
        fieldId: "date-availability",
        errorMessage: t('places:placeCreate.validation.endDateAfterStart')
      },
      {
        customCheck: () => {
          // Check if all weekdays are blocked
          return blockedWeekdays.length < 7;
        },
        fieldId: "time-slots",
        errorMessage: t('places:placeCreate.validation.weekdayRequired')
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
        errorMessage: t('places:placeCreate.validation.timeSlotsRequired')
      },
      {
        isValid: refundOptions && refundOptions.length > 0,
        fieldId: "refund-options",
        errorMessage: t('places:placeCreate.validation.refundOptionsRequired')
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
      scrollToAndHighlightField("youtube-section", t('places:placeCreate.validation.invalidYouTube'), setError);
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
      setError(t('places:placeCreate.validation.invalidCurrency'));
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
      matterportLink,
      lat: coordinates.lat,
      lng: coordinates.lng,
      // Include time slot management data
      blockedWeekdays,
      blockedDates: blockedDates.filter(date => date !== ""), // Remove empty strings
      weekdayTimeSlots,
      squareMeters, // Include square meters
      isHotel, // Include is hotel flag
      refundOptions, // Include refund options
      // Include hostId for agents creating places on behalf of hosts
      ...(user?.userType === 'agent' && selectedHost ? { hostId: selectedHost.id } : {})
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
      setError(error.response?.data?.error || t('places:placeCreate.validation.submitFailed'));
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
    <div className="max-w-8xl mx-auto">
      {/* Sticky Error Notification */}
      {error && (
        <div className="fixed top-20 left-0 right-0 bg-red-100 text-red-800 p-4 mb-4 border-b border-red-200 shadow-md z-40">
          <div className="max-w-8xl mx-auto spacing-container flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError("")}
              className="ml-4 text-red-600 hover:text-red-800 flex-shrink-0"
              aria-label="Close error notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Add top padding when error is shown to prevent content overlap */}
      <form onSubmit={savePlace} className={`spacing-container ${error ? 'pt-20 sm:pt-24' : ''}`}>
        
        {/* Host Selection for Agents */}
        {user?.userType === 'agent' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{t('places:placeCreate.hostSelector.title')}</h3>
            <p className="text-gray-600 text-sm mb-3">
              {t('places:placeCreate.hostSelector.description')}
            </p>
            <HostSelector
              selectedHost={selectedHost}
              onHostSelect={setSelectedHost}
            />
          </div>
        )}
        
        {preInput(
          "placeCreate.title",
          null,
          true // Required field
        )}
        <input
          id="place-title"
          type="text"
          placeholder={t('places:placeCreate.titlePlaceholder')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
        />
        
        <AddressSection
          address={address}
          setAddress={handleAddressInputChange}
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
          placeId={id} // Pass the place ID to determine if this is creation or editing
        />
        
        {preInput("placeCreate.photos", "placeCreate.photosDescription")}
        <PhotoUploader
          addedPhotos={addedPhotos}
          setAddedPhotos={setAddedPhotos}
        />
        
        <YouTubeSection
          youtubeLink={youtubeLink}
          setYoutubeLink={setYoutubeLink}
          preInput={preInput}
        />
        
        <MatterportSection
          matterportLink={matterportLink}
          setMatterportLink={setMatterportLink}
          preInput={preInput}
        />
        
        {preInput("places:placeCreate.description")}
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
          rows={5}
          placeholder={t('places:placeCreate.descriptionPlaceholder')}
        />
        {preInput("places:placeCreate.perks")}
        <PerkSelections selectedPerks={perks} setPerks={setPerks} />
        {preInput("places:placeCreate.extraInfo")}
        <textarea
          value={extraInfo}
          onChange={(event) => setExtraInfo(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
          rows={4}
          placeholder={t('places:placeCreate.extraInfoPlaceholder')}
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
        
        {preInput(
          "placeCreate.refundOptions",
          "placeCreate.refundOptionsDescription",
          true // Required field
        )}
        <RefundOptions
          selectedOptions={refundOptions}
          onOptionsChange={setRefundOptions}
          isRequired={true}
        />
        
        <div className="flex justify-center md:justify-start gap-4">
          <button 
            type="button"
            onClick={() => navigate("/account/user-places")}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full max-w-xs rounded-2xl my-5 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('common:buttons.cancel')}
          </button>
          <button 
            type="submit"
            className="primary my-5 max-w-xs flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('places:placeCreate.saveButton')}
          </button>
        </div>
      </form>
    </div>
  );
}
