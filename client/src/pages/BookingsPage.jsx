import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import BookingCard from "../components/BookingCard";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  // Fetch all bookings
  useEffect(() => {
    loadBookings();
  }, []);

  // Load bookings from API
  async function loadBookings() {
    setLoading(true);
    try {
      const { data } = await api.get("/bookings");
      setBookings(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setLoading(false);
    }
  }

  // Handle booking updates
  const handleBookingUpdate = (updatedBooking) => {
    if (updatedBooking.status === 'rejected') {
      // Remove the booking from the list if it's rejected/cancelled
      setBookings(bookings.filter(booking => booking.id !== updatedBooking.id));
    } else {
      // Update the booking in the list
      setBookings(bookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      ));
    }
  };

  // Group bookings by status
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const approvedBookings = bookings.filter(booking => booking.status === 'approved');

  if (loading) {
    return (
      <div>
        <AccountNav />
        <div className="px-8 py-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav />
      <div className="px-8">
        {user?.userType === 'host' ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">Conference Room Booking Requests</h1>

            {bookings.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-yellow-700 mb-2">No Booking Requests Yet</h3>
                <p className="text-yellow-600">
                  You don't have any booking requests for your conference rooms yet. 
                  When clients book your conference rooms, their requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending bookings section */}
                {pendingBookings.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h2 className="text-xl font-semibold mb-4">Pending Requests ({pendingBookings.length})</h2>
                    <div className="space-y-4">
                      {pendingBookings.map(booking => (
                        <BookingCard 
                          key={booking.id} 
                          bookingDetail={booking} 
                          onBookingUpdate={handleBookingUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved bookings section */}
                {approvedBookings.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h2 className="text-xl font-semibold mb-4">Approved Bookings ({approvedBookings.length})</h2>
                    <div className="space-y-4">
                      {approvedBookings.map(booking => (
                        <BookingCard 
                          key={booking.id} 
                          bookingDetail={booking} 
                          onBookingUpdate={handleBookingUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold mb-4">My Conference Room Bookings</h1>
            
            {bookings.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">No Bookings Yet</h3>
                <p className="text-blue-600 mb-4">
                  You haven't booked any conference rooms yet. Browse available rooms and make a booking.
                </p>
                <a href="/" className="bg-primary text-white py-2 px-4 rounded-full inline-block">
                  Find Conference Rooms
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending bookings section */}
                {pendingBookings.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h2 className="text-xl font-semibold mb-4">Pending Approvals ({pendingBookings.length})</h2>
                    <div className="space-y-4">
                      {pendingBookings.map(booking => (
                        <BookingCard 
                          key={booking.id} 
                          bookingDetail={booking} 
                          onBookingUpdate={handleBookingUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved bookings section */}
                {approvedBookings.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h2 className="text-xl font-semibold mb-4">Confirmed Bookings ({approvedBookings.length})</h2>
                    <div className="space-y-4">
                      {approvedBookings.map(booking => (
                        <BookingCard 
                          key={booking.id} 
                          bookingDetail={booking} 
                          onBookingUpdate={handleBookingUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
