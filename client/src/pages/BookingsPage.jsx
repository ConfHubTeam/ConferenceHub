import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import BookingRequestCard from "../components/BookingRequestCard";
import Pagination from "../components/Pagination";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useNotification } from "../components/NotificationContext";
import BookingFilters from "../components/BookingFilters";

export default function BookingsPage() {
  const { t, i18n } = useTranslation('booking');
  const [bookings, setBookings] = useState([]);
  const [competingBookingsMap, setCompetingBookingsMap] = useState({});
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [filteredBookings, setFilteredBookings] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  
  // Notification tracking is now handled by the unified notification system
  
  // Extract any query params if needed
  const params = new URLSearchParams(location.search);

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

  // Cleanup modal state
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Set initial status filter based on user type (all user types default to pending)
  useEffect(() => {
    setStatusFilter('pending');
  }, [user?.userType]);

  // Fetch all bookings
  useEffect(() => {
    loadBookings();
  }, []);

  // Recalculate stats when user or bookings change
  useEffect(() => {
    if (bookings.length > 0 && user) {
      calculateStats(bookings);
    }
  }, [bookings, user?.userType]);

  // Load bookings from API
  async function loadBookings() {
    setLoading(true);
    try {
      const { data } = await api.get("/bookings");
      setBookings(data);
      setFilteredBookings(data);
      
      // Load competing bookings for pending requests (for hosts and agents)
      if (user?.userType === 'host' || user?.userType === 'agent') {
        await loadCompetingBookings(data);
      }
      
      // Calculate stats for all user types
      calculateStats(data);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading bookings:", error);
      if (user?.userType === "host") {
        notify("messages.bookingLoadError", "error");
      }
      setLoading(false);
    }
  }

  // Load competing bookings for each pending or selected booking
  const loadCompetingBookings = async (bookingsList) => {
    const competingData = {};
    
    for (const booking of bookingsList) {
      if ((booking.status === 'pending' || booking.status === 'selected') && booking.timeSlots?.length > 0) {
        try {
          const response = await api.get('/bookings/competing', {
            params: {
              placeId: booking.placeId,
              timeSlots: JSON.stringify(booking.timeSlots)
            }
          });
          // Exclude the current booking from competitors
          const competitors = response.data.filter(b => b.id !== booking.id);
          competingData[booking.id] = competitors;
        } catch (error) {
          console.error('Error loading competing bookings:', error);
        }
      }
    }
    
    setCompetingBookingsMap(competingData);
  };

  // Calculate summary statistics for hosts - selected bookings should be counted as pending
  function calculateStats(bookingData) {
    const stats = bookingData.reduce(
      (acc, booking) => {
        acc.total++;
        
        // Count "selected" and "pending" bookings together as "pending" for stats purposes
        if (booking.status === 'pending' || booking.status === 'selected') {
          acc.pending++;
        } else if (booking.status === 'approved') {
          // For clients: count ALL approved bookings (regardless of payment status)
          // For agents/hosts: only count unpaid approved bookings (paid ones go to "paid" tab)
          if (user?.userType === 'client') {
            acc.approved++;
          } else if (!booking.paidToHost) {
            acc.approved++;
          }
        } else {
          // For other statuses (rejected, cancelled, etc.)
          acc[booking.status]++;
        }
        
        // Count paid to host bookings for agents and hosts (for "paid" tab)
        if (user?.userType === 'agent' || user?.userType === 'host') {
          if (booking.status === 'approved' && booking.paidToHost) {
            acc.paidToHostCount = (acc.paidToHostCount || 0) + 1;
          }
        }
        
        return acc;
      },
      { pending: 0, selected: 0, approved: 0, rejected: 0, total: 0, paidToHostCount: 0 }
    );
    setStats(stats);
  }

  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = [...bookings];
    
    // Filter by status - different logic for different user types
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // For all user types, "pending" view includes both pending and selected bookings
        // Selected bookings are still considered pending until payment is complete
        filtered = filtered.filter(booking => booking.status === 'pending' || booking.status === 'selected');
      } else if (statusFilter === 'paid_to_host' || statusFilter === 'paid') {
        // Show only approved bookings that have been paid to host
        filtered = filtered.filter(booking => booking.status === 'approved' && booking.paidToHost);
      } else if (statusFilter === 'approved') {
        // For clients: show ALL approved bookings (both paid and unpaid) - these are their confirmed bookings
        // For agents/hosts: show only unpaid approved bookings
        if (user?.userType === 'client') {
          // Clients: approved tab shows all approved bookings regardless of payment status
          // From client perspective, approved = confirmed, regardless of internal payment workflow
          filtered = filtered.filter(booking => booking.status === 'approved');
        } else {
          // Agents/hosts: approved tab shows only unpaid approved bookings
          filtered = filtered.filter(booking => booking.status === 'approved' && !booking.paidToHost);
        }
      } else {
        // For other statuses, show exact status matches (rejected, cancelled, etc.)
        filtered = filtered.filter(booking => booking.status === statusFilter);
      }
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
  const handleBookingUpdate = (updatedBooking, deletedBookingId = null) => {
    let updatedBookings;
    
    if (deletedBookingId && !updatedBooking) {
      // Handle deletion - remove the booking from the list
      updatedBookings = bookings.filter(booking => booking.id !== deletedBookingId);
    } else {
      // Handle update - replace the existing booking
      updatedBookings = bookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      );
    }
    
    setBookings(updatedBookings);
    
    // Update stats for all user types
    calculateStats(updatedBookings);
  };

  // Get current page items for all user types with pagination
  function getCurrentPageItems() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }

  // Handle cleanup expired bookings (Agent only)
  const handleCleanupExpired = () => {
    setShowCleanupModal(true);
  };

  const confirmCleanupExpired = async () => {
    if (user?.userType !== 'agent') {
      notify(t('errors.accessDenied'), 'error');
      return;
    }

    setIsCleaningUp(true);
    try {
      const response = await api.post('/bookings/cleanup-expired');
      
      if (response.data.success) {
        const { deletedCount, message } = response.data;
        notify(message, 'success');
        
        // Reload bookings to reflect changes
        await loadBookings();
      } else {
        notify(response.data.message || t('errors.cleanupFailed'), 'error');
      }
    } catch (error) {
      console.error('Error cleaning up expired bookings:', error);
      notify(error.response?.data?.message || t('errors.cleanupFailed'), 'error');
    } finally {
      setIsCleaningUp(false);
      setShowCleanupModal(false);
    }
  };

  const cancelCleanup = () => {
    setShowCleanupModal(false);
  };

  // Calculate pagination info for all user types
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const showingFrom = filteredBookings.length > 0 
    ? (currentPage - 1) * itemsPerPage + 1 
    : 0;
  const showingTo = Math.min(currentPage * itemsPerPage, filteredBookings.length);

  // Group bookings by status for filtered bookings
  const pendingBookings = filteredBookings.filter(booking => 
    booking.status === 'pending' || booking.status === 'selected'
  );
  const approvedBookings = filteredBookings.filter(booking => booking.status === 'approved');
  const rejectedBookings = filteredBookings.filter(booking => booking.status === 'rejected');

  if (loading) {
    return (
      <div className="bg-bg-primary min-h-screen">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
          <div className="animate-pulse space-y-6">
            <div className="bg-bg-card rounded-lg p-6 shadow-ui border border-border-light">
              <div className="h-6 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bg-card rounded-lg p-6 shadow-ui border border-border-light">
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-neutral-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        {/* Agent view - Production-level booking management */}
        {user?.userType === 'agent' && (
          <div className="w-full space-y-6">
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
              onCleanupExpired={handleCleanupExpired}
            />

            {/* Bookings list */}
            {filteredBookings.length === 0 ? (
              <div className="bg-bg-card border border-border-light rounded-lg shadow-ui text-center py-12 px-6">
                <svg className="mx-auto h-16 w-16 text-neutral-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-heading-3 text-text-primary mb-3">{t("pages.emptyStates.noBookingsFound")}</h3>
                <p className="text-body text-text-secondary max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" ? (
                    t("pages.emptyStates.adjustFilters")
                  ) : (
                    t("pages.emptyStates.noBookingsYet.agent")
                  )}
                </p>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-heading-2 text-text-primary">
                    {t(`pages.titles.agent.${statusFilter === "all" ? "allBookings" : 
                      statusFilter === "paid_to_host" ? "paidBookings" : 
                      `${statusFilter}Bookings`}`)}
                    <span className="ml-3 text-caption text-text-muted">({filteredBookings.length})</span>
                  </h2>
                
                  {statusFilter === "pending" && stats.pending > 0 && (
                    <div className="text-caption text-status-warning bg-warning-50 px-4 py-2 rounded-full border border-warning-200">
                      {t("pages.statusIndicators.pendingBookings", { 
                        count: stats.pending,
                        plural: stats.pending > 1 ? "s" : ""
                      })}
                    </div>
                  )}
                </div>

                {/* Booking cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {getCurrentPageItems().map((booking) => (
                    <BookingRequestCard
                      key={booking.id}
                      booking={booking}
                      onBookingUpdate={handleBookingUpdate}
                      competingBookings={competingBookingsMap[booking.id] || []}
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
          <div className="w-full space-y-6">

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
            />

            {/* Booking requests list */}
            {filteredBookings.length === 0 ? (
              <div className="bg-bg-card border border-border-light rounded-lg shadow-ui text-center py-12 px-6">
                <svg className="mx-auto h-16 w-16 text-neutral-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-heading-3 text-text-primary mb-3">{t("pages.emptyStates.noRequestsFound")}</h3>
                <p className="text-body text-text-secondary max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" 
                    ? t("pages.emptyStates.adjustFilters")
                    : t("pages.emptyStates.noBookingsYet.host")
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-heading-2 text-text-primary">
                    {t(`pages.titles.host.${statusFilter === "all" ? "allRequests" : 
                      statusFilter === "paid_to_host" ? "paidRequests" : 
                      `${statusFilter}Requests`}`)}
                    <span className="ml-3 text-caption text-text-muted">({filteredBookings.length})</span>
                  </h2>
                  
                  {statusFilter === "pending" && stats.pending > 0 && (
                    <div className="text-caption text-status-warning bg-warning-50 px-4 py-2 rounded-full border border-warning-200">
                      {(() => {
                        const count = stats.pending;
                        const currentLang = i18n.language || "en";
                        
                        // Simple fallback approach for now
                        if (currentLang === "en") {
                          return `${count} request${count > 1 ? "s" : ""} ${count === 1 ? "needs" : "need"} attention`;
                        } else if (currentLang === "uz") {
                          return `${count} so'rov e'tiborni talab qiladi`;
                        } else if (currentLang === "ru") {
                          return `${count} запрос${count > 1 ? "а" : ""} ${count === 1 ? "требует" : "требуют"} внимания`;
                        }
                        
                        // Try the translation with explicit parameters
                        const translationKey = "pages.statusIndicators.pendingRequests";
                        const result = t(translationKey, { 
                          count: count,
                          plural: count > 1 ? "s" : "",
                          verb: count === 1 ? "needs" : "need"
                        });
                        
                        // If translation failed, return fallback
                        if (result === translationKey || result.includes("{")) {
                          return `${count} request${count > 1 ? "s" : ""} ${count === 1 ? "needs" : "need"} attention`;
                        }
                        
                        return result;
                      })()}
                    </div>
                  )}
                </div>

                {/* Booking cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {getCurrentPageItems().map((booking) => (
                    <BookingRequestCard
                      key={booking.id}
                      booking={booking}
                      onBookingUpdate={handleBookingUpdate}
                      competingBookings={competingBookingsMap[booking.id] || []}
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
          <div className="w-full space-y-6">

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
            />

            {/* Bookings list */}
            {filteredBookings.length === 0 ? (
              <div className="bg-bg-card border border-border-light rounded-lg shadow-ui text-center py-12 px-6">
                <svg className="mx-auto h-16 w-16 text-neutral-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-heading-3 text-text-primary mb-3">{t("pages.emptyStates.noBookingsFound")}</h3>
                <p className="text-body text-text-secondary mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" 
                    ? t("pages.emptyStates.adjustFilters")
                    : t("pages.emptyStates.noBookingsYet.client")
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Link to="/" className="btn-primary btn-size-md inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t("pages.emptyStates.findRooms")}
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-heading-2 text-text-primary">
                    {t(`pages.titles.client.${statusFilter === "all" ? "allBookings" : 
                      statusFilter === "approved" ? "confirmedBookings" : 
                      `${statusFilter}Bookings`}`)}
                    <span className="ml-3 text-caption text-text-muted">({filteredBookings.length})</span>
                  </h2>
                  
                  {statusFilter === "pending" && stats.pending > 0 && (
                    <div className="text-caption text-status-warning bg-warning-50 px-4 py-2 rounded-full border border-warning-200">
                      {t("pages.statusIndicators.pendingBookings", { 
                        count: stats.pending,
                        plural: stats.pending > 1 ? "s" : ""
                      })}
                    </div>
                  )}
                </div>

                {/* Booking cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {getCurrentPageItems().map((booking) => (
                    <BookingRequestCard
                      key={booking.id}
                      booking={booking}
                      onBookingUpdate={handleBookingUpdate}
                      competingBookings={competingBookingsMap[booking.id] || []}
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

      {/* Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-5">
                {t('filters.cleanupConfirmation.title')}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {t('filters.cleanupConfirmation.message')}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmCleanupExpired}
                  disabled={isCleaningUp}
                  className="px-4 py-2 bg-error-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-error-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCleaningUp ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.loading')}
                    </div>
                  ) : (
                    t('filters.cleanupConfirmation.confirm')
                  )}
                </button>
                <button
                  onClick={cancelCleanup}
                  disabled={isCleaningUp}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('filters.cleanupConfirmation.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
