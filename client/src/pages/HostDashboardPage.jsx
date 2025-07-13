import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { Navigate } from "react-router-dom";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { formatPriceWithSymbol, convertCurrency } from "../utils/currencyUtils";
import { 
  HomeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  StarIcon,
  ChartBarIcon,
  ClockIcon,
  BellIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

const HostDashboardPage = () => {
  const { user, isReady } = useContext(UserContext);
  const { selectedCurrency, convertToSelectedCurrency } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed revenue-related state variables

  const fetchHostStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/host-stats");
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching host statistics:", err);
      setError(err.response?.data?.error || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostStatistics();
  }, []);

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

  const formatCurrency = (amount) => {
    if (!selectedCurrency || !amount) return "$0.00";
    return formatPriceWithSymbol(amount, selectedCurrency);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short", 
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 md:px-14">
        <AccountNav />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex">
                <div className="text-red-800">
                  <h3 className="text-lg font-medium">Error Loading Dashboard</h3>
                  <p className="mt-2 text-sm">{error}</p>
                  <button
                    onClick={fetchHostStatistics}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
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
      <AccountNav />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Manage your properties and track performance
                </p>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/account/user-places"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition duration-200"
                >
                  <HomeIcon className="w-5 h-5 mr-2" />
                  Manage Places
                </Link>
                <Link
                  to="/account/notifications"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <BellIcon className="w-5 h-5 mr-2" />
                  Notifications
                </Link>
              </div>
            </div>
          </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Places */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HomeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Places</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.places?.total || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Total Paid Bookings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Paid Bookings</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.bookings?.total || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.reviews?.averageRating || "0.0"} ★
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Status Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Booking Status Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ClockIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.pending || 0}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CalendarIcon className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.approved || 0}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.selected || 0}</p>
                <p className="text-sm text-gray-500">Selected</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CurrencyDollarIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.total || 0}</p>
                <p className="text-sm text-gray-500">Paid</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CalendarIcon className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.cancelled || 0}</p>
                <p className="text-sm text-gray-500">Cancelled</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CalendarIcon className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.rejected || 0}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Analytics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Review Analytics</h2>
                <p className="text-sm text-gray-600 mt-1">Performance metrics across all your properties</p>
              </div>
              <Link 
                to="/account/reviews"
                className="text-sm text-primary hover:text-primary-dark font-medium hover:underline transition duration-200"
              >
                View All Reviews →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {/* Top Row - Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <StarIcon className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.reviews?.total || 0}</p>
                <p className="text-sm text-gray-500">Total Reviews</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <StarIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.reviews?.averageRating || "0.0"}</p>
                <p className="text-sm text-gray-500">Average Rating</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.reviews?.reviewsThisMonth || 0}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChartBarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.reviews?.reviewsLastMonth || 0}</p>
                <p className="text-sm text-gray-500">Last Month</p>
              </div>
            </div>

            {/* Overall Rating Distribution */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Overall Rating Distribution</h3>
                <div className="text-sm text-gray-500">
                  Across {stats?.reviews?.placeSpecificStats?.length || 0} propert{stats?.reviews?.placeSpecificStats?.length === 1 ? 'y' : 'ies'}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const ratingData = stats?.reviews?.ratingDistribution?.[rating] || { count: 0, percentage: 0 };
                  return (
                    <div key={rating} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">{rating}</span>
                        <StarIcon className="w-4 h-4 text-yellow-400 ml-1" />
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ease-out ${
                            rating === 5 ? 'bg-emerald-500' :
                            rating === 4 ? 'bg-blue-500' :
                            rating === 3 ? 'bg-yellow-500' :
                            rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${ratingData.percentage}%` }}
                        ></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-gray-900">{ratingData.count}</div>
                        <div className="text-xs text-gray-500">({ratingData.percentage}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Month-over-Month Comparison */}
            {stats?.reviews?.reviewsThisMonth !== undefined && stats?.reviews?.reviewsLastMonth !== undefined && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance</h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Reviews comparison: This month vs Last month
                    </div>
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const thisMonth = stats.reviews.reviewsThisMonth || 0;
                        const lastMonth = stats.reviews.reviewsLastMonth || 0;
                        const difference = thisMonth - lastMonth;
                        const isPositive = difference > 0;
                        const isNeutral = difference === 0;
                        
                        if (isNeutral) {
                          return (
                            <span className="text-sm text-gray-600 flex items-center">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                              No change
                            </span>
                          );
                        }
                        
                        return (
                          <>
                            <span className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : ''}{difference}
                            </span>
                            <div className={`w-0 h-0 border-l-4 border-r-4 border-transparent ${
                              isPositive ? 'border-b-4 border-b-green-500' : 'border-t-4 border-t-red-500'
                            }`}></div>
                            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? 'Growing' : 'Declining'}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Place-Specific Review Performance */}
            {stats?.reviews?.placeSpecificStats && stats.reviews.placeSpecificStats.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Performance by Property</h3>
                  <div className="text-sm text-gray-500">
                    {stats.reviews.placeSpecificStats.length} propert{stats.reviews.placeSpecificStats.length === 1 ? 'y' : 'ies'}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {stats.reviews.placeSpecificStats.map((place) => (
                    <div key={place.placeId} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Property Header */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link 
                              to={`/place/${place.placeId}`}
                              className="text-lg font-semibold text-gray-900 hover:text-primary hover:underline transition duration-200 line-clamp-2"
                            >
                              {place.placeTitle}
                            </Link>
                            <div className="flex items-center mt-2 space-x-3">
                              <div className="flex items-center space-x-1">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-xl font-bold text-gray-900">
                                  {place.averageRating}
                                </span>
                              </div>
                              <div className="h-4 w-px bg-gray-300"></div>
                              <span className="text-sm font-medium text-gray-600">
                                {place.totalReviews} review{place.totalReviews !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Performance Badge */}
                          <div className="ml-4">
                            {(() => {
                              const avgRating = parseFloat(place.averageRating);
                              let badgeColor = 'bg-gray-100 text-gray-600';
                              let badgeText = 'No Data';
                              
                              if (avgRating >= 4.5) {
                                badgeColor = 'bg-green-100 text-green-700';
                                badgeText = 'Excellent';
                              } else if (avgRating >= 4.0) {
                                badgeColor = 'bg-blue-100 text-blue-700';
                                badgeText = 'Great';
                              } else if (avgRating >= 3.5) {
                                badgeColor = 'bg-yellow-100 text-yellow-700';
                                badgeText = 'Good';
                              } else if (avgRating >= 3.0) {
                                badgeColor = 'bg-orange-100 text-orange-700';
                                badgeText = 'Fair';
                              } else if (avgRating > 0) {
                                badgeColor = 'bg-red-100 text-red-700';
                                badgeText = 'Poor';
                              }
                              
                              return (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                                  {badgeText}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Rating Insights */}
                      <div className="p-6">
                        {/* Rating Distribution Visualization */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Rating Breakdown</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Trend:</span>
                              {(() => {
                                const trend = place.trend;
                                const isPositive = trend > 0;
                                const isNeutral = trend === 0;
                                
                                if (isNeutral) {
                                  return (
                                    <span className="text-sm text-gray-500 flex items-center">
                                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                                      Stable
                                    </span>
                                  );
                                }
                                
                                return (
                                  <span className={`text-sm font-medium flex items-center ${
                                    isPositive ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    <div className={`w-0 h-0 border-l-2 border-r-2 border-transparent mr-1 ${
                                      isPositive ? 'border-b-2 border-b-green-500' : 'border-t-2 border-t-red-500'
                                    }`}></div>
                                    {isPositive ? '+' : ''}{trend} this month
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          
                          {/* Enhanced Rating Distribution */}
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const ratingData = place.ratingDistribution[rating] || { count: 0, percentage: 0 };
                              return (
                                <div key={rating} className="flex items-center space-x-3">
                                  <div className="flex items-center w-8">
                                    <span className="text-xs font-medium text-gray-700">{rating}</span>
                                    <StarIcon className="w-3 h-3 text-yellow-400 ml-1" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          rating === 5 ? 'bg-emerald-500' :
                                          rating === 4 ? 'bg-blue-500' :
                                          rating === 3 ? 'bg-yellow-500' :
                                          rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${ratingData.percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 w-16 text-right">
                                    <span className="text-xs font-medium text-gray-600">{ratingData.count}</span>
                                    <span className="text-xs text-gray-400">({ratingData.percentage}%)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Monthly Performance Summary */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{place.reviewsThisMonth}</div>
                              <div className="text-xs text-gray-500">Reviews This Month</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{place.reviewsLastMonth}</div>
                              <div className="text-xs text-gray-500">Reviews Last Month</div>
                            </div>
                          </div>
                          
                          {/* Quality Insights */}
                          {place.totalReviews > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {Math.round(((place.ratingDistribution[5]?.count || 0) + (place.ratingDistribution[4]?.count || 0)) / place.totalReviews * 100)}%
                                  </div>
                                  <div className="text-xs text-gray-500">Positive (4-5★)</div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {Math.round(((place.ratingDistribution[1]?.count || 0) + (place.ratingDistribution[2]?.count || 0)) / place.totalReviews * 100)}%
                                  </div>
                                  <div className="text-xs text-gray-500">Critical (1-2★)</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Link */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Link 
                            to={`/place/${place.placeId}`}
                            className="text-sm text-primary hover:text-primary-dark font-medium hover:underline transition duration-200"
                          >
                            View Property Details & Reviews →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Reviews State */}
            {(!stats?.reviews?.total || stats.reviews.total === 0) && (
              <div className="text-center py-12">
                <StarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-500 mb-6">Your properties haven't received any reviews yet. Once guests start reviewing, you'll see detailed analytics here.</p>
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Tips to get your first reviews:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Provide excellent customer service</li>
                    <li>• Ensure your property is clean and well-maintained</li>
                    <li>• Respond quickly to guest inquiries</li>
                    <li>• Follow up with guests after their stay</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Place-Specific Review Performance */}
            {stats?.reviews?.placeSpecificStats && stats.reviews.placeSpecificStats.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Performance by Property</h3>
                  <div className="text-sm text-gray-500">
                    {stats.reviews.placeSpecificStats.length} propert{stats.reviews.placeSpecificStats.length === 1 ? 'y' : 'ies'}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {stats.reviews.placeSpecificStats.map((place) => (
                    <div key={place.placeId} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Property Header */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link 
                              to={`/place/${place.placeId}`}
                              className="text-lg font-semibold text-gray-900 hover:text-primary hover:underline transition duration-200 line-clamp-2"
                            >
                              {place.placeTitle}
                            </Link>
                            <div className="flex items-center mt-2 space-x-3">
                              <div className="flex items-center space-x-1">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-xl font-bold text-gray-900">
                                  {place.averageRating}
                                </span>
                              </div>
                              <div className="h-4 w-px bg-gray-300"></div>
                              <span className="text-sm font-medium text-gray-600">
                                {place.totalReviews} review{place.totalReviews !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Performance Badge */}
                          <div className="ml-4">
                            {(() => {
                              const avgRating = parseFloat(place.averageRating);
                              let badgeColor = 'bg-gray-100 text-gray-600';
                              let badgeText = 'No Data';
                              
                              if (avgRating >= 4.5) {
                                badgeColor = 'bg-green-100 text-green-700';
                                badgeText = 'Excellent';
                              } else if (avgRating >= 4.0) {
                                badgeColor = 'bg-blue-100 text-blue-700';
                                badgeText = 'Great';
                              } else if (avgRating >= 3.5) {
                                badgeColor = 'bg-yellow-100 text-yellow-700';
                                badgeText = 'Good';
                              } else if (avgRating >= 3.0) {
                                badgeColor = 'bg-orange-100 text-orange-700';
                                badgeText = 'Fair';
                              } else if (avgRating > 0) {
                                badgeColor = 'bg-red-100 text-red-700';
                                badgeText = 'Poor';
                              }
                              
                              return (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                                  {badgeText}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Rating Insights */}
                      <div className="p-6">
                        {/* Rating Distribution Visualization */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Rating Breakdown</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Trend:</span>
                              {(() => {
                                const trend = place.trend;
                                const isPositive = trend > 0;
                                const isNeutral = trend === 0;
                                
                                if (isNeutral) {
                                  return (
                                    <span className="text-sm text-gray-500 flex items-center">
                                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                                      Stable
                                    </span>
                                  );
                                }
                                
                                return (
                                  <span className={`text-sm font-medium flex items-center ${
                                    isPositive ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    <div className={`w-0 h-0 border-l-2 border-r-2 border-transparent mr-1 ${
                                      isPositive ? 'border-b-2 border-b-green-500' : 'border-t-2 border-t-red-500'
                                    }`}></div>
                                    {isPositive ? '+' : ''}{trend} this month
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          
                          {/* Enhanced Rating Distribution */}
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const ratingData = place.ratingDistribution[rating] || { count: 0, percentage: 0 };
                              return (
                                <div key={rating} className="flex items-center space-x-3">
                                  <div className="flex items-center w-8">
                                    <span className="text-xs font-medium text-gray-700">{rating}</span>
                                    <StarIcon className="w-3 h-3 text-yellow-400 ml-1" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          rating === 5 ? 'bg-emerald-500' :
                                          rating === 4 ? 'bg-blue-500' :
                                          rating === 3 ? 'bg-yellow-500' :
                                          rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${ratingData.percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 w-16 text-right">
                                    <span className="text-xs font-medium text-gray-600">{ratingData.count}</span>
                                    <span className="text-xs text-gray-400">({ratingData.percentage}%)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Monthly Performance Summary */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{place.reviewsThisMonth}</div>
                              <div className="text-xs text-gray-500">Reviews This Month</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{place.reviewsLastMonth}</div>
                              <div className="text-xs text-gray-500">Reviews Last Month</div>
                            </div>
                          </div>
                          
                          {/* Quality Insights */}
                          {place.totalReviews > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {Math.round(((place.ratingDistribution[5]?.count || 0) + (place.ratingDistribution[4]?.count || 0)) / place.totalReviews * 100)}%
                                  </div>
                                  <div className="text-xs text-gray-500">Positive (4-5★)</div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {Math.round(((place.ratingDistribution[1]?.count || 0) + (place.ratingDistribution[2]?.count || 0)) / place.totalReviews * 100)}%
                                  </div>
                                  <div className="text-xs text-gray-500">Critical (1-2★)</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Link */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Link 
                            to={`/place/${place.placeId}`}
                            className="text-sm text-primary hover:text-primary-dark font-medium hover:underline transition duration-200"
                          >
                            View Property Details & Reviews →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboardPage;
