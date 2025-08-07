import { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomPhoneInput, { isPossiblePhoneNumber } from "./CustomPhoneInput";
import api from "../utils/api";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";
import { validateForm } from "../utils/formUtils";
import PriceDisplay from "./PriceDisplay";
import SelectedTimeSlots from "./SelectedTimeSlots";
import PricingBreakdown from "./PricingBreakdown";
import ProtectionPlanOption from "./ProtectionPlanOption";
import { isTimeRangeAvailable } from "../utils/TimeUtils";
import { calculateBookingPricing } from "../utils/pricingCalculator";
import { isProtectionPlanAvailable } from "../utils/refundPolicyUtils";

export default function BookingWidget({ placeDetail, buttonDisabled, selectedCalendarDates = [] }) {
  const { t } = useTranslation('booking');
  const [numOfGuests, setNumOfGuests] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [redirect, setRedirect] = useState();
  const [error, setError] = useState("");
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [protectionPlanSelected, setProtectionPlanSelected] = useState(false);
  const [protectionPlanFee, setProtectionPlanFee] = useState(0);
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      setGuestName(user.name);
      // Auto-populate phone number if user has one
      if (user.phoneNumber) {
        setGuestPhone(user.phoneNumber);
      }
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

  const pricingData = calculateBookingPricing(selectedCalendarDates, placeDetail, protectionPlanSelected);
  const { totalHours, totalPrice, breakdown, protectionPlanFee: calculatedProtectionFee, finalTotal } = pricingData;

  // Handle protection plan selection
  const handleProtectionPlanChange = (selected, fee) => {
    setProtectionPlanSelected(selected);
    setProtectionPlanFee(fee);
  };

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
  const validateTimeSlotAvailability = async () => {
    if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
      return true; // No slots selected, so no conflicts
    }

    const cooldownMinutes = placeDetail.cooldown || 0;

    // Check each selected time slot for conflicts using timezone-aware validation
    for (const selectedSlot of selectedCalendarDates) {
      const isAvailable = await isTimeRangeAvailable(
        selectedSlot.date,
        selectedSlot.startTime,
        selectedSlot.endTime,
        placeDetail.id,
        bookedTimeSlots,
        cooldownMinutes
      );
      
      if (!isAvailable) {
        return false; // Found a conflict using timezone-aware validation
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
          errorMessage: t("validation.errors.nameRequired")
        },
        guestPhone: { 
          required: true, 
          customValidation: (value) => {
            if (!value) return t("validation.errors.phoneRequired");
            if (!isPossiblePhoneNumber(value)) return t("validation.errors.phoneInvalid");
            return null;
          }
        },
        numOfGuests: { 
          type: "number", 
          required: true,
          min: 1, 
          max: placeDetail.maxGuests,
          minErrorMessage: t("validation.errors.attendeesRequired"),
          maxErrorMessage: t("validation.errors.attendeesMax", { maxGuests: placeDetail.maxGuests })
        }
      }
    );
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }

    // Check if calendar dates are selected
    if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
      setError(t("validation.errors.timeSlotsRequired"));
      return;
    }

    // Check if selected time slots are available
    const isAvailable = await validateTimeSlotAvailability();
    if (!isAvailable) {
      setError(t("validation.errors.timeSlotsUnavailable"));
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
        setError(t("validation.errors.loginRequired"));
        return;
      }

      // Check if user is not the owner (hosts shouldn't book their own rooms)
      if (user.id === placeDetail.ownerId) {
        setError(t("validation.errors.cannotBookOwn"));
        return;
      }

      // Check if user is a client (only clients can book)
      if (user.userType !== 'client') {
        setError(t("validation.errors.clientsOnly"));
        return;
      }

      // Calendar-based booking
      const bookingData = {
        place: placeDetail.id,
        selectedTimeSlots: selectedCalendarDates, // Send the detailed time slots
        numOfGuests,
        guestName,
        guestPhone,
        totalPrice: totalPrice, // Base booking price
        protectionPlanSelected,
        protectionPlanFee: protectionPlanSelected ? calculatedProtectionFee : 0,
        finalTotal: finalTotal, // Total including all fees
        bookingType: 'calendar' // Indicate this is a calendar-based booking
      };

      const response = await api.post("/bookings", bookingData);

      notify(t("notifications.success"), "success");
      setRedirect("/account/bookings");
    } catch (err) {
      const errorMsg = err.response?.data?.error || t("validation.errors.reservationFailed");
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
        <SelectedTimeSlots 
          selectedCalendarDates={selectedCalendarDates}
          totalHours={totalHours}
          placeDetail={placeDetail}
          isAuthorized={false}
        />

        <div className="my-2 border rounded-xl">
          {/* Number of Attendees for unauthorized users */}
          <div className="px-3 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                </svg>
                <label className="font-medium text-gray-700">
                  {t("widget.attendees.label")}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNumOfGuests(Math.max(0, parseInt(numOfGuests) - 1))}
                  disabled={numOfGuests <= 0}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={numOfGuests}
                  onChange={(event) => setNumOfGuests(Math.max(0, Math.min(placeDetail.maxGuests, parseInt(event.target.value) || 0)))}
                  min="0"
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
                {t("widget.attendees.maximum")}: {placeDetail.maxGuests} {t("widget.attendees.people")}
              </p>
            )}
          </div>
          
          {/* Pricing breakdown for unauthorized users */}
          <PricingBreakdown 
            selectedCalendarDates={selectedCalendarDates}
            totalHours={totalHours}
            totalPrice={totalPrice}
            breakdown={breakdown}
            placeDetail={placeDetail}
            protectionPlanFee={calculatedProtectionFee}
            finalTotal={finalTotal}
          />

          {/* Protection Plan Option for unauthorized users */}
          {totalPrice > 0 && (
            <div className="mx-3 mb-3">
              <ProtectionPlanOption
                placeDetail={placeDetail}
                totalBookingPrice={totalPrice}
                isSelected={protectionPlanSelected}
                onSelectionChange={handleProtectionPlanChange}
              />
            </div>
          )}
        </div>

        {/* Login to book button */}
        <button 
          onClick={handleLoginRedirect}
          className="block w-full bg-primary text-white py-2 px-4 sm:py-2.5 sm:px-6 rounded-lg text-center font-medium hover:bg-primary/90 transition-colors"
        >
          {selectedCalendarDates && selectedCalendarDates.length > 0
            ? t("widget.buttons.login")
            : t("widget.buttons.loginGeneral")
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
            {t("widget.buttons.signUp")}
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
          /> {t("widget.pricing.perHour")}
          {placeDetail.fullDayDiscountPrice > 0 && (
            <div className="text-sm text-green-600 mt-1">
              {t("widget.pricing.fullDay")} ({placeDetail.fullDayHours}h): <PriceDisplay 
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
        <SelectedTimeSlots 
          selectedCalendarDates={selectedCalendarDates}
          totalHours={totalHours}
          placeDetail={placeDetail}
          isAuthorized={true}
        />

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
                  {t("widget.attendees.label")}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNumOfGuests(Math.max(0, parseInt(numOfGuests) - 1))}
                  disabled={numOfGuests <= 0}
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
                  onChange={(event) => setNumOfGuests(Math.max(0, Math.min(placeDetail.maxGuests, parseInt(event.target.value) || 0)))}
                  min="0"
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
                {t("widget.attendees.maximum")}: {placeDetail.maxGuests} {t("widget.attendees.people")}
                {numOfGuests === 0 && (
                  <span className="block text-orange-600 font-medium mt-1">
                    {t("widget.attendees.selectNumber")}
                  </span>
                )}
              </p>
            )}

            {/* Contact Information - Compact Grid */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {t("widget.contactInfo.title")}
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <input
                    id="guestName"
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder={t("widget.contactInfo.fullName")}
                    className={`w-full ${guestName ? 'pl-3' : 'pl-10'} pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  />
                </div>
                
                <div className="relative">
                  <CustomPhoneInput
                    value={guestPhone}
                    onChange={setGuestPhone}
                    defaultCountry="UZ"
                    placeholder={t("widget.contactInfo.phoneNumber")}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing breakdown */}
          <PricingBreakdown 
            selectedCalendarDates={selectedCalendarDates}
            totalHours={totalHours}
            totalPrice={totalPrice}
            breakdown={breakdown}
            placeDetail={placeDetail}
            protectionPlanFee={calculatedProtectionFee}
            finalTotal={finalTotal}
          />

          {/* Protection Plan Option for authorized users */}
          {totalPrice > 0 && (
            <div className="px-3 pb-3">
              <ProtectionPlanOption
                placeDetail={placeDetail}
                totalBookingPrice={totalPrice}
                isSelected={protectionPlanSelected}
                onSelectionChange={handleProtectionPlanChange}
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          className={buttonDisabled ? "normal" : "primary"}
          disabled={buttonDisabled}
        >
          {buttonDisabled 
            ? t("widget.buttons.notAvailable")
            : selectedCalendarDates && selectedCalendarDates.length > 0
              ? t("widget.buttons.bookSelectedSlots")
              : t("widget.buttons.selectTimeSlots")
          }
        </button>
      </div>
    </form>
  );
}
