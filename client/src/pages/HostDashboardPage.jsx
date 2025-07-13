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
        </div>
      </div>
    </div>
  );
};

export default HostDashboardPage;
