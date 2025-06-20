import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import BookingRequestCard from "../components/BookingRequestCard";
import Pagination from "../components/Pagination";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../components/NotificationContext";
import { useBookingNotifications } from "../contexts/BookingNotificationContext";
import BookingNotificationBanner from "../components/BookingNotificationBanner";
import BookingFilters from "../components/BookingFilters";
import BookingStatsCards from "../components/BookingStatsCards";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [filteredBookings, setFilteredBookings] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { markAsViewed, markAllAsViewed, loadNotificationCounts } = useBookingNotifications();
  
  // Agent-specific state for user filtering
  const [selectedUserId, setSelectedUserId] = useState("");
  
  // Track when user visits the page to dismiss notifications
  useEffect(() => {
    if (!user) return;
    
    // For hosts/agents, DON'T automatically mark as viewed - let them dismiss the banner
    // For clients, mark notifications as viewed when they see the filtered bookings
    if (user.userType === 'client') {
      const currentBookings = getCurrentPageItems();
      const approvedBookings = currentBookings.filter(b => b.status === 'approved');
      const rejectedBookings = currentBookings.filter(b => b.status === 'rejected');
      
      if (approvedBookings.length > 0 && statusFilter === 'approved') {
        markAsViewed('approved');
      }
      if (rejectedBookings.length > 0 && statusFilter === 'rejected') {
        markAsViewed('rejected');
      }
      // If showing all bookings, mark both as viewed if they exist
      if (statusFilter === 'all') {
        if (approvedBookings.length > 0) markAsViewed('approved');
        if (rejectedBookings.length > 0) markAsViewed('rejected');
      }
    }
  }, [user, markAsViewed, statusFilter, filteredBookings]);
  
  // Extract userId from query params if present (for agent filtering)
  const params = new URLSearchParams(location.search);
  const userId = params.get('userId');
  
  // Shared state for pagination and sorting (used by all user types)
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Set initial status filter based on user type (all user types default to pending)
  useEffect(() => {
    setStatusFilter('pending');
  }, [user?.userType]);

  // Set selected user ID from URL params
  useEffect(() => {
    if (userId && user?.userType === 'agent') {
      setSelectedUserId(userId);
    }
  }, [userId, user]);

  // Fetch all bookings
  useEffect(() => {
    loadBookings();
  }, [selectedUserId]);

  // Load bookings from API
  async function loadBookings() {
    setLoading(true);
    try {
      // Get endpoint based on if we're filtering by user
      const endpoint = selectedUserId 
        ? `/bookings?userId=${selectedUserId}` 
        : "/bookings";
        
      const { data } = await api.get(endpoint);
      setBookings(data);
      setFilteredBookings(data);
      
      // Calculate stats for all user types
      calculateStats(data);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading bookings:", error);
      if (user?.userType === "host") {
        notify("Error loading booking requests", "error");
      }
      setLoading(false);
    }
  }

  // Calculate summary statistics for hosts
  function calculateStats(bookingData) {
    const stats = bookingData.reduce(
      (acc, booking) => {
        acc.total++;
        acc[booking.status]++;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, total: 0 }
    );
    setStats(stats);
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
        // Common search fields
        const placeMatch = booking.place && (
          booking.place.title.toLowerCase().includes(term) ||
          booking.place.address.toLowerCase().includes(term)
        );
        
        // Host-specific search (request ID)
        const requestIdMatch = user?.userType === 'host' && (
          booking.uniqueRequestId?.toLowerCase().includes(term) ||
          `req-${booking.id}`.toLowerCase().includes(term)
        );
        
        // For agents, also search in request ID, user name, and host name
        const agentRequestIdMatch = user?.userType === 'agent' && (
          booking.uniqueRequestId?.toLowerCase().includes(term) ||
          `req-${booking.id}`.toLowerCase().includes(term)
        );
        
        const userMatch = user?.userType === 'agent' && booking.user && (
          booking.user.name.toLowerCase().includes(term)
        );
        
        // For agents, also search in host name  
        const hostMatch = user?.userType === 'agent' && 
          booking.place?.owner && (
            booking.place.owner.name.toLowerCase().includes(term)
          );
          
        return placeMatch || requestIdMatch || userMatch || hostMatch || agentRequestIdMatch;
      });
    }

    // Apply sorting for all user types with pagination
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "totalPrice":
          aValue = parseFloat(a.totalPrice) || 0;
          bValue = parseFloat(b.totalPrice) || 0;
          break;
        case "checkInDate":
          aValue = new Date(a.checkInDate);
          bValue = new Date(b.checkInDate);
          break;
        case "place":
          aValue = a.place?.title || "";
          bValue = b.place?.title || "";
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Reset to first page when filtering
    setCurrentPage(1);
    
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings, user, sortBy, sortOrder]);

  // Handle booking updates
  const handleBookingUpdate = (updatedBooking) => {
    const updatedBookings = bookings.map(booking => 
      booking.id === updatedBooking.id ? updatedBooking : booking
    );
    setBookings(updatedBookings);
    
    // Update stats for all user types
    calculateStats(updatedBookings);
    
    // Refresh notification counts after booking update
    loadNotificationCounts();
  };

  // Get current page items for all user types with pagination
  function getCurrentPageItems() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSelectedUserId("");
    setSearchTerm("");
    setStatusFilter("pending"); // Reset to default
  };

  // Calculate pagination info for all user types
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const showingFrom = filteredBookings.length > 0 
    ? (currentPage - 1) * itemsPerPage + 1 
    : 0;
  const showingTo = Math.min(currentPage * itemsPerPage, filteredBookings.length);

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
      <div className="px-8 py-4">
        {/* Notification Banner */}
        <BookingNotificationBanner />
        
        {/* Agent view - Production-level booking management */}
        {user?.userType === 'agent' && (
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedUserId ? 'User Booking Management' : 'All Booking Management'}
              </h1>
              <p className="text-gray-600">
                {selectedUserId ? (
                  `Manage bookings for selected user (ID: ${selectedUserId})`
                ) : (
                  'Manage all booking requests across the system'
                )}
              </p>
            </div>

            {/* Summary cards */}
            <BookingStatsCards stats={stats} userType={user?.userType} />

            {/* Filters and controls */}
            <BookingFilters
              user={user}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              stats={stats}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              onClearAllFilters={clearAllFilters}
            />

            {/* Bookings list */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-4">
                  {selectedUserId ? (
                    `No bookings found for selected user.`
                  ) : searchTerm || statusFilter !== "all" ? (
                    "Try adjusting your search or filter criteria."
                  ) : (
                    "There are no bookings in the system yet."
                  )}
                </p>
                {selectedUserId && (
                  <button
                    onClick={() => setSelectedUserId("")}
                    className="text-primary hover:text-primary-dark underline text-sm"
                  >
                    View all users' bookings
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-medium text-gray-900">
                      {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings
                      <span className="ml-2 text-sm text-gray-500">({filteredBookings.length})</span>
                    </h2>
                    {selectedUserId && (
                      <p className="text-sm text-gray-500 mt-1">
                        Filtered for user ID: {selectedUserId}
                      </p>
                    )}
                  </div>
                  
                  {statusFilter === "pending" && stats.pending > 0 && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                      {stats.pending} booking{stats.pending > 1 ? "s" : ""} awaiting approval
                    </div>
                  )}
                </div>

                {/* Booking cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {getCurrentPageItems().map((booking) => (
                    <BookingRequestCard
                      key={booking.id}
                      booking={booking}
                      onBookingUpdate={handleBookingUpdate}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showingFrom={showingFrom}
                  showingTo={showingTo}
                  totalItems={filteredBookings.length}
                  itemName="bookings"
                />
              </>
            )}
          </div>
        )}
        
        {/* Host view - Production-level booking request management */}
        {user?.userType === 'host' && (
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Booking Request Management
              </h1>
              <p className="text-gray-600">
                Manage booking requests for your conference rooms efficiently
              </p>
            </div>

            {/* Summary cards */}
            <BookingStatsCards stats={stats} userType={user?.userType} />

            {/* Filters and controls */}
            <BookingFilters
              user={user}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              stats={stats}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              onClearAllFilters={clearAllFilters}
            />

            {/* Booking requests list */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No booking requests found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria." 
                    : "You don't have any booking requests yet. When clients book your conference rooms, their requests will appear here."
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests
                    <span className="ml-2 text-sm text-gray-500">({filteredBookings.length})</span>
                  </h2>
                  
                  {statusFilter === "pending" && stats.pending > 0 && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                      {stats.pending} request{stats.pending > 1 ? "s" : ""} need{stats.pending === 1 ? "s" : ""} attention
                    </div>
                  )}
                </div>

                {/* Booking cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {getCurrentPageItems().map((booking) => (
                    <BookingRequestCard
                      key={booking.id}
                      booking={booking}
                      onBookingUpdate={handleBookingUpdate}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showingFrom={showingFrom}
                  showingTo={showingTo}
                  totalItems={filteredBookings.length}
                  itemName="booking requests"
                />
              </>
            )}
          </div>
        )}
        
        {/* Client view */}
        {user?.userType === 'client' && (
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Conference Room Bookings
              </h1>
              <p className="text-gray-600">
                Manage and track your booking requests
              </p>
            </div>

            {/* Summary cards */}
            <BookingStatsCards stats={stats} userType={user?.userType} />

            {/* Filters and controls */}
            <BookingFilters
              user={user}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              stats={stats}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              onClearAllFilters={clearAllFilters}
            />

            {/* Bookings list */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria." 
                    : "You don't have any bookings yet. Browse available conference rooms and make a booking."
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <a href="/" className="bg-primary text-white py-2 px-4 rounded-lg inline-block hover:bg-primary-dark transition-colors">
                    Find Conference Rooms
                  </a>
                )}
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {statusFilter === "all" ? "All" : statusFilter === "approved" ? "Confirmed" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings
                    <span className="ml-2 text-sm text-gray-500">({filteredBookings.length})</span>
                  </h2>
                  
                  {statusFilter === "pending" && stats.pending > 0 && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                      {stats.pending} booking{stats.pending > 1 ? "s" : ""} awaiting approval
                    </div>
                  )}
                </div>

                {/* Booking cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {getCurrentPageItems().map((booking) => (
                    <BookingRequestCard
                      key={booking.id}
                      booking={booking}
                      onBookingUpdate={handleBookingUpdate}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showingFrom={showingFrom}
                  showingTo={showingTo}
                  totalItems={filteredBookings.length}
                  itemName="bookings"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
