import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import StarRating from "../components/StarRating";
import Pagination from "../components/Pagination";
import ActiveFilters, { FilterCreators } from "../components/ActiveFilters";

/**
 * Agent Review Management Page
 * US-R006: Review Management Interface
 * Follows SOLID principles with single responsibility for review management UI
 * Implements DRY principles with reusable filter and action components
 */
export default function AgentReviewsPage() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { notify } = useNotification();

  // State management following single responsibility principle
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsPerPage] = useState(15);

  // Filter state management (removed status since all reviews are auto-approved)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterReported, setFilterReported] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Redirect if not agent (US-R006 requirement)
  useEffect(() => {
    if (user && user.userType !== "agent") {
      navigate("/");
      notify("Access denied. Agents only.", "error");
    }
  }, [user, navigate, notify]);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch reviews with filters and pagination
  const fetchReviews = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: reviewsPerPage,
        rating: filterRating !== "all" ? filterRating : undefined,
        reported: filterReported !== "all" ? filterReported : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: debouncedSearchTerm || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get("/reviews/admin", { params });
      
      setReviews(response.data.reviews);
      setCurrentPage(response.data.pagination.currentPage);
      setTotalPages(response.data.pagination.totalPages);
      setTotalReviews(response.data.pagination.totalReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError(error.response?.data?.error || "Failed to fetch reviews");
      notify("Failed to fetch reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load and filter changes
  useEffect(() => {
    if (user && user.userType === "agent") {
      fetchReviews(1);
    }
  }, [user, filterRating, filterReported, startDate, endDate, debouncedSearchTerm]);

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchReviews(page);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setFilterRating("all");
    setFilterReported("all");
    setStartDate("");
    setEndDate("");
    setSelectedReviews([]);
  };

  // Get active filters for the ActiveFilters component
  const getActiveFilters = () => {
    const filters = [];
    
    if (searchTerm) {
      filters.push(FilterCreators.search(searchTerm, () => setSearchTerm("")));
    }
    
    if (filterRating !== "all") {
      filters.push({
        label: `${filterRating} stars`,
        onRemove: () => setFilterRating("all")
      });
    }

    if (filterReported !== "all") {
      filters.push({
        label: filterReported === "reported" ? "Reported reviews" : "No reports",
        onRemove: () => setFilterReported("all")
      });
    }
    
    if (startDate) {
      filters.push({
        label: `From: ${startDate}`,
        onRemove: () => setStartDate("")
      });
    }
    
    if (endDate) {
      filters.push({
        label: `To: ${endDate}`,
        onRemove: () => setEndDate("")
      });
    }
    
    return filters;
  };

  // Individual review actions (US-R006 requirements) - only edit and delete for agents
  const handleIndividualAction = async (reviewId, action, data = null) => {
    try {
      let response;
      
      switch (action) {
        case "delete":
          response = await api.delete(`/reviews/${reviewId}`);
          break;
        case "edit":
          response = await api.put(`/reviews/${reviewId}`, data);
          break;
        default:
          throw new Error("Invalid action");
      }

      notify(`Review ${action}ed successfully`, "success");
      
      // Refresh the current page
      fetchReviews(currentPage);
      
    } catch (error) {
      console.error(`Error ${action}ing review:`, error);
      notify(error.response?.data?.error || `Failed to ${action} review`, "error");
    }
  };

  // Bulk delete action
  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) {
      notify("Please select reviews first", "warning");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedReviews.length} selected review(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      
      const promises = selectedReviews.map(reviewId => 
        api.delete(`/reviews/${reviewId}`)
      );

      await Promise.all(promises);
      
      notify(`${selectedReviews.length} reviews deleted successfully`, "success");
      setSelectedReviews([]);
      
      // Refresh the current page
      fetchReviews(currentPage);
      
    } catch (error) {
      console.error("Error in bulk delete:", error);
      notify("Failed to delete selected reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  // Review selection handlers
  const handleReviewSelect = (reviewId, isSelected) => {
    setSelectedReviews(prev => 
      isSelected 
        ? [...prev, reviewId]
        : prev.filter(id => id !== reviewId)
    );
  };

  const handleBulkSelect = (isSelected) => {
    setSelectedReviews(isSelected ? reviews.map(review => review.id) : []);
  };

  // Edit handlers
  const handleEditStart = (review) => {
    setEditingReview(review.id);
    setEditForm({
      rating: review.rating,
      comment: review.comment || "",
      adminNotes: review.adminNotes || "",
      isVisible: review.isVisible
    });
  };

  const handleEditSave = () => {
    handleIndividualAction(editingReview, "edit", editForm);
    setEditingReview(null);
    setEditForm({});
  };

  const handleEditCancel = () => {
    setEditingReview(null);
    setEditForm({});
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Truncate text for display
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "N/A";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Don't render if not agent
  if (!user || user.userType !== "agent") {
    return null;
  }

  // Loading state
  if (loading && reviews.length === 0) {
    return (
      <div>
        <AccountNav />
        <div className="px-8 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav />
      <div className="px-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Search and filter controls */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
            <div className="w-full lg:w-1/2 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by place name, reviewer name, or review content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setDebouncedSearchTerm("");
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </div>
                </div>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              <select
                value={filterReported}
                onChange={(e) => setFilterReported(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Reviews</option>
                <option value="reported">Reported Only</option>
                <option value="no_reports">No Reports</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Start Date"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="End Date"
              />
            </div>
          </div>
          
          {/* Results summary and bulk actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {reviews.length} of {totalReviews} reviews
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            
            {selectedReviews.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedReviews.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
          
          {/* Active filters */}
          <ActiveFilters 
            filters={getActiveFilters()}
            onClearAllFilters={clearAllFilters}
          />
        </div>

        {/* Reviews table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                      onChange={(e) => handleBulkSelect(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Review</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Place & User</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Reports</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                        <span>No reviews found</span>
                        {searchTerm && (
                          <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className={`hover:bg-gray-50 ${selectedReviews.includes(review.id) ? "bg-blue-50" : ""}`}>
                      {/* Selection Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={(e) => handleReviewSelect(review.id, e.target.checked)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                      </td>

                      {/* Review Details */}
                      <td className="py-3 px-4">
                        {editingReview === review.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={editForm.rating}
                                onChange={(e) => setEditForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value={1}>1 Star</option>
                                <option value={2}>2 Stars</option>
                                <option value={3}>3 Stars</option>
                                <option value={4}>4 Stars</option>
                                <option value={5}>5 Stars</option>
                              </select>
                            </div>
                            <textarea
                              value={editForm.comment}
                              onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              rows="3"
                              placeholder="Review comment..."
                            />
                            <textarea
                              value={editForm.adminNotes}
                              onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              rows="2"
                              placeholder="Admin notes..."
                            />
                            <label className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={editForm.isVisible}
                                onChange={(e) => setEditForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                                className="mr-1"
                              />
                              Visible to public
                            </label>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} size="sm" />
                              <span className="text-sm font-medium">{review.rating}/5</span>
                            </div>
                            <p className="text-sm text-gray-700">{truncateText(review.comment, 120)}</p>
                            {review.adminNotes && (
                              <p className="text-xs text-gray-500 italic">Admin: {truncateText(review.adminNotes, 80)}</p>
                            )}
                            <div className="text-xs">
                              {review.isVisible ? (
                                <span className="text-green-600">● Visible</span>
                              ) : (
                                <span className="text-red-600">● Hidden</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Place & User */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {review.Place?.id ? (
                            <Link 
                              to={`/place/${review.Place.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {review.Place.title}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              Unknown Place
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            by {review.User?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Helpful: {review.helpfulCount || 0}
                          </p>
                        </div>
                      </td>

                      {/* Reports */}
                      <td className="py-3 px-4">
                        {review.reportCount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {review.reportCount} report{review.reportCount !== 1 ? 's' : ''}
                            </span>
                            {review.Reports && review.Reports.length > 0 && (
                              <div className="text-xs text-gray-600">
                                Latest: {review.Reports[0].reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No reports</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(review.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        {editingReview === review.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleEditSave}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditStart(review)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this review?")) {
                                  handleIndividualAction(review.id, "delete");
                                }
                              }}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showingFrom={((currentPage - 1) * reviewsPerPage) + 1}
          showingTo={Math.min(currentPage * reviewsPerPage, totalReviews)}
          totalItems={totalReviews}
          itemName="reviews"
        />
      </div>
    </div>
  );
}
