import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { useDateLocalization } from "../hooks/useDateLocalization";
import ReviewsFilters from "../components/ReviewsFilters";
import api from "../utils/api";
import StarRating from "../components/StarRating";
import Pagination from "../components/Pagination";

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");

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
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: debouncedSearchTerm || undefined,
        sortBy: sortBy || undefined
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
  }, [user, filterRating, startDate, endDate, debouncedSearchTerm, sortBy]);

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
    setStartDate("");
    setEndDate("");
    setSortBy("newest");
    setSelectedReviews([]);
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
      adminNotes: review.adminNotes || ""
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
      <div className="min-h-screen bg-bg-primary">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
          <div className="space-y-6">
            <div className="animate-pulse space-y-6">
              {/* Header skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-8 bg-border-light rounded w-64"></div>
                <div className="h-10 bg-border-light rounded w-32"></div>
              </div>
              {/* Filter skeleton */}
              <div className="card-base">
                <div className="px-6 py-6">
                  <div className="h-12 bg-border-light rounded w-full mb-4"></div>
                  <div className="flex gap-3">
                    <div className="h-10 bg-border-light rounded w-24"></div>
                    <div className="h-10 bg-border-light rounded w-24"></div>
                    <div className="h-10 bg-border-light rounded w-24"></div>
                  </div>
                </div>
              </div>
              {/* Table skeleton */}
              <div className="card-base">
                <div className="px-6 py-6">
                  <div className="h-96 bg-border-light rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 max-w-full">
        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="card-base border-error-500 bg-error-50">
              <div className="px-6 py-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-error-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-error-700 font-medium">{error}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-Friendly Search and Filter Controls */}
        <ReviewsFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            debouncedSearchTerm={debouncedSearchTerm}
            filterRating={filterRating}
            setFilterRating={setFilterRating}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            sortBy={sortBy}
            setSortBy={setSortBy}
            clearAllFilters={clearAllFilters}
            totalReviews={totalReviews}
            selectedReviews={selectedReviews}
            handleBulkDelete={handleBulkDelete}
            loading={loading}
          />

          {/* Reviews table */}
          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[800px]">
                <thead className="bg-bg-secondary border-b border-border-light">
                  <tr>
                    <th className="py-4 px-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                        onChange={(e) => handleBulkSelect(e.target.checked)}
                        className="w-4 h-4 text-accent-primary border-border-default rounded focus:ring-accent-primary focus:ring-2"
                      />
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-text-primary min-w-[200px]">{t("management.table.review")}</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-text-primary min-w-[180px]">{t("management.table.place")} & {t("management.table.reviewer")}</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-text-primary w-20">{t("management.table.reports")}</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-text-primary w-32">{t("management.table.date")}</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-text-primary min-w-[120px]">{t("management.table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center">
                            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-text-primary mb-2">{t("management.table.noReviews")}</h3>
                            {searchTerm && (
                              <p className="text-sm text-text-muted">{t("management.table.tryAdjustingSearch")}</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr key={review.id} className={`hover:bg-bg-secondary transition-colors ${selectedReviews.includes(review.id) ? "bg-info-50 border-l-4 border-l-accent-primary" : ""}`}>
                        {/* Selection Checkbox */}
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedReviews.includes(review.id)}
                            onChange={(e) => handleReviewSelect(review.id, e.target.checked)}
                            className="w-4 h-4 text-accent-primary border-border-default rounded focus:ring-accent-primary focus:ring-2"
                          />
                        </td>

                        {/* Review Details */}
                        <td className="py-4 px-4">
                          {editingReview === review.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <select
                                  value={editForm.rating}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                                  className="form-select text-sm w-full max-w-[100px]"
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
                                className="form-input text-sm"
                                rows="3"
                                placeholder={t("reviewForm.fields.comment.placeholder")}
                              />
                              <textarea
                                value={editForm.adminNotes}
                                onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                                className="form-input text-sm"
                                rows="2"
                                placeholder={t("management.table.adminNotes")}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <StarRating rating={review.rating} size="sm" />
                                <span className="text-sm font-medium text-text-primary">{review.rating}/5</span>
                              </div>
                              <p className="text-sm text-text-primary leading-relaxed">{truncateText(review.comment, 120)}</p>
                              {review.adminNotes && (
                                <p className="text-xs text-text-muted italic bg-bg-secondary p-2 rounded-md border-l-2 border-accent-primary">
                                  {t("management.table.adminNotes")}: {truncateText(review.adminNotes, 80)}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Place & User */}
                        <td className="py-4 px-4">
                          <div className="space-y-2">
                            {review.Place?.id ? (
                              <Link 
                                to={`/place/${review.Place.id}`}
                                className="text-sm font-medium text-accent-highlight hover:text-accent-primary hover:underline transition-colors"
                              >
                                {review.Place.title}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium text-text-primary">
                                {t("management.table.unknownPlace")}
                              </p>
                            )}
                            <p className="text-sm text-text-secondary">
                              {t("management.table.byUser", { name: review.User?.name || t("management.table.anonymous") })}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>{t("management.table.helpful")}: {review.helpfulCount || 0}</span>
                            </div>
                          </div>
                        </td>

                        {/* Reports */}
                        <td className="py-4 px-4">
                          {review.reportCount > 0 ? (
                            <div className="space-y-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-status-error text-white">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {t("management.table.reportCount", { count: review.reportCount })}
                              </span>
                              {review.Reports && review.Reports.length > 0 && (
                                <div className="text-xs text-text-muted bg-status-warning/10 p-2 rounded-md">
                                  {t("management.table.latestReport", { reason: review.Reports[0].reason })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">{t("management.table.noReports")}</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4">
                          <div className="text-sm text-text-secondary">
                            {formatLocalizedDateTime(review.created_at)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4">
                          {editingReview === review.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={handleEditSave}
                                className="btn-size-sm bg-status-success text-white hover:bg-green-600 transition-colors rounded-lg px-3 py-1.5 font-medium"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t("management.actions.save")}
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="btn-size-sm bg-bg-secondary text-text-secondary hover:bg-border-light hover:text-text-primary transition-colors rounded-lg px-3 py-1.5 font-medium"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {t("management.actions.cancel")}
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditStart(review)}
                                className="btn-size-sm bg-accent-highlight text-white hover:bg-blue-600 transition-colors rounded-lg px-3 py-1.5 font-medium flex items-center"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t("management.actions.edit")}
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(t("management.actions.confirmDelete"))) {
                                    handleIndividualAction(review.id, "delete");
                                  }
                                }}
                                className="btn-size-sm bg-status-error text-white hover:bg-red-700 transition-colors rounded-lg px-3 py-1.5 font-medium flex items-center"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalReviews}
              itemName="reviews"
            />
          </div>
      </div>
    </div>
  );
}
