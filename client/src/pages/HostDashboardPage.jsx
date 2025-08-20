import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { formatPriceWithSymbol, convertCurrency } from "../utils/currencyUtils";
import {
  HomeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

// Import reusable components following SOLID principles
import {
  MetricCard,
  BookingStatusItem,
  RatingBar,
  PerformanceBadge,
  TrendIndicator
} from "../components/HostDashboard";

// Reusable ReviewSummaryCard component (keeping this one inline as it's dashboard-specific)
const ReviewSummaryCard = ({ icon: Icon, iconBgColor, iconColor, value, label }) => (
  <div className="text-center">
    <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

const HostDashboardPage = () => {
  const { user, isReady } = useContext(UserContext);
  const { selectedCurrency, convertToSelectedCurrency } = useCurrency();
  const { t } = useTranslation("dashboard");
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
    return <div className="min-h-screen bg-gray-50 pt-8"><div className="w-full px-4"><p>{t("common.loading")}</p></div></div>;
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
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="w-full px-4">
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
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="w-full px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="text-red-800">
                <h3 className="text-lg font-medium">{t("host.error.loadingDashboard")}</h3>
                <p className="mt-2 text-sm">{error}</p>
                <button
                  onClick={fetchHostStatistics}
                  className="mt-4 bg-error-600 text-white px-4 py-2 rounded-md hover:bg-error-700 transition duration-200"
                >
                  {t("host.error.tryAgain")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="w-full px-4">{/* Full width container with minimal padding */}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Places */}
          <div className="h-full">
            <MetricCard
              icon={HomeIcon}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              title={t("host.metrics.totalPlaces")}
              value={stats?.places?.total || 0}
            />
          </div>

          {/* Total Paid Bookings */}
          <div className="h-full">
            <MetricCard
              icon={CalendarIcon}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              title={t("host.metrics.totalPaidBookings")}
              value={stats?.bookings?.total || 0}
            />
          </div>

          {/* Average Rating */}
          <div className="h-full">
            <MetricCard
              icon={StarIcon}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              title={t("host.metrics.averageRating")}
              value={`${stats?.reviews?.averageRating || "0.0"} ★`}
            />
          </div>
        </div>

        {/* Booking Status Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t("host.bookingStatus.title")}</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="h-full">
                <BookingStatusItem
                  icon={ClockIcon}
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                  count={stats?.bookings?.pending || 0}
                  label={t("host.bookingStatus.pending")}
                />
              </div>
              <div className="h-full">
                <BookingStatusItem
                  icon={CalendarIcon}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  count={Math.max(0, (stats?.bookings?.approved || 0) - (stats?.bookings?.total || 0))}
                  label={t("host.bookingStatus.approved")}
                />
              </div>
              <div className="h-full">
                <BookingStatusItem
                  icon={CalendarIcon}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                  count={stats?.bookings?.selected || 0}
                  label={t("host.bookingStatus.selected")}
                />
              </div>
              <div className="h-full">
                <BookingStatusItem
                  icon={CurrencyDollarIcon}
                  iconBgColor="bg-emerald-100"
                  iconColor="text-emerald-600"
                  count={stats?.bookings?.total || 0}
                  label={t("host.bookingStatus.paid")}
                />
              </div>
              <div className="h-full">
                <BookingStatusItem
                  icon={CalendarIcon}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                  count={stats?.bookings?.rejected || 0}
                  label={t("host.bookingStatus.rejected")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Review Analytics Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t("host.reviews.title")}</h2>
              <p className="text-sm text-gray-600 mt-1">{t("host.reviews.subtitle")}</p>
            </div>
          </div>
          <div className="p-6">
            {/* Top Row - Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="h-full">
                <ReviewSummaryCard
                  icon={StarIcon}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  value={stats?.reviews?.total || 0}
                  label={t("host.reviews.totalReviews")}
                />
              </div>

              <div className="h-full">
                <ReviewSummaryCard
                  icon={StarIcon}
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                  value={stats?.reviews?.averageRating || "0.0"}
                  label={t("host.reviews.averageRating")}
                />
              </div>

              <div className="h-full">
                <ReviewSummaryCard
                  icon={ArrowTrendingUpIcon}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  value={stats?.reviews?.reviewsThisMonth || 0}
                  label={t("host.reviews.thisMonth")}
                />
              </div>

              <div className="h-full">
                <ReviewSummaryCard
                  icon={ChartBarIcon}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                  value={stats?.reviews?.reviewsLastMonth || 0}
                  label={t("host.reviews.lastMonth")}
                />
              </div>
            </div>

            {/* Overall Rating Distribution */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t("host.reviews.ratingDistribution")}</h3>
                <div className="text-sm text-gray-500">
                  {t("common.across")} {stats?.reviews?.placeSpecificStats?.length || 0} {stats?.reviews?.placeSpecificStats?.length === 1 ? t("host.reviews.property") : t("host.reviews.propertiesCount")}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const ratingData = stats?.reviews?.ratingDistribution?.[rating] || { count: 0, percentage: 0 };
                  return (
                    <RatingBar
                      key={rating}
                      rating={rating}
                      count={ratingData.count}
                      percentage={ratingData.percentage}
                    />
                  );
                })}
              </div>
            </div>

            {/* Month-over-Month Comparison - Always show */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t("host.reviews.monthlyPerformance")}</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {t("host.reviews.reviewsComparison")}
                  </div>
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const thisMonth = stats?.reviews?.reviewsThisMonth || 0;
                      const lastMonth = stats?.reviews?.reviewsLastMonth || 0;
                      const difference = thisMonth - lastMonth;
                      const isPositive = difference > 0;
                      const isNeutral = difference === 0;

                      if (isNeutral) {
                        return (
                          <span className="text-sm text-gray-600 flex items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                            {t("host.reviews.noChange")}
                          </span>
                        );
                      }

                      return (
                        <>
                          <span className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{difference}
                          </span>
                          <div className={`w-0 h-0 border-l-4 border-r-4 border-transparent ${isPositive ? 'border-b-4 border-b-green-500' : 'border-t-4 border-t-red-500'
                            }`}></div>
                          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? t("host.reviews.growing") : t("host.reviews.declining")}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* No Reviews State */}
            {(!stats?.reviews?.total || stats.reviews.total === 0) && (
              <div className="text-center py-12">
                <StarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t("host.reviews.noReviews.title")}</h3>
                <p className="text-gray-500 mb-6">{t("host.reviews.noReviews.subtitle")}</p>
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">{t("host.reviews.noReviews.tips")}</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>{t("host.reviews.noReviews.tip1")}</li>
                    <li>{t("host.reviews.noReviews.tip2")}</li>
                    <li>{t("host.reviews.noReviews.tip3")}</li>
                    <li>{t("host.reviews.noReviews.tip4")}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance by Property */}
        {stats?.reviews?.placeSpecificStats && stats.reviews.placeSpecificStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{t("host.reviews.performanceByProperty")}</h2>
                  <p className="text-sm text-gray-600 mt-1">Detailed review insights for each property</p>
                </div>
                <div className="text-sm text-gray-500">
                  {stats.reviews.placeSpecificStats.length} {stats.reviews.placeSpecificStats.length === 1 ? t("host.reviews.property") : t("host.reviews.propertiesCount")}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stats.reviews.placeSpecificStats.map((place) => {
                  // Determine gradient based on performance rating
                  const rating = place.averageRating || 0;
                  let gradientClass = "bg-gradient-to-br from-gray-50 to-gray-100"; // Default

                  if (rating >= 4.5) {
                    gradientClass = "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50";
                  } else if (rating >= 4.0) {
                    gradientClass = "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50";
                  } else if (rating >= 3.5) {
                    gradientClass = "bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50";
                  } else if (rating >= 3.0) {
                    gradientClass = "bg-gradient-to-br from-orange-50 via-red-50 to-pink-50";
                  } else {
                    gradientClass = "bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100";
                  }

                  return (
                    <div key={place.placeId} className={`${gradientClass} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full border border-gray-200 backdrop-blur-sm`}>
                      {/* Property Header */}
                      <div className="p-6 border-b border-white/30 flex-shrink-0 bg-white/40 backdrop-blur-sm rounded-t-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link
                              to={`/place/${place.placeId}`}
                              className="text-xl font-semibold text-gray-900 hover:text-primary hover:underline transition duration-200 line-clamp-2"
                            >
                              {place.placeTitle}
                            </Link>
                            <div className="flex items-center mt-2 space-x-3">
                              <div className="flex items-center space-x-1">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-xl font-bold text-gray-900">
                                  {place.averageRating || "0.0"}
                                </span>
                              </div>
                              <div className="h-4 w-px bg-gray-300"></div>
                              <span className="text-sm font-medium text-gray-600">
                                {place.totalReviews || 0} review{(place.totalReviews || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Performance Badge */}
                          <div className="ml-4 flex-shrink-0">
                            <PerformanceBadge rating={place.averageRating || 0} />
                          </div>
                        </div>
                      </div>

                      {/* Rating Insights */ }
                  <div className="p-6 flex-1 flex flex-col bg-white/20 backdrop-blur-sm rounded-b-xl">
                    {/* Rating Distribution Visualization */}
                    <div className="mb-6 flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-semibold text-gray-700">{t("host.reviews.ratingBreakdown")}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{t("host.reviews.trend")}:</span>
                          <TrendIndicator trend={place.trend || "neutral"} />
                        </div>
                      </div>

                      {/* Enhanced Rating Distribution */}
                      <div className="space-y-2 mb-6">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const ratingData = place.ratingDistribution?.[rating] || { count: 0, percentage: 0 };
                          return (
                            <RatingBar
                              key={rating}
                              rating={rating}
                              count={ratingData.count}
                              percentage={ratingData.percentage}
                              showDetailed={true}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Monthly Performance Summary */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{place.reviewsThisMonth || 0}</div>
                          <div className="text-xs text-gray-500">{t("host.reviews.reviewsThisMonth")}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{place.reviewsLastMonth || 0}</div>
                          <div className="text-xs text-gray-500">{t("host.reviews.reviewsLastMonth")}</div>
                        </div>
                      </div>

                      {/* Quality Insights - Always show with consistent height */}
                      <div className="mt-4 pt-4 border-t border-white/30">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-base font-medium text-gray-700">
                              {place.totalReviews > 0
                                ? Math.round(((place.ratingDistribution?.[5]?.count || 0) + (place.ratingDistribution?.[4]?.count || 0)) / place.totalReviews * 100)
                                : 0}%
                            </div>
                            <div className="text-xs text-gray-500">{t("host.reviews.positive")}</div>
                          </div>
                          <div>
                            <div className="text-base font-medium text-gray-700">
                              {place.totalReviews > 0
                                ? Math.round(((place.ratingDistribution?.[1]?.count || 0) + (place.ratingDistribution?.[2]?.count || 0)) / place.totalReviews * 100)
                                : 0}%
                            </div>
                            <div className="text-xs text-gray-500">{t("host.reviews.critical")}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Link */}
                    <div className="pt-4 border-t border-white/30 flex-shrink-0">
                      <Link
                        to={`/place/${place.placeId}`}
                        className="text-sm text-primary hover:text-primary-dark font-medium hover:underline transition duration-200"
                      >
                        {t("host.reviews.viewPropertyDetails")}
                      </Link>
                    </div>
                  </div>
                    </div>
              );
                })}
            </div>
          </div>
          </div>
        )}
    </div>
    </div >
  );
};

export default HostDashboardPage;
