import { useState } from "react";
import StarRating from "./StarRating";

/**
 * Review Management Table Component
 * US-R006: Display reviews in paginated table format
 * Follows SOLID principles with single responsibility for table display
 * Implements DRY principles with reusable table components
 */
export default function ReviewManagementTable({
  reviews,
  loading,
  selectedReviews,
  onReviewSelect,
  onBulkSelect,
  onIndividualAction,
  pagination,
  onPageChange
}) {
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Handle individual review selection
  const handleReviewToggle = (reviewId) => {
    const isSelected = selectedReviews.includes(reviewId);
    onReviewSelect(reviewId, !isSelected);
  };

  // Handle bulk selection toggle
  const handleBulkToggle = () => {
    const allSelected = reviews.length > 0 && selectedReviews.length === reviews.length;
    onBulkSelect(!allSelected);
  };

  // Handle edit mode - agents can edit rating, comment, admin notes, and visibility
  const handleEditStart = (review) => {
    setEditingReview(review.id);
    setEditForm({
      rating: review.rating,
      comment: review.comment || "",
      adminNotes: review.adminNotes || "",
      isVisible: review.isVisible
    });
  };

  // Handle edit save
  const handleEditSave = () => {
    onIndividualAction(editingReview, "edit", editForm);
    setEditingReview(null);
    setEditForm({});
  };

  // Handle edit cancel
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

  // Get status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Truncate text for display
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "N/A";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-primary mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600 font-medium">Loading reviews...</span>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-12 px-6">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-500">Try adjusting your filters to see more results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Mobile-first: Card view for small screens */}
      <div className="block lg:hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                onChange={handleBulkToggle}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select All ({selectedReviews.length} selected)
              </span>
            </label>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reviews.map((review) => (
            <div key={review.id} className={`p-4 ${selectedReviews.includes(review.id) ? "bg-blue-50" : ""}`}>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedReviews.includes(review.id)}
                  onChange={() => handleReviewToggle(review.id)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-1"
                />
                
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {editingReview === review.id ? (
                          <select
                            value={editForm.rating}
                            onChange={(e) => setEditForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            {[1, 2, 3, 4, 5].map(num => (
                              <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        ) : (
                          <StarRating rating={review.rating} size="sm" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {editingReview === review.id ? editForm.rating : review.rating}/5
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{review.Place?.title || "Unknown Place"}</p>
                      <p className="text-xs text-gray-600">by {review.User?.name || "Anonymous"}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    {editingReview === review.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editForm.comment}
                          onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                          rows="3"
                          placeholder="Review comment..."
                        />
                        <textarea
                          value={editForm.adminNotes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                          rows="2"
                          placeholder="Admin notes..."
                        />
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={editForm.isVisible}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-gray-700">Visible to public</span>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {truncateText(review.comment, 120)}
                        </p>
                        {review.adminNotes && (
                          <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                            Admin: {truncateText(review.adminNotes, 80)}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className={review.isVisible ? "text-green-600" : "text-red-600"}>
                            {review.isVisible ? "● Public" : "● Hidden"}
                          </span>
                          <span className="text-gray-500">👍 {review.helpfulCount || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reports */}
                  {review.reportCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-2">
                      <span className="text-xs font-medium text-red-800">
                        ⚠️ {review.reportCount} report{review.reportCount !== 1 ? 's' : ''}
                      </span>
                      {review.Reports && review.Reports.length > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          Latest: {review.Reports[0].reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-2 border-t border-gray-100">
                    {editingReview === review.id ? (
                      <>
                        <button
                          onClick={handleEditSave}
                          className="flex-1 bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-green-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="flex-1 bg-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditStart(review)}
                          className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this review?")) {
                              onIndividualAction(review.id, "delete");
                            }
                          }}
                          className="flex-1 bg-red-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Table view for large screens */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                    onChange={handleBulkToggle}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Place & User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id} className={`${selectedReviews.includes(review.id) ? "bg-blue-50" : "hover:bg-gray-50"} transition-colors`}>
                  {/* Selection */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => handleReviewToggle(review.id)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                  </td>

                  {/* Review Details */}
                  <td className="px-4 py-3 max-w-xs">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {editingReview === review.id ? (
                          <select
                            value={editForm.rating}
                            onChange={(e) => setEditForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            {[1, 2, 3, 4, 5].map(num => (
                              <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        ) : (
                          <StarRating rating={review.rating} size="sm" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {editingReview === review.id ? editForm.rating : review.rating}/5
                        </span>
                      </div>
                      
                      {editingReview === review.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editForm.comment}
                            onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                            rows="3"
                            placeholder="Review comment..."
                          />
                          <textarea
                            value={editForm.adminNotes}
                            onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
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
                            <span className="text-gray-700">Visible to public</span>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {truncateText(review.comment, 100)}
                          </p>
                          {review.adminNotes && (
                            <p className="text-xs text-gray-500 italic bg-gray-50 p-1 rounded">
                              Admin: {truncateText(review.adminNotes, 60)}
                            </p>
                          )}
                          <div className="flex items-center text-xs space-x-3">
                            <span className={review.isVisible ? "text-green-600" : "text-red-600"}>
                              {review.isVisible ? "● Public" : "● Hidden"}
                            </span>
                            <span className="text-gray-500">👍 {review.helpfulCount || 0}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Place & User */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {review.Place?.title || "Unknown Place"}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {review.User?.name || "Anonymous"}
                      </p>
                    </div>
                  </td>

                  {/* Reports */}
                  <td className="px-4 py-3">
                    {review.reportCount > 0 ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {review.reportCount} report{review.reportCount !== 1 ? 's' : ''}
                        </span>
                        {review.Reports && review.Reports.length > 0 && (
                          <p className="text-xs text-gray-600 truncate max-w-24">
                            {review.Reports[0].reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(review.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {editingReview === review.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleEditSave}
                          className="text-green-600 hover:text-green-900 text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditStart(review)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this review?")) {
                              onIndividualAction(review.id, "delete");
                            }
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            {/* Results info */}
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.reviewsPerPage) + 1}</span> to{" "}
              <span className="font-medium">{Math.min(pagination.currentPage * pagination.reviewsPerPage, pagination.totalReviews)}</span> of{" "}
              <span className="font-medium">{pagination.totalReviews}</span> reviews
            </div>
            
            {/* Pagination controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                        pageNum === pagination.currentPage
                          ? "bg-primary text-white border-primary"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
