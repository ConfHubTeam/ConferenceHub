import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import BookingCard from "../components/BookingCard";
import { useLocation } from "react-router-dom";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredBookings, setFilteredBookings] = useState([]);
  const location = useLocation();
  
  // Extract userId from query params if present (for agent filtering)
  const params = new URLSearchParams(location.search);
  const userId = params.get('userId');

  // Fetch all bookings
  useEffect(() => {
    loadBookings();
  }, [userId]);

  // Load bookings from API
  async function loadBookings() {
    setLoading(true);
    try {
      // Get endpoint based on if we're filtering by user
      const endpoint = userId 
        ? `/bookings?userId=${userId}` 
        : "/bookings";
        
      const { data } = await api.get(endpoint);
      setBookings(data);
      setFilteredBookings(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setLoading(false);
    }
  }

  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = [...bookings];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        // Search in place title and address
        const placeMatch = booking.place && (
          booking.place.title.toLowerCase().includes(term) ||
          booking.place.address.toLowerCase().includes(term)
        );
        
        // For agents, also search in user name and email
        const userMatch = user?.userType === 'agent' && booking.user && (
          booking.user.name.toLowerCase().includes(term) ||
          booking.user.email.toLowerCase().includes(term)
        );
        
        // For agents, also search in host name and email
        const hostMatch = user?.userType === 'agent' && 
          booking.place?.owner && (
            booking.place.owner.name.toLowerCase().includes(term) ||
            booking.place.owner.email.toLowerCase().includes(term)
          );
          
        return placeMatch || userMatch || hostMatch;
      });
    }
    
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings, user]);

  // Handle booking updates
  const handleBookingUpdate = (updatedBooking) => {
    if (updatedBooking.status === 'rejected') {
      // Update the booking status in the list
      setBookings(bookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      ));
    } else {
      // Update the booking in the list
      setBookings(bookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      ));
    }
  };

  // Group bookings by status for filtered bookings
  const pendingBookings = filteredBookings.filter(booking => booking.status === 'pending');
  const approvedBookings = filteredBookings.filter(booking => booking.status === 'approved');
  const rejectedBookings = filteredBookings.filter(booking => booking.status === 'rejected');

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
        {/* Agent view */}
        {user?.userType === 'agent' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">
              {userId ? 'User Bookings' : 'All Bookings'} 
              {userId && <span className="ml-2 text-sm text-gray-500">(User ID: {userId})</span>}
            </h1>
            
            {/* Search and filter controls */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-1/2">
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setStatusFilter('pending')}
                    className={`px-4 py-2 rounded-full text-sm ${statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Pending
                  </button>
                  <button 
                    onClick={() => setStatusFilter('approved')}
                    className={`px-4 py-2 rounded-full text-sm ${statusFilter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Approved
                  </button>
                  <button 
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-4 py-2 rounded-full text-sm ${statusFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">No Bookings Found</h3>
                <p className="text-blue-600">
                  There are no bookings matching your search criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Display bookings by status */}
                {statusFilter === 'all' ? (
                  <>
                    {/* Pending bookings section */}
                    {pendingBookings.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h2 className="text-xl font-semibold mb-4">Pending Bookings ({pendingBookings.length})</h2>
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
                    
                    {/* Rejected bookings section */}
                    {rejectedBookings.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h2 className="text-xl font-semibold mb-4">Rejected Bookings ({rejectedBookings.length})</h2>
                        <div className="space-y-4">
                          {rejectedBookings.map(booking => (
                            <BookingCard 
                              key={booking.id} 
                              bookingDetail={booking} 
                              onBookingUpdate={handleBookingUpdate}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`
                    p-4 rounded-lg border
                    ${statusFilter === 'pending' ? 'bg-yellow-50 border-yellow-200' : 
                     statusFilter === 'approved' ? 'bg-green-50 border-green-200' :
                     'bg-red-50 border-red-200'}
                  `}>
                    <h2 className="text-xl font-semibold mb-4">
                      {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings ({filteredBookings.length})
                    </h2>
                    <div className="space-y-4">
                      {filteredBookings.map(booking => (
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
        
        {/* Host view */}
        {user?.userType === 'host' && (
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
        )}
        
        {/* Client view */}
        {user?.userType === 'client' && (
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
