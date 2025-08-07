import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { useDateLocalization } from "../hooks/useDateLocalization";
import AccountNav from "../components/AccountNav";
import ReviewsFilters from "../components/ReviewsFilters";
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
  const { t } = useTranslation("reviews");
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const { formatLocalizedDateTime } = useDateLocalization();
  const navigate = useNavigate();

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
      notify(t("management.messages.accessDenied"), "error");
    }
  }, [user, navigate, notify, t]);

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
      notify(t("management.messages.loadError"), "error");
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
        label: t("management.filters.rating.option", { rating: filterRating }),
        onRemove: () => setFilterRating("all")
      });
    }

    if (filterReported !== "all") {
      filters.push({
        label: filterReported === "reported" ? t("management.filters.reported.reported") : t("management.filters.reported.notReported"),
        onRemove: () => setFilterReported("all")
      });
    }
    
    if (startDate) {
      filters.push({
        label: t("management.filters.dateRange.fromDate", { date: startDate }),
        onRemove: () => setStartDate("")
      });
    }
    
    if (endDate) {
      filters.push({
        label: t("management.filters.dateRange.toDate", { date: endDate }),
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

      notify(t(`management.messages.${action}Success`), "success");
      
      // Refresh the current page
      fetchReviews(currentPage);
      
    } catch (error) {
      console.error(`Error ${action}ing review:`, error);
      notify(error.response?.data?.error || t(`management.messages.${action}Error`), "error");
    }
  };

  // Bulk delete action
  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) {
      notify(t("management.messages.pleaseSelectReviews"), "warning");
      return;
    }

    if (!window.confirm(t("management.actions.confirmBulkDelete", { count: selectedReviews.length }))) {
      return;
    }

    try {
      setLoading(true);
      
      const promises = selectedReviews.map(reviewId => 
        api.delete(`/reviews/${reviewId}`)
      );

      await Promise.all(promises);

      notify(t("management.messages.bulkDeleteSuccess", { count: selectedReviews.length }), "success");
      setSelectedReviews([]);
      
      // Refresh the current page
      fetchReviews(currentPage);
      
    } catch (error) {
      console.error("Error in bulk delete:", error);
      notify(t("management.messages.bulkDeleteError"), "error");
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
      <div className="spacing-container">
        {/* Error Display */}
        {error && (
          <div className="bg-error-100 border border-error-400 text-error-700 spacing-card rounded mb-4">
            {error}
          </div>
        )}

        {/* Mobile-Friendly Search and Filter Controls */}
        <ReviewsFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          debouncedSearchTerm={debouncedSearchTerm}
          filterRating={filterRating}
          setFilterRating={setFilterRating}
          filterReported={filterReported}
          setFilterReported={setFilterReported}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          clearAllFilters={clearAllFilters}
          totalReviews={totalReviews}
          selectedReviews={selectedReviews}
          handleBulkDelete={handleBulkDelete}
          loading={loading}
        />

        {/* Results Summary - Desktop Only */}
        <div className="hidden sm:flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {t("management.pagination.showing", { 
              start: ((currentPage - 1) * reviewsPerPage) + 1, 
              end: Math.min(currentPage * reviewsPerPage, totalReviews), 
              total: totalReviews 
            })}
            {searchTerm && ` ${t("management.search.matching", { term: searchTerm })}`}
          </div>
        </div>

        {/* Active filters - Desktop Only */}
        <div className="hidden sm:block">
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
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t("management.table.review")}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t("management.table.place")} & {t("management.table.reviewer")}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t("management.table.reports")}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t("management.table.date")}</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t("management.table.actions")}</th>
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
                        <span>{t("management.table.noReviews")}</span>
                        {searchTerm && (
                          <p className="text-sm text-gray-400">{t("management.table.tryAdjustingSearch")}</p>
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
                                <option value={1}>{t("management.filters.rating.option", { rating: 1 })}</option>
                                <option value={2}>{t("management.filters.rating.option", { rating: 2 })}</option>
                                <option value={3}>{t("management.filters.rating.option", { rating: 3 })}</option>
                                <option value={4}>{t("management.filters.rating.option", { rating: 4 })}</option>
                                <option value={5}>{t("management.filters.rating.option", { rating: 5 })}</option>
                              </select>
                            </div>
                            <textarea
                              value={editForm.comment}
                              onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              rows="3"
                              placeholder={t("reviewForm.fields.comment.placeholder")}
                            />
                            <textarea
                              value={editForm.adminNotes}
                              onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              rows="2"
                              placeholder={t("management.table.adminNotes")}
                            />
                            <label className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={editForm.isVisible}
                                onChange={(e) => setEditForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                                className="mr-1"
                              />
                              {t("management.table.visibleToPublic")}
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
                              <p className="text-xs text-gray-500 italic">{t("management.table.adminNotes")}: {truncateText(review.adminNotes, 80)}</p>
                            )}
                            <div className="text-xs">
                              {review.isVisible ? (
                                <span className="text-green-600">● {t("management.table.visible")}</span>
                              ) : (
                                <span className="text-red-600">● {t("management.table.hidden")}</span>
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
                              {t("management.table.unknownPlace")}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {t("management.table.byUser", { name: review.User?.name || t("management.table.anonymous") })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("management.table.helpful")}: {review.helpfulCount || 0}
                          </p>
                        </div>
                      </td>

                      {/* Reports */}
                      <td className="py-3 px-4">
                        {review.reportCount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {t("management.table.reportCount", { count: review.reportCount })}
                            </span>
                            {review.Reports && review.Reports.length > 0 && (
                              <div className="text-xs text-gray-600">
                                {t("management.table.latestReport", { reason: review.Reports[0].reason })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">{t("management.table.noReports")}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatLocalizedDateTime(review.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        {editingReview === review.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleEditSave}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              {t("management.actions.save")}
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                            >
                              {t("management.actions.cancel")}
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditStart(review)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              {t("management.actions.edit")}
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(t("management.actions.confirmDelete"))) {
                                  handleIndividualAction(review.id, "delete");
                                }
                              }}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              {t("management.actions.delete")}
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
