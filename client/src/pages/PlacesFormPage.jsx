import { useContext, useEffect, useState } from "react";
import PerkSelections from "./PerkSelections";
import PhotoUploader from "../components/PhotoUploader";
import { Navigate, useParams } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import api from "../utils/api";
import { geocodeAddress } from "../utils/formUtils";

export default function PlacesFormPage() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState([]);
  const [extraInfo, setExtraInfo] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roomType, setRoomType] = useState("Conference Room");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [geocodingSuccess, setGeocodingSuccess] = useState(null);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState("");

  // Available room types (matching the Header.jsx options)
  const roomTypes = ['Conference Room', 'Meeting Room', 'Workshop Space', 'Training Room', 'Coworking Space'];

  // Redirect if user is not a host
  if (user && user.userType !== 'host') {
    return <Navigate to="/" />;
  }

  useEffect(() => { // display data entered before by user 
    if (!id) {
      return;
    } else {
      api.get("/place/" + id).then((response) => {
        const { data } = response;
        console.log("Loaded photos from database:", data.photos);
        setTitle(data.title);
        setAddress(data.address);
        setDescription(data.description);
        setAddedPhotos(data.photos);
        setPerks(data.perks);
        setExtraInfo(data.extraInfo);
        setCheckIn(data.checkIn);
        setCheckOut(data.checkOut);
        setPrice(data.price);
        setMaxGuests(data.maxGuests);
        setRoomType(data.roomType || "Conference Room"); // Load room type with default
        // Format dates properly if they exist
        if (data.startDate) setStartDate(data.startDate.split("T")[0]);
        if (data.endDate) setEndDate(data.endDate.split("T")[0]);
        // Load coordinates
        setLat(data.lat || "");
        setLng(data.lng || "");
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
      checkIn,
      checkOut,
      maxGuests: numGuests,
      price: numPrice,
      startDate: startDate || null,
      endDate: endDate || null,
      roomType,
      lat: coordinates.lat,
      lng: coordinates.lng
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
        
        {preInput("Room Type", "select the type of conference space you're offering.")}
        <select
          value={roomType}
          onChange={(event) => setRoomType(event.target.value)}
          className="w-full border my-2 py-2 px-3 rounded-2xl"
        >
          {roomTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        
        {preInput("Address", "address of this conference room. We'll automatically get the map coordinates.")}
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
        {geocodingSuccess === false && (
          <p className="text-red-500 text-sm mb-4">
            Could not get coordinates for this address. Please make sure it's a valid address.
          </p>
        )}
        {geocodingSuccess === true && (
          <p className="text-green-500 text-sm mb-4">
            Map coordinates found successfully! Your location will appear on the map.
          </p>
        )}
        
        {preInput("Photos", "more is better. ")}
        <PhotoUploader
          addedPhotos={addedPhotos}
          setAddedPhotos={setAddedPhotos}
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
          <div className="bg-white p-3 rounded-2xl shadow-sm border">
            <h3 className="text-base font-medium mb-1">Available from date</h3>
            <input
              className="w-full border py-2 px-3 rounded-xl"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          
          <div className="bg-white p-3 rounded-2xl shadow-sm border">
            <h3 className="text-base font-medium mb-1">Available until date</h3>
            <input
              className="w-full border py-2 px-3 rounded-xl"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-sm border">
            <h3 className="text-base font-medium mb-1">Available from (hour)</h3>
            <input
              type="text"
              placeholder="9"
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              className="w-full border py-2 px-3 rounded-xl"
            />
          </div>
          
          <div className="bg-white p-3 rounded-2xl shadow-sm border">
            <h3 className="text-base font-medium mb-1">Available until (hour)</h3>
            <input
              type="text"
              placeholder="18"
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              className="w-full border py-2 px-3 rounded-xl"
            />
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
