import { useState, useEffect, useContext } from "react";
import { UserContext } from "../components/UserContext";
import { Navigate } from "react-router-dom";
import api from "../utils/api";
import { 
  StarIcon, 
  CalendarIcon, 
  UserIcon, 
  HomeIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

const HostReviewsPage = () => {
  const { user, isReady } = useContext(UserContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Redirect if not authenticated or not a host
  if (!isReady) {
    return <div className="px-14"><p>Loading...</p></div>;
  }

  if (isReady && !user) {
    return <Navigate to="/login" />;
  }

  if (user && user.userType !== 'host') {
    return <Navigate to="/account" />;
  }

  useEffect(() => {
    fetchHostReviews();
  }, [filter, sortBy]);

  const fetchHostReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/host-reviews?filter=${filter}&sort=${sortBy}`);
      setReviews(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching host reviews:", err);
      setError(err.response?.data?.error || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getFilteredReviews = () => {
    let filtered = [...reviews];
    
    if (filter === "high-rating") {
      filtered = filtered.filter(review => review.rating >= 4);
    } else if (filter === "low-rating") {
      filtered = filtered.filter(review => review.rating <= 2);
    } else if (filter === "recent") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      filtered = filtered.filter(review => new Date(review.created_at) >= lastWeek);
    }

    return filtered;
  };

  const filteredReviews = getFilteredReviews();

  if (loading) {
    return (
      <div className="px-4 md:px-14">
        
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 md:px-14">
        
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex">
                <div className="text-red-800">
                  <h3 className="text-lg font-medium">Error Loading Reviews</h3>
                  <p className="mt-2 text-sm">{error}</p>
                  <button
                    onClick={fetchHostReviews}
                    className="mt-4 bg-error-600 text-white px-4 py-2 rounded-md hover:bg-error-700 transition duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-14">
      
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
            <p className="text-gray-600 mt-1">
              Reviews for all your properties
            </p>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    filter === "all"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All Reviews ({reviews.length})
                </button>
                <button
                  onClick={() => setFilter("high-rating")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    filter === "high-rating"
                      ? "bg-success-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  High Rating (4-5★)
                </button>
                <button
                  onClick={() => setFilter("low-rating")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    filter === "low-rating"
                      ? "bg-error-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Low Rating (1-2★)
                </button>
                <button
                  onClick={() => setFilter("recent")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    filter === "recent"
                      ? "bg-info-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Recent (Last 7 days)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <HomeIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">
                          {review.Place?.title || "Unknown Place"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <UserIcon className="w-4 h-4" />
                        <span>{review.User?.name || "Anonymous"}</span>
                        <CalendarIcon className="w-4 h-4 ml-2" />
                        <span>{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-lg font-semibold text-gray-900">
                        {review.rating}
                      </span>
                    </div>
                  </div>

                  {review.comment && (
                    <div className="mb-4">
                      <div className="flex items-start gap-2">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Review Reply */}
                  {review.Reply && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">H</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Host Reply</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.Reply.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm ml-8">
                        {review.Reply.comment}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          review.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : review.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {review.status}
                      </span>
                      {!review.Reply && (
                        <button className="text-primary hover:text-primary-dark text-sm font-medium">
                          Reply to Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <StarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === "all" ? "No reviews yet" : "No reviews match your filter"}
                </h3>
                <p className="text-gray-600">
                  {filter === "all" 
                    ? "Your property reviews will appear here once guests start leaving feedback."
                    : "Try adjusting your filter to see more reviews."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostReviewsPage;
