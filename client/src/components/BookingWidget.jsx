import { useContext, useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Navigate } from "react-router-dom";
import api from "../utils/api";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";
import { validateForm } from "../utils/formUtils";
import PriceDisplay from "./PriceDisplay";

export default function BookingWidget({ placeDetail, buttonDisabled }) {
  const [numOfGuests, setNumOfGuests] = useState(1);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [redirect, setRedirect] = useState();
  const [error, setError] = useState("");
  const { user } = useContext(UserContext);
  const { notify } = useNotification();

  useEffect(() => {
    if (user) {
      setGuestName(user.name);
    }

    // Set default dates if available from the conference room
    if (placeDetail?.startDate && !checkInDate) {
      const defaultStart = new Date(placeDetail.startDate);
      setCheckInDate(defaultStart.toISOString().split("T")[0]);
    }

    if (placeDetail?.endDate && !checkOutDate) {
      const defaultEnd = new Date(placeDetail.endDate);
      setCheckOutDate(defaultEnd.toISOString().split("T")[0]);
    }
  }, [user, placeDetail]);

  let hours = 0;

  if (checkInDate && checkOutDate) {
    // Calculate hours for conference room bookings
    hours =
      differenceInCalendarDays(
        new Date(checkOutDate),
        new Date(checkInDate)
      ) * 24; // Simple calculation, can be refined for actual hour usage

    if (hours <= 0) {
      hours = 1; // Minimum booking of 1 hour
    }
  }

  async function handleReserve(event) {
    event.preventDefault();
    setError("");

    // Use the form validation util
    const { isValid, errorMessage } = validateForm(
      { 
        checkInDate, 
        checkOutDate, 
        guestName, 
        guestPhone, 
        numOfGuests 
      },
      {
        checkInDate: { 
          required: true, 
          errorMessage: "Please select a check-in date"
        },
        checkOutDate: { 
          required: true, 
          errorMessage: "Please select a check-out date"
        },
        guestName: { 
          required: true, 
          errorMessage: "Please provide your name"
        },
        guestPhone: { 
          required: true, 
          errorMessage: "Please provide your phone number for contact"
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

    try {
      // Check if user is logged in
      if (!user) {
        setError("Please log in to book a conference room");
        return;
      }

      // Check if user is not the owner (hosts shouldn't book their own rooms)
      if (user.id === placeDetail.ownerId) {
        setError("You cannot book your own conference room");
        return;
      }

      const totalPrice = placeDetail.price * hours;

      const response = await api.post("/bookings", {
        place: placeDetail.id,
        checkInDate,
        checkOutDate,
        numOfGuests,
        guestName,
        guestPhone,
        totalPrice,
      });

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
          <span className="font-bold text-2xl">${placeDetail.price}</span> per
          hour
        </div>
        <p className="my-4 text-center">
          Please{" "}
          <a href="/login" className="underline text-primary">
            login
          </a>{" "}
          to book this conference room
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
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded-lg mb-2 text-sm">
            {error}
          </div>
        )}

        <div className="my-2 border rounded-xl">
          <div className="flex border-b">
            <div className="px-3 py-4 w-1/2">
              <label htmlFor="checkInDate">Start date: </label>
              <input
                id="checkInDate"
                type="date"
                className="cursor-pointer"
                value={checkInDate}
                onChange={(event) => setCheckInDate(event.target.value)}
                min={
                  placeDetail.startDate
                    ? placeDetail.startDate.split("T")[0]
                    : undefined
                }
                max={
                  placeDetail.endDate
                    ? placeDetail.endDate.split("T")[0]
                    : undefined
                }
              />
            </div>
            <div className="px-3 py-4 border-l">
              <label htmlFor="checkOutDate">End date: </label>
              <input
                id="checkOutDate"
                type="date"
                className="cursor-pointer"
                value={checkOutDate}
                onChange={(event) => setCheckOutDate(event.target.value)}
                min={
                  checkInDate ||
                  (placeDetail.startDate
                    ? placeDetail.startDate.split("T")[0]
                    : undefined)
                }
                max={
                  placeDetail.endDate
                    ? placeDetail.endDate.split("T")[0]
                    : undefined
                }
              />
            </div>
          </div>
          <div className="px-3 py-4 border-b">
            <label htmlFor="numOfGuests">Number of attendees</label>
            <input
              id="numOfGuests"
              type="number"
              value={numOfGuests}
              onChange={(event) => setNumOfGuests(event.target.value)}
              placeholder="1"
              min="1"
              max={placeDetail.maxGuests}
            />
            {placeDetail.maxGuests && (
              <p className="text-gray-500 text-xs mt-1">
                Maximum capacity: {placeDetail.maxGuests} people
              </p>
            )}
          </div>
          <div className="px-3 py-4">
            <label htmlFor="guestName">Your full name</label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Jane Doe"
            />
            <label htmlFor="guestPhone">Phone number</label>
            <input
              id="guestPhone"
              type="text"
              value={guestPhone}
              onChange={(event) => setGuestPhone(event.target.value)}
              placeholder="+44012345678910"
            />
          </div>
          {hours > 0 && (
            <div>
              <div className="border-b border-t">
                <div className="flex px-3 py-4 justify-between items-center text-gray-600">
                  <p className="underline">
                    <PriceDisplay 
                      price={placeDetail.price} 
                      currency={placeDetail.currency} 
                      bold={false}
                      className="inline-block"
                    /> x {hours} hours
                  </p>
                  <p className="">
                    <PriceDisplay 
                      price={placeDetail.price * hours} 
                      currency={placeDetail.currency} 
                      bold={false}
                    />
                  </p>
                </div>
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
                      price={hours && placeDetail.price * hours + 20} 
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
          {buttonDisabled ? "Not available to book" : "Request to Book"}
        </button>
      </div>
    </form>
  );
}
