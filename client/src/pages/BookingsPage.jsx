import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import BookingRequestCard from "../components/BookingRequestCard";
import Pagination from "../components/Pagination";
import { useLocation } from "react-router-dom";
import { useNotification } from "../components/NotificationContext";
import { useBookingNotifications } from "../contexts/BookingNotificationContext";
import BookingNotificationBanner from "../components/BookingNotificationBanner";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [filteredBookings, setFilteredBookings] = useState([]);
  const location = useLocation();
  const { notify } = useNotification();
  const { markAsViewed, markAllAsViewed, loadNotificationCounts } = useBookingNotifications();
  
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
                {userId ? 'User Booking Management' : 'All Booking Management'}
              </h1>
              <p className="text-gray-600">
                {userId 
                  ? `Manage bookings for User ID: ${userId}` 
                  : 'Manage all booking requests across the system'
                }
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-yellow-800">Pending</div>
                    <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-green-800">Approved</div>
                    <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-red-800">Rejected</div>
                    <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-blue-800">Total</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search bookings
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by request ID, host name, client name, or property name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>

                {/* Status filter */}
                <div className="lg:w-64">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="pending">Pending ({stats.pending})</option>
                    <option value="all">All ({stats.total})</option>
                    <option value="approved">Approved ({stats.approved})</option>
                    <option value="rejected">Rejected ({stats.rejected})</option>
                  </select>
                </div>

                {/* Sort options */}
                <div className="lg:w-64">
                  <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <select
                    id="sort"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="createdAt-desc">Newest first</option>
                    <option value="createdAt-asc">Oldest first</option>
                    <option value="checkInDate-asc">Check-in date</option>
                    <option value="totalPrice-desc">Highest price</option>
                    <option value="totalPrice-asc">Lowest price</option>
                    <option value="place-asc">Property name</option>
                  </select>
                </div>
              </div>
            </div>

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
                    : "There are no bookings in the system yet."
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-yellow-800">Pending</div>
                    <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-green-800">Approved</div>
                    <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-red-800">Rejected</div>
                    <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-blue-800">Total</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search requests
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by request ID, property name, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>

                {/* Status filter */}
                <div className="lg:w-64">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="pending">Pending ({stats.pending})</option>
                    <option value="all">All ({stats.total})</option>
                    <option value="approved">Approved ({stats.approved})</option>
                    <option value="rejected">Rejected ({stats.rejected})</option>
                  </select>
                </div>

                {/* Sort options */}
                <div className="lg:w-64">
                  <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <select
                    id="sort"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="createdAt-desc">Newest first</option>
                    <option value="createdAt-asc">Oldest first</option>
                    <option value="checkInDate-asc">Check-in date</option>
                    <option value="totalPrice-desc">Highest price</option>
                    <option value="totalPrice-asc">Lowest price</option>
                    <option value="place-asc">Property name</option>
                  </select>
                </div>
              </div>
            </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-yellow-800">Pending</div>
                    <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-green-800">Confirmed</div>
                    <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-red-800">Rejected</div>
                    <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-blue-800">Total</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search bookings
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by property name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>

                {/* Status filter */}
                <div className="lg:w-64">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="pending">Pending ({stats.pending})</option>
                    <option value="all">All ({stats.total})</option>
                    <option value="approved">Confirmed ({stats.approved})</option>
                    <option value="rejected">Rejected ({stats.rejected})</option>
                  </select>
                </div>

                {/* Sort options */}
                <div className="lg:w-64">
                  <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <select
                    id="sort"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="createdAt-desc">Newest first</option>
                    <option value="createdAt-asc">Oldest first</option>
                    <option value="checkInDate-asc">Check-in date</option>
                    <option value="totalPrice-desc">Highest price</option>
                    <option value="totalPrice-asc">Lowest price</option>
                    <option value="place-asc">Property name</option>
                  </select>
                </div>
              </div>
            </div>

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
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
