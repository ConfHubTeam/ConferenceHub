import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReviewAnalytics from "../components/ReviewAnalytics";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate, Link } from "react-router-dom";

export default function DashboardPage() {
  const { t } = useTranslation("dashboard");
  const { user } = useContext(UserContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notifications are now managed by the unified notification system

  // Fetch dashboard statistics
  useEffect(() => {
    if (user?.userType === 'agent') {
      setLoading(true);
      api.get('/users/stats')
        .then(({data}) => {
          console.log('Dashboard stats received:', data); // Debug log
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching statistics:', err);
          setLoading(false);
        });
    }
  }, [user]);

  // Redirect non-agents away from this page
  if (user && user.userType !== 'agent') {
    return <Navigate to="/account" />;
  }

  // Show loading state
  if (loading) {
    return (
      <div>
        <div className="px-8 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format and transform stats data for display
  const userStats = stats?.users.reduce((acc, item) => {
    acc[item.userType] = item.count;
    return acc;
  }, {}) || {};
  
  const bookingStats = stats?.bookings.reduce((acc, item) => {
    acc[item.status] = item.count;
    return acc;
  }, {}) || {};

  return (
    <div>
      <div className="px-8">
        <h1 className="text-2xl font-bold mb-6">{t("agent.title")}</h1>
        
        {/* Review Analytics Section - US-R013 Implementation */}
        <ReviewAnalytics reviewStats={stats?.reviews} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Users Stat Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{t("agent.users.title")}</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-500">{t("agent.users.clients")}</div>
                <div className="text-2xl font-bold">{userStats.client || 0}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-500">{t("agent.users.hosts")}</div>
                <div className="text-2xl font-bold">{userStats.host || 0}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-purple-500">{t("agent.users.agents")}</div>
                <div className="text-2xl font-bold">{userStats.agent || 0}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">{t("agent.users.total")}</div>
                <div className="text-2xl font-bold">
                  {Number(userStats.client || 0) + Number(userStats.host || 0) + Number(userStats.agent || 0)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Places Stat Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{t("agent.places.title")}</h2>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">{t("agent.places.totalRooms")}</div>
                <div className="text-2xl font-bold">{stats?.places.total || 0}</div>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded">
                <div className="text-sm text-primary">{t("agent.places.available")}</div>
                <div className="text-2xl font-bold">
                  {stats?.places.available || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Total Bookings Stat Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{t("agent.bookings.title")}</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-sm text-yellow-600">{t("agent.bookings.pending")}</div>
                <div className="text-2xl font-bold">{bookingStats.pending || 0}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-600">{t("agent.bookings.approved")}</div>
                <div className="text-2xl font-bold">{bookingStats.approved || 0}</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm text-red-600">{t("agent.bookings.rejected")}</div>
                <div className="text-2xl font-bold">{bookingStats.rejected || 0}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">{t("agent.bookings.total")}</div>
                <div className="text-2xl font-bold">
                  {Number(bookingStats.pending || 0) + Number(bookingStats.approved || 0) + Number(bookingStats.rejected || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{t("agent.quickAccess.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/account/bookings" className="bg-primary text-white p-4 rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all">
              <span className="font-medium">{t("agent.quickAccess.manageBookings")}</span>
            </Link>
            <Link to="/account/users" className="bg-blue-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all">
              <span className="font-medium">{t("agent.quickAccess.viewUsers")}</span>
            </Link>
            <Link to="/account/all-places" className="bg-green-500 text-white p-4 rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all">
              <span className="font-medium">{t("agent.quickAccess.viewRooms")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}