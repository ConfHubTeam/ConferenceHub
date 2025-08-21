import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import {
  HomeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

// Import reusable components for agent dashboard
import {
  MetricCard,
  StatusCard,
  StatsSummaryCard,
  TrendIndicator
} from "../components/AgentDashboard";

const AgentDashboardPage = () => {
  const { user, isReady } = useContext(UserContext);
  const { t } = useTranslation("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAgentStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/agent-stats");
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching agent statistics:", err);
      setError(err.response?.data?.error || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatistics();
  }, []);

  // Redirect if not authenticated or not an agent
  if (!isReady) {
    return <div className="min-h-screen bg-gray-50 pt-8"><div className="w-full px-4"><p>{t("common.loading")}</p></div></div>;
  }

  if (isReady && !user) {
    return <Navigate to="/login" />;
  }

  if (user && user.userType !== 'agent') {
    return <Navigate to="/account" />;
  }

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
                <h3 className="text-lg font-medium">{t("agent.error.loadingDashboard")}</h3>
                <p className="mt-2 text-sm">{error}</p>
                <button
                  onClick={fetchAgentStatistics}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
                >
                  {t("agent.error.tryAgain")}
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
      <div className="w-full px-4">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Places */}
          <div className="h-full">
            <MetricCard
              icon={HomeIcon}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              title={t("agent.metrics.totalPlaces")}
              value={stats?.places?.total || 0}
            />
          </div>

          {/* Total Paid to Agent */}
          <div className="h-full">
            <MetricCard
              icon={CurrencyDollarIcon}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              title={t("agent.metrics.totalPaidToAgent")}
              value={(stats?.bookings?.status?.approved || 0) - (stats?.hostPayments?.total || 0)}
            />
          </div>

          {/* Total Paid to Host */}
          <div className="h-full">
            <MetricCard
              icon={CheckCircleIcon}
              iconBgColor="bg-emerald-100"
              iconColor="text-emerald-600"
              title={t("agent.metrics.totalPaidToHost")}
              value={stats?.hostPayments?.total || 0}
            />
          </div>

          {/* Platform Rating */}
          <div className="h-full">
            <MetricCard
              icon={StarIcon}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              title={t("agent.metrics.platformRating")}
              value={`${stats?.reviews?.averageRating || "0.0"} ★`}
            />
          </div>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Overall Booking Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t("agent.bookingStatus.title")}</h2>
              <p className="text-sm text-gray-600 mt-1">{t("agent.bookingStatus.subtitle")}</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="h-full">
                  <StatusCard
                    icon={ClockIcon}
                    iconBgColor="bg-yellow-100"
                    iconColor="text-yellow-600"
                    count={stats?.bookings?.status?.pending || 0}
                    label={t("agent.bookingStatus.pending")}
                  />
                </div>
                <div className="h-full">
                  <StatusCard
                    icon={CheckCircleIcon}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                    count={(stats?.bookings?.status?.approved || 0) - (stats?.hostPayments?.total || 0)}
                    label={t("agent.bookingStatus.approved")}
                  />
                </div>
                <div className="h-full">
                  <StatusCard
                    icon={CalendarIcon}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                    count={stats?.bookings?.status?.selected || 0}
                    label={t("agent.bookingStatus.selected")}
                  />
                </div>
                <div className="h-full">
                  <StatusCard
                    icon={CheckCircleIcon}
                    iconBgColor="bg-emerald-100"
                    iconColor="text-emerald-600"
                    count={stats?.hostPayments?.total || 0}
                    label={t("agent.bookingStatus.paidToHost")}
                  />
                </div>
                <div className="h-full">
                  <StatusCard
                    icon={ExclamationTriangleIcon}
                    iconBgColor="bg-orange-100"
                    iconColor="text-orange-600"
                    count={stats?.bookings?.status?.cancelled || 0}
                    label={t("agent.bookingStatus.cancelled")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Platform Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t("agent.users.title")}</h2>
              <p className="text-sm text-gray-600 mt-1">{t("agent.users.subtitle")}</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UsersIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.users?.byType?.host || 0}</p>
                  <p className="text-sm text-gray-500">{t("agent.users.hosts")}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UsersIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.users?.byType?.client || 0}</p>
                  <p className="text-sm text-gray-500">{t("agent.users.clients")}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t("agent.users.monthlyGrowth")}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.users?.thisMonth || 0}
                    </span>
                    <span className="text-sm text-gray-500">{t("agent.users.thisMonth")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Review Analytics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t("agent.reviews.title")}</h2>
            <p className="text-sm text-gray-600 mt-1">{t("agent.reviews.subtitle")}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatsSummaryCard
                icon={StarIcon}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                value={stats?.reviews?.total || 0}
                label={t("agent.reviews.totalReviews")}
              />
              
              <StatsSummaryCard
                icon={ChartBarIcon}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                value={stats?.reviews?.averageRating || "0.0"}
                label={t("agent.reviews.averageRating")}
              />
              
              <StatsSummaryCard
                icon={ArrowTrendingUpIcon}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                value={stats?.reviews?.thisMonth || 0}
                label={t("agent.reviews.thisMonth")}
              />
              
              <StatsSummaryCard
                icon={EyeIcon}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                value={stats?.platformActivity?.pendingReviews || 0}
                label={t("agent.reviews.pendingReviews")}
              />
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t("agent.trends.title")}</h2>
            <p className="text-sm text-gray-600 mt-1">{t("agent.trends.subtitle")}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Growth */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-blue-900">{t("agent.trends.userGrowth")}</h3>
                  {stats?.growthRates?.users > 0 ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                  ) : stats?.growthRates?.users < 0 ? (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-900 mb-1">
                  {stats?.growthRates?.users > 0 ? '+' : ''}{stats?.growthRates?.users || 0}%
                </div>
                <div className="text-xs text-blue-700">
                  {stats?.users?.thisMonth || 0} new users this month
                </div>
              </div>

              {/* Booking Approvals */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-green-900">{t("agent.trends.bookingApprovals")}</h3>
                  {stats?.growthRates?.approvedBookings > 0 ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                  ) : stats?.growthRates?.approvedBookings < 0 ? (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div className="text-2xl font-bold text-green-900 mb-1">
                  {stats?.growthRates?.approvedBookings > 0 ? '+' : ''}{stats?.growthRates?.approvedBookings || 0}%
                </div>
                <div className="text-xs text-green-700">
                  {stats?.bookings?.approvedThisMonth || 0} approved this month
                </div>
              </div>

              {/* Places Growth */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-purple-900">{t("agent.trends.placesGrowth")}</h3>
                  {stats?.growthRates?.places > 0 ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                  ) : stats?.growthRates?.places < 0 ? (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div className="text-2xl font-bold text-purple-900 mb-1">
                  {stats?.growthRates?.places > 0 ? '+' : ''}{stats?.growthRates?.places || 0}%
                </div>
                <div className="text-xs text-purple-700">
                  {stats?.places?.thisMonth || 0} new places this month
                </div>
              </div>

              {/* Review Activity */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-orange-900">{t("agent.trends.reviewActivity")}</h3>
                  {stats?.growthRates?.reviews > 0 ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                  ) : stats?.growthRates?.reviews < 0 ? (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div className="text-2xl font-bold text-orange-900 mb-1">
                  {stats?.growthRates?.reviews > 0 ? '+' : ''}{stats?.growthRates?.reviews || 0}%
                </div>
                <div className="text-xs text-orange-700">
                  {stats?.reviews?.thisMonth || 0} reviews this month
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Activity Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t("agent.activity.title")}</h2>
            <p className="text-sm text-gray-600 mt-1">{t("agent.activity.subtitle")}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats?.platformActivity?.totalBookingsToday || 0}</div>
                <div className="text-sm text-gray-500">{t("agent.activity.bookingsToday")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats?.platformActivity?.activeHosts || 0}</div>
                <div className="text-sm text-gray-500">{t("agent.activity.activeHosts")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats?.platformActivity?.activeClients || 0}</div>
                <div className="text-sm text-gray-500">{t("agent.activity.activeClients")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats?.users?.total || 0}</div>
                <div className="text-sm text-gray-500">{t("agent.activity.totalUsers")}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t("agent.quickActions.title")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link 
                  to="/account/bookings" 
                  className="bg-primary text-white p-4 rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all"
                >
                  <span className="font-medium">{t("agent.quickActions.manageBookings")}</span>
                </Link>
                <Link 
                  to="/account/users" 
                  className="bg-blue-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all"
                >
                  <span className="font-medium">{t("agent.quickActions.viewUsers")}</span>
                </Link>
                <Link 
                  to="/account/all-places" 
                  className="bg-green-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all"
                >
                  <span className="font-medium">{t("agent.quickActions.viewPlaces")}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardPage;