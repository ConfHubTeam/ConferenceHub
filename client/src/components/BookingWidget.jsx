import { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import CustomPhoneInput, { isPossiblePhoneNumber } from "./CustomPhoneInput";
import api from "../utils/api";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";
import { validateForm } from "../utils/formUtils";
import PriceDisplay from "./PriceDisplay";
import BookingAvailabilityStatus from "./BookingAvailabilityStatus";
import { isTimeRangeAvailable } from "../utils/TimeUtils";

export default function BookingWidget({ placeDetail, buttonDisabled, selectedCalendarDates = [] }) {
  const [numOfGuests, setNumOfGuests] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [redirect, setRedirect] = useState();
  const [error, setError] = useState("");
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      setGuestName(user.name);
    }
  }, [user, placeDetail]);

  // Fetch booked time slots when component mounts or placeDetail changes
  useEffect(() => {
    if (placeDetail && placeDetail.id) {
      setIsCheckingAvailability(true);
      api.get(`/bookings/availability?placeId=${placeDetail.id}`)
        .then(response => {
          if (response.data && response.data.bookedTimeSlots) {
            setBookedTimeSlots(response.data.bookedTimeSlots);
          }
        })
        .catch(err => {
          console.error("Failed to fetch availability:", err);
        })
        .finally(() => {
          setIsCheckingAvailability(false);
        });
    }
  }, [placeDetail]);

  // Calculate total hours and pricing from selected calendar dates
  const calculatePricing = () => {
    if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
      return {
        totalHours: 0,
        regularHours: 0,
        fullDays: 0,
        regularPrice: 0,
        fullDayPrice: 0,
        totalPrice: 0,
        breakdown: []
      };
    }

    const { 
      price: hourlyRate, 
      fullDayHours = 8, 
      fullDayDiscountPrice = 0 
    } = placeDetail;

    let totalHours = 0;
    let totalPrice = 0;
    let breakdown = [];

    selectedCalendarDates.forEach(dateSlot => {
      const startTime = dateSlot.startTime;
      const endTime = dateSlot.endTime;
      
      // Calculate hours for this date slot
      const [startHour] = startTime.split(':').map(Number);
      const [endHour] = endTime.split(':').map(Number);
      const hoursForThisSlot = endHour - startHour;
      
      totalHours += hoursForThisSlot;
      
      // Determine pricing for this slot
      let slotPrice = 0;
      let priceType = '';
      
      if (hoursForThisSlot >= fullDayHours && fullDayDiscountPrice > 0) {
        // Full day pricing
        const fullDaysUsed = Math.floor(hoursForThisSlot / fullDayHours);
        const remainingHours = hoursForThisSlot % fullDayHours;
        
        slotPrice = (fullDaysUsed * fullDayDiscountPrice) + (remainingHours * hourlyRate);
        priceType = fullDaysUsed > 0 ? `${fullDaysUsed} full day${fullDaysUsed > 1 ? 's' : ''} + ${remainingHours}h` : `${hoursForThisSlot}h`;
      } else {
        // Regular hourly pricing
        slotPrice = hoursForThisSlot * hourlyRate;
        priceType = `${hoursForThisSlot}h`;
      }
      
      totalPrice += slotPrice;
      
      breakdown.push({
        date: dateSlot.formattedDate,
        timeSlot: `${formatHourTo12(startTime)} - ${formatHourTo12(endTime)}`,
        hours: hoursForThisSlot,
        price: slotPrice,
        priceType
      });
    });

    return {
      totalHours,
      totalPrice,
      breakdown
    };
  };

  // Helper function to format hour to 12-hour format
  const formatHourTo12 = (hour24) => {
    if (!hour24) return "";
    const [hours] = hour24.split(':');
    const hourNum = parseInt(hours, 10);
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const amPm = hourNum < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${amPm}`;
  };

  const pricingData = calculatePricing();
  const { totalHours, totalPrice, breakdown } = pricingData;

  // Function to handle login redirect with preserved state
  const handleLoginRedirect = () => {
    // Store booking selections in sessionStorage to restore after login
    if (selectedCalendarDates && selectedCalendarDates.length > 0) {
      sessionStorage.setItem('bookingSelections', JSON.stringify({
        selectedCalendarDates,
        numOfGuests,
        placeId: placeDetail.id
      }));
    }

    // Create redirect URL with current page
    const currentPath = location.pathname + location.search;
    const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    
    // Navigate to login with redirect
    window.location.href = redirectUrl;
  };

  // Function to check if selected time slots are available
  const validateTimeSlotAvailability = () => {
    if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
      return true; // No slots selected, so no conflicts
    }

    const cooldownMinutes = placeDetail.cooldown || 0;

    // Check each selected time slot for conflicts
    for (const selectedSlot of selectedCalendarDates) {
      const conflictingSlot = bookedTimeSlots.find(bookedSlot => {
        // Skip if not the same date
        if (bookedSlot.date !== selectedSlot.date) return false;
        
        // Convert times to hours for comparison
        const [selectedStartHour] = selectedSlot.startTime.split(':').map(Number);
        const [selectedEndHour] = selectedSlot.endTime.split(':').map(Number);
        const [bookedStartHour] = bookedSlot.startTime.split(':').map(Number);
        const [bookedEndHour] = bookedSlot.endTime.split(':').map(Number);
        
        // Calculate cooldown period after the booking
        const cooldownHours = cooldownMinutes / 60;
        const cooldownEndHour = bookedEndHour + cooldownHours;
        
        // Check for overlap with the actual booking
        const hasBookingOverlap = (selectedStartHour < bookedEndHour && selectedEndHour > bookedStartHour);
        
        // Check for overlap with the cooldown period
        const hasCooldownOverlap = (selectedStartHour < cooldownEndHour && selectedEndHour > bookedEndHour);
        
        return hasBookingOverlap || hasCooldownOverlap;
      });
      
      if (conflictingSlot) {
        return false; // Found a conflict
      }
    }
    
    return true; // No conflicts found
  };

  async function handleReserve(event) {
    event.preventDefault();
    setError("");

    // Validate required fields
    const { isValid, errorMessage } = validateForm(
      { 
        guestName, 
        guestPhone, 
        numOfGuests 
      },
      {
        guestName: { 
          required: true, 
          errorMessage: "Please provide your name"
        },
        guestPhone: { 
          required: true, 
          customValidation: (value) => {
            if (!value) return "Please provide your phone number for contact";
            if (!isPossiblePhoneNumber(value)) return "Please enter a valid phone number";
            return null;
          }
        },
        numOfGuests: { 
          type: "number", 
          required: true,
          min: 1, 
          max: placeDetail.maxGuests,
          minErrorMessage: "Number of guests must be at least 1",
          maxErrorMessage: `Maximum capacity is ${placeDetail.maxGuests} people`
        }
      }
    );
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }

    // Check if calendar dates are selected
    if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
      setError("Please select dates and time slots from the calendar above");
      return;
    }

    // Check if selected time slots are available
    if (!validateTimeSlotAvailability()) {
      setError("Selected time slots are not available. Please choose different times.");
      return;
    }

    try {
      // Check if user is logged in
      if (!user) {
        // Store booking selections in sessionStorage for after login
        sessionStorage.setItem('bookingSelections', JSON.stringify({
          selectedCalendarDates,
          numOfGuests,
          guestName,
          guestPhone,
          placeId: placeDetail.id
        }));
        
        // Redirect to login with return URL
        handleLoginRedirect();
        return;
        setError("Please log in to book a conference room");
        return;
      }

      // Check if user is not the owner (hosts shouldn't book their own rooms)
      if (user.id === placeDetail.ownerId) {
        setError("You cannot book your own conference room");
        return;
      }

      // Check if user is a client (only clients can book)
      if (user.userType !== 'client') {
        setError("Only clients can book conference rooms. Hosts and agents cannot make bookings.");
        return;
      }

      // Calendar-based booking
      const finalTotalPrice = totalPrice;
      const bookingData = {
        place: placeDetail.id,
        selectedTimeSlots: selectedCalendarDates, // Send the detailed time slots
        numOfGuests,
        guestName,
        guestPhone,
        totalPrice: finalTotalPrice,
        bookingType: 'calendar' // Indicate this is a calendar-based booking
      };

      const response = await api.post("/bookings", bookingData);

      notify("Booking request submitted successfully", "success");
      setRedirect("/account/bookings");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to make reservation. Please try again.";
      setError(errorMsg);
    }
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  if (!user) {
    return (
      <div className="bg-white p-5 rounded-xl border shadow-md">
        <div className="text-left pb-1">
          <PriceDisplay 
            price={placeDetail.price} 
            currency={placeDetail.currency} 
            bold={true}
            className="text-2xl mr-1 inline-block"
          /> per hour
          {placeDetail.fullDayDiscountPrice > 0 && (
            <div className="text-sm text-green-600 mt-1">
              Full day ({placeDetail.fullDayHours}h): <PriceDisplay 
                price={placeDetail.fullDayDiscountPrice} 
                currency={placeDetail.currency} 
                bold={true}
                className="inline-block"
              />
            </div>
          )}
        </div>

        {/* Calendar-based booking information for unauthorized users */}
        {selectedCalendarDates && selectedCalendarDates.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Selected Time Slots
            </h4>
            <div className="space-y-1 text-sm text-blue-800">
              {selectedCalendarDates.map((dateSlot, index) => (
                <div key={index} className="flex justify-between">
                  <span>{dateSlot.formattedDate}</span>
                  <span>{formatHourTo12(dateSlot.startTime)} - {formatHourTo12(dateSlot.endTime)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="flex justify-between font-medium text-blue-900">
                <span>Total Hours:</span>
                <span>{totalHours}h</span>
              </div>
            </div>
          </div>
        )}

        {/* Helpful message when no calendar selections */}
        {(!selectedCalendarDates || selectedCalendarDates.length === 0) && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-amber-600 mt-0.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-amber-800">Select specific time slots for pricing</p>
                <p className="text-amber-700 mt-1">Use the calendar above to select individual dates and time slots to see the total cost.</p>
              </div>
            </div>
          </div>
        )}

        <div className="my-2 border rounded-xl">
          {/* Number of Attendees for unauthorized users */}
          <div className="px-3 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                </svg>
                <label className="font-medium text-gray-700">
                  Attendees
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNumOfGuests(Math.max(1, parseInt(numOfGuests) - 1))}
                  disabled={numOfGuests <= 1}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={numOfGuests}
                  onChange={(event) => setNumOfGuests(Math.max(1, Math.min(placeDetail.maxGuests, parseInt(event.target.value) || 1)))}
                  min="1"
                  max={placeDetail.maxGuests}
                  className="w-16 text-center border border-gray-300 rounded-lg py-1 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setNumOfGuests(Math.min(placeDetail.maxGuests, parseInt(numOfGuests) + 1))}
                  disabled={numOfGuests >= placeDetail.maxGuests}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
            {placeDetail.maxGuests && (
              <p className="text-gray-500 text-xs ml-7 mt-2">
                Maximum capacity: {placeDetail.maxGuests} people
              </p>
            )}
          </div>
          
          {/* Pricing breakdown for unauthorized users */}
          {selectedCalendarDates && selectedCalendarDates.length > 0 && totalHours > 0 && (
            <div className="border-t">
              <div className="border-b">
                {/* Calendar-based pricing breakdown */}
                {breakdown.length > 0 && (
                  <>
                    {breakdown.map((item, index) => (
                      <div key={index} className="flex px-3 py-2 justify-between items-center text-gray-600 text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.date}</p>
                          <p className="text-xs text-gray-500">{item.timeSlot} • {item.priceType}</p>
                        </div>
                        <p className="">
                          <PriceDisplay 
                            price={item.price} 
                            currency={placeDetail.currency} 
                            bold={false}
                          />
                        </p>
                      </div>
                    ))}
                    <div className="flex px-3 py-3 justify-between items-center text-gray-600 border-t">
                      <p className="underline font-medium">Subtotal ({totalHours} hours)</p>
                      <p className="">
                        <PriceDisplay 
                          price={totalPrice} 
                          currency={placeDetail.currency} 
                          bold={false}
                        />
                      </p>
                    </div>
                  </>
                )}
                
                <div className="flex px-3 pb-4 justify-between items-center text-gray-600">
                  <p className="underline">Service fee</p>
                  <p className="">
                    <PriceDisplay 
                      price={20} 
                      currency={placeDetail.currency} 
                      bold={false}
                    />
                  </p>
                </div>
              </div>
              <div>
                <div className="flex px-3 py-4 justify-between items-center">
                  <p className="underline">Total</p>
                  <p className="">
                    <PriceDisplay 
                      price={totalPrice + 20} 
                      currency={placeDetail.currency} 
                      bold={true}
                    />
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Login to book button */}
        <button 
          onClick={handleLoginRedirect}
          className="block w-full bg-primary text-white py-3 px-6 rounded-lg text-center font-medium hover:bg-primary-dark transition-colors"
        >
          {selectedCalendarDates && selectedCalendarDates.length > 0
            ? "Login to Book Selected Time Slots"
            : "Login to Book This Conference Room"
          }
        </button>

        <p className="mt-3 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <button 
            onClick={() => {
              // Store the same booking selections for register flow
              if (selectedCalendarDates && selectedCalendarDates.length > 0) {
                sessionStorage.setItem('bookingSelections', JSON.stringify({
                  selectedCalendarDates,
                  numOfGuests,
                  placeId: placeDetail.id
                }));
              }
              const currentPath = location.pathname + location.search;
              window.location.href = `/register?redirect=${encodeURIComponent(currentPath)}`;
            }}
            className="underline text-primary hover:text-primary-dark bg-transparent border-none cursor-pointer"
          >
            Sign up here
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => handleReserve(event)}>
      <div className="bg-white p-5 rounded-xl border shadow-md">
        <div className="text-left pb-1">
          <PriceDisplay 
            price={placeDetail.price} 
            currency={placeDetail.currency} 
            bold={true}
            className="text-2xl mr-1 inline-block"
          /> per hour
          {placeDetail.fullDayDiscountPrice > 0 && (
            <div className="text-sm text-green-600 mt-1">
              Full day ({placeDetail.fullDayHours}h): <PriceDisplay 
                price={placeDetail.fullDayDiscountPrice} 
                currency={placeDetail.currency} 
                bold={true}
                className="inline-block"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded-lg mb-2 text-sm">
            {error}
          </div>
        )}

        {/* Calendar-based booking information */}
        {selectedCalendarDates && selectedCalendarDates.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Selected Time Slots
            </h4>
            <div className="space-y-1 text-sm text-blue-800">
              {selectedCalendarDates.map((dateSlot, index) => (
                <div key={index} className="flex justify-between">
                  <span>{dateSlot.formattedDate}</span>
                  <span>{formatHourTo12(dateSlot.startTime)} - {formatHourTo12(dateSlot.endTime)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="flex justify-between font-medium text-blue-900">
                <span>Total Hours:</span>
                <span>{totalHours}h</span>
              </div>
            </div>
          </div>
        )}

        {/* Helpful message when no calendar selections */}
        {(!selectedCalendarDates || selectedCalendarDates.length === 0) && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-amber-600 mt-0.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-amber-800">Select specific time slots for better pricing</p>
                <p className="text-amber-700 mt-1">Use the calendar above to select individual dates and time slots. This allows for precise booking and may qualify for full-day discounts.</p>
              </div>
            </div>
          </div>
        )}

        <div className="my-2 border rounded-xl">
          {/* Compact Booking Details Section */}
          <div className="px-3 py-4 space-y-4">
            {/* Number of Attendees - Compact Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                </svg>
                <label htmlFor="numOfGuests" className="font-medium text-gray-700">
                  Attendees
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNumOfGuests(Math.max(1, parseInt(numOfGuests) - 1))}
                  disabled={numOfGuests <= 1}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                </button>
                <input
                  id="numOfGuests"
                  type="number"
                  value={numOfGuests}
                  onChange={(event) => setNumOfGuests(Math.max(1, Math.min(placeDetail.maxGuests, parseInt(event.target.value) || 1)))}
                  min="1"
                  max={placeDetail.maxGuests}
                  className="w-16 text-center border border-gray-300 rounded-lg py-1 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setNumOfGuests(Math.min(placeDetail.maxGuests, parseInt(numOfGuests) + 1))}
                  disabled={numOfGuests >= placeDetail.maxGuests}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
            {placeDetail.maxGuests && (
              <p className="text-gray-500 text-xs ml-7">
                Maximum capacity: {placeDetail.maxGuests} people
              </p>
            )}

            {/* Contact Information - Compact Grid */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Your Full Name
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <input
                    id="guestName"
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Your full name"
                    className={`w-full ${guestName ? 'pl-3' : 'pl-10'} pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  />
                </div>
                
                <div className="relative">
                  <CustomPhoneInput
                    value={guestPhone}
                    onChange={setGuestPhone}
                    defaultCountry="UZ"
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing breakdown */}
          {selectedCalendarDates && selectedCalendarDates.length > 0 && totalHours > 0 && (
            <div className="border-t">
              <div className="border-b">
                {/* Calendar-based pricing breakdown */}
                {breakdown.length > 0 && (
                  <>
                    {breakdown.map((item, index) => (
                      <div key={index} className="flex px-3 py-2 justify-between items-center text-gray-600 text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.date}</p>
                          <p className="text-xs text-gray-500">{item.timeSlot} • {item.priceType}</p>
                        </div>
                        <p className="">
                          <PriceDisplay 
                            price={item.price} 
                            currency={placeDetail.currency} 
                            bold={false}
                          />
                        </p>
                      </div>
                    ))}
                    <div className="flex px-3 py-3 justify-between items-center text-gray-600 border-t">
                      <p className="underline font-medium">Subtotal ({totalHours} hours)</p>
                      <p className="">
                        <PriceDisplay 
                          price={totalPrice} 
                          currency={placeDetail.currency} 
                          bold={false}
                        />
                      </p>
                    </div>
                  </>
                )}
                
                <div className="flex px-3 pb-4 justify-between items-center text-gray-600">
                  <p className="underline">Service fee</p>
                  <p className="">
                    <PriceDisplay 
                      price={20} 
                      currency={placeDetail.currency} 
                      bold={false}
                    />
                  </p>
                </div>
              </div>
              <div>
                <div className="flex px-3 py-4 justify-between items-center">
                  <p className="underline">Total</p>
                  <p className="">
                    <PriceDisplay 
                      price={totalPrice + 20} 
                      currency={placeDetail.currency} 
                      bold={true}
                    />
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className={buttonDisabled ? "normal" : "primary"}
          disabled={buttonDisabled}
        >
          {buttonDisabled 
            ? "Not available to book" 
            : selectedCalendarDates && selectedCalendarDates.length > 0
              ? "Book Selected Time Slots"
              : "Select Time Slots to Book"
          }
        </button>
      </div>
    </form>
  );
}
