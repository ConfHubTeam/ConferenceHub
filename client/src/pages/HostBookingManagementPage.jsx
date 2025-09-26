import { useContext, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import api from "../utils/api";
import BookingRequestCard from "../components/BookingRequestCard";
import Pagination from "../components/Pagination";

/**
 * HostBookingManagementPage Component
 * 
 * A comprehensive production-level host management interface for booking requests.
 * Features pagination, sorting, filtering, and focused on pending requests.
 */
export default function HostBookingManagementPage() {
  const { t } = useTranslation('common');
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  
  // State management
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Summary stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Load bookings on component mount
  useEffect(() => {
    if (user?.userType === "host") {
      loadBookings();
    }
  }, [user]);

  // Filter and sort bookings when dependencies change
  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchTerm, statusFilter, sortBy, sortOrder]);

  // Load bookings from API
  async function loadBookings() {
    setLoading(true);
    try {
      const { data } = await api.get("/bookings");
      setBookings(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error loading bookings:", error);
      notify("messages.bookingLoadError", "error");
    } finally {
      setLoading(false);
    }
  }

  // Calculate summary statistics
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

  // Filter and sort bookings
  function filterAndSortBookings() {
    let filtered = [...bookings];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        // Phone number search - check both guest phone and user phone
        const phoneMatch = booking.guestPhone && (
          booking.guestPhone.toLowerCase().includes(term) ||
          booking.guestPhone.replace(/[^\d]/g, '').includes(term.replace(/[^\d]/g, ''))
        );
        
        const userPhoneMatch = booking.user?.phoneNumber && (
          booking.user.phoneNumber.toLowerCase().includes(term) ||
          booking.user.phoneNumber.replace(/[^\d]/g, '').includes(term.replace(/[^\d]/g, ''))
        );
        
        return (
          booking.place?.title?.toLowerCase().includes(term) ||
          booking.place?.address?.toLowerCase().includes(term) ||
          booking.uniqueRequestId?.toLowerCase().includes(term) ||
          `req-${booking.id}`.toLowerCase().includes(term) ||
          phoneMatch ||
          userPhoneMatch
        );
      });
    }

    // Apply sorting
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

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }

  // Handle booking updates
  function handleBookingUpdate(updatedBooking) {
    const updatedBookings = bookings.map(booking =>
      booking.id === updatedBooking.id ? updatedBooking : booking
    );
    setBookings(updatedBookings);
    calculateStats(updatedBookings);
  }

  // Get current page items
  function getCurrentPageItems() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }

  // Calculate pagination info
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const showingFrom = filteredBookings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min(currentPage * itemsPerPage, filteredBookings.length);

  // Redirect if not host
  if (user && user.userType !== "host") {
    return (
      <div>
        
        <div className="spacing-container spacing-section">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Access Denied</h3>
            <p className="text-red-600">
              This page is only available to hosts. Please log in with a host account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div>
        
        <div className="spacing-container spacing-section">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        
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
                placeholder={t('filters.searchPlaceholders.host', { ns: 'booking' })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div className="lg:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="pending">Pending ({stats.pending})</option>
                <option value="all">All ({stats.total})</option>
                <option value="approved">Approved ({stats.approved})</option>
                <option value="rejected">Rejected ({stats.rejected})</option>
              </select>
            </div>

            {/* Sort options */}
            <div className="lg:w-48">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
    </div>
  );
}
