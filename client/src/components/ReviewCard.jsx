import { useState, useContext } from "react";
import { UserContext } from "./UserContext";
import StarRating from "./StarRating";

export default function ReviewCard({ 
  review, 
  onHelpfulClick, 
  onReportClick, 
  onReplyClick, 
  onEditReply,
  placeOwnerId,
  isLoading = false 
}) {
  const { user } = useContext(UserContext);
  const [showFullComment, setShowFullComment] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  
  const commentLimit = 300;
  const shouldTruncate = review.comment && review.comment.length > commentLimit;
  const displayComment = shouldTruncate && !showFullComment 
    ? review.comment.substring(0, commentLimit) + "..."
    : review.comment;

  // Check if current user is the host of this place
  const isHost = user && placeOwnerId && user.id === placeOwnerId;
  
  // Check if this review belongs to the current user
  const isOwnReview = user && review.User && review.User.id === user.id;

  // Check if reply can be edited (within 24 hours)
  const canEditReply = review.Reply && isHost && review.Reply.userId === user?.id;
  const replyAge = review.Reply ? new Date() - new Date(review.Reply.created_at) : 0;
  const canEditWithinTimeLimit = canEditReply && replyAge < 24 * 60 * 60 * 1000; // 24 hours

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long"
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleHelpfulClick = () => {
    if (user && !isOwnReview) {
      onHelpfulClick(review.id);
    }
  };

  const handleReportClick = () => {
    if (user && !review.isReported) {
      onReportClick(review.id);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || replyText.length > 500) return;
    
    if (onReplyClick) {
      await onReplyClick(review.id, replyText.trim());
      setReplyText("");
      setShowReplyForm(false);
    }
  };

  // Handle reply edit submission
  const handleEditReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || replyText.length > 500) return;
    
    if (onEditReply) {
      await onEditReply(review.id, replyText.trim());
      setReplyText("");
      setIsEditingReply(false);
    }
  };

  // Start editing reply
  const startEditingReply = () => {
    setReplyText(review.Reply.replyText);
    setIsEditingReply(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setReplyText("");
    setIsEditingReply(false);
    setShowReplyForm(false);
  };

  return (
    <div className={`border rounded-lg p-3 md:p-4 ${
      review.rating >= 4 
        ? "border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-25" 
        : "border-gray-200"
    }`}>
      {/* High Rating Indicator - Compact version */}
      {review.rating >= 4 && (
        <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mb-2">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" clipRule="evenodd" />
          </svg>
          {review.rating === 5 ? "Excellent" : "Great Review"}
        </div>
      )}

      {/* Review Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* User Avatar */}
        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {getUserInitials(review.User?.name)}
        </div>

        <div className="flex-1 min-w-0">
          {/* User Info and Rating */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">
              {review.User?.name || "Anonymous"}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600 flex-shrink-0">
              {formatDate(review.created_at)}
            </span>
          </div>
          {/* Star Rating */}
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      {/* Review Comment */}
      {review.comment && (
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayComment}
          </p>
          
          {shouldTruncate && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-primary hover:text-orange-600 text-sm font-medium mt-2 focus:outline-none"
            >
              {showFullComment ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Host Reply */}
      {review.Reply && !isEditingReply && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                Host response
              </span>
              <span className="text-xs text-gray-600">
                {formatDate(review.Reply.created_at)}
              </span>
            </div>
            {canEditWithinTimeLimit && (
              <button
                onClick={startEditingReply}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200 disabled:opacity-50"
              >
                Edit
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {review.Reply.replyText}
          </p>
        </div>
      )}

      {/* Reply Edit Form */}
      {isEditingReply && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Edit host response
            </span>
          </div>
          <form onSubmit={handleEditReplySubmit}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Edit your response to this review..."
              maxLength={500}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {replyText.length}/500 characters
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !replyText.trim() || replyText.length > 500}
                  className="px-4 py-1 bg-primary text-white text-sm rounded hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && !review.Reply && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Host response
            </span>
          </div>
          <form onSubmit={handleReplySubmit}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Respond to this review..."
              maxLength={500}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {replyText.length}/500 characters
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !replyText.trim() || replyText.length > 500}
                  className="px-4 py-1 bg-primary text-white text-sm rounded hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Review Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Helpful Button */}
          <button
            onClick={handleHelpfulClick}
            disabled={!user || isOwnReview}
            className={`flex items-center gap-1 text-sm transition-colors duration-200 ${
              review.isHelpful
                ? "text-primary"
                : user && !isOwnReview
                ? "text-gray-600 hover:text-primary cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={review.isHelpful ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 7m5 3v10M7 20H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m0 10v-10"
              />
            </svg>
            <span>{review.isHelpful ? "Helpful ✓" : "Helpful"}</span>
            {review.helpfulCount > 0 && (
              <span className="text-xs">({review.helpfulCount})</span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Reply Button for Host */}
          {isHost && !review.Reply && !showReplyForm && (
            <button
              onClick={() => setShowReplyForm(true)}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 disabled:opacity-50"
            >
              Reply
            </button>
          )}

          {/* Report Button - don't show for own reviews */}
          {user && !review.isReported && !isOwnReview && (
            <button
              onClick={handleReportClick}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors duration-200"
            >
              Report
            </button>
          )}

          {review.isReported && (
            <span className="text-xs text-red-500">Reported</span>
          )}
        </div>
      </div>
    </div>
  );
}
