import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

/**
 * ReviewAnalytics Component
 * Implements comprehensive review analytics for US-R013
 * Follows SOLID principles with single responsibility for review data visualization
 * Uses DRY principles with reusable chart configurations
 */
export default function ReviewAnalytics({ reviewStats }) {
  const [chartData, setChartData] = useState({});

  console.log('ReviewAnalytics received props:', reviewStats); // Debug log

  useEffect(() => {
    if (reviewStats) {
      prepareChartData();
    }
  }, [reviewStats]);

  const prepareChartData = () => {
    // Reviews per month line chart data
    const monthlyData = {
      labels: reviewStats.reviewsPerMonth?.map(item => {
        // Handle different date formats
        let dateStr = item.month;
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
          // Format: "2025-07" 
          const [year, month] = dateStr.split('-');
          const date = new Date(year, month - 1);
          return date.toLocaleDateString("en-US", { 
            month: "short", 
            year: "numeric" 
          });
        } else {
          // Fallback for other formats
          const date = new Date(dateStr);
          return date.toLocaleDateString("en-US", { 
            month: "short", 
            year: "numeric" 
          });
        }
      }) || [],
      datasets: [
        {
          label: "Reviews",
          data: reviewStats.reviewsPerMonth?.map(item => item.count) || [],
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
        },
      ],
    };

    // Rating distribution pie chart data
    const ratingData = {
      labels: reviewStats.ratingDistribution?.map(item => `${item.rating} ⭐`) || [],
      datasets: [
        {
          data: reviewStats.ratingDistribution?.map(item => item.percentage) || [],
          backgroundColor: [
            "#ef4444", // 1 star - red
            "#f97316", // 2 stars - orange
            "#eab308", // 3 stars - yellow
            "#22c55e", // 4 stars - green
            "#059669", // 5 stars - emerald
          ],
          borderWidth: 1,
        },
      ],
    };

    // Moderation stats bar chart data
    const moderationData = {
      labels: reviewStats.moderationStats?.map(item => 
        item.status.charAt(0).toUpperCase() + item.status.slice(1)
      ) || [],
      datasets: [
        {
          label: "Reviews",
          data: reviewStats.moderationStats?.map(item => item.count) || [],
          backgroundColor: [
            "#f59e0b", // pending - amber
            "#10b981", // approved - emerald
            "#ef4444", // rejected - red
          ],
        },
      ],
    };

    setChartData({
      monthly: monthlyData,
      rating: ratingData,
      moderation: moderationData,
    });
  };

  if (!reviewStats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">📊 Review Analytics</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where review stats exist but have no data
  if (reviewStats && reviewStats.total === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-6">📊 Review Analytics</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">
            Once users start leaving reviews, analytics will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-6">📊 Review Analytics</h2>
      
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">Total Reviews</div>
          <div className="text-2xl font-bold text-blue-800">{reviewStats.total}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Average Rating</div>
          <div className="text-2xl font-bold text-green-800">
            {reviewStats.averagePlatformRating} ⭐
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600">Avg Reply Time</div>
          <div className="text-2xl font-bold text-purple-800">
            {reviewStats.averageHostReplyTime ? `${reviewStats.averageHostReplyTime}h` : "N/A"}
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-600">Recent Activity</div>
          <div className="text-2xl font-bold text-orange-800">
            {reviewStats.recentActivity}
            <span className="text-sm font-normal"> (7 days)</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reviews per Month */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Reviews per Month</h3>
          <div className="h-64">
            {chartData.monthly && (
              <Line
                data={chartData.monthly}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
          <div className="h-64">
            {chartData.rating && (
              <Pie
                data={chartData.rating}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${context.parsed}%`;
                        },
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Moderation Statistics</h3>
          <div className="h-64">
            {chartData.moderation && (
              <Bar
                data={chartData.moderation}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Reply Statistics */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Host Reply Status</h3>
          <div className="space-y-3">
            {reviewStats.reviewReplyStats?.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="capitalize">
                  {stat.status.replace("_", " ")}
                </span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className={`h-2 rounded-full ${
                        stat.status === "with_reply" ? "bg-green-500" : "bg-gray-400"
                      }`}
                      style={{
                        width: `${
                          (stat.count / 
                          reviewStats.reviewReplyStats.reduce((sum, s) => sum + s.count, 0)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top and Bottom Rated Places */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Rated Places */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-green-800">
            🏆 Top 5 Rated Places
          </h3>
          <div className="space-y-2">
            {reviewStats.topRatedPlaces?.length > 0 ? (
              reviewStats.topRatedPlaces.slice(0, 5).map((place, index) => (
                <a 
                  key={place.id} 
                  href={`/place/${place.id}`}
                  className="flex justify-between items-center py-2 border-b border-green-200 hover:bg-green-100 transition-colors duration-200 rounded px-2 cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-green-900 truncate group-hover:text-green-700">
                      {place.title}
                    </div>
                    <div className="text-sm text-green-600">
                      {place.review_count} reviews
                    </div>
                  </div>
                  <div className="flex items-center ml-2">
                    <div className="text-green-800 font-bold mr-2">
                      {place.avg_rating} ⭐
                    </div>
                    <svg 
                      className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))
            ) : (
              <div className="text-green-600 text-center py-4">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Lowest Rated Places */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-red-800">
            📉 Bottom 5 Rated Places
          </h3>
          <div className="space-y-2">
            {reviewStats.lowestRatedPlaces?.length > 0 ? (
              reviewStats.lowestRatedPlaces.slice(0, 5).map((place, index) => (
                <a 
                  key={place.id} 
                  href={`/place/${place.id}`}
                  className="flex justify-between items-center py-2 border-b border-red-200 hover:bg-red-100 transition-colors duration-200 rounded px-2 cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-red-900 truncate group-hover:text-red-700">
                      {place.title}
                    </div>
                    <div className="text-sm text-red-600">
                      {place.review_count} reviews
                    </div>
                  </div>
                  <div className="flex items-center ml-2">
                    <div className="text-red-800 font-bold mr-2">
                      {place.avg_rating} ⭐
                    </div>
                    <svg 
                      className="w-4 h-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))
            ) : (
              <div className="text-red-600 text-center py-4">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Most Active Reviewers */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">
          👥 Most Active Reviewers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-200">
                <th className="text-left py-2 text-blue-800">Name</th>
                <th className="text-left py-2 text-blue-800">Email</th>
                <th className="text-right py-2 text-blue-800">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {reviewStats.mostActiveReviewers?.length > 0 ? (
                reviewStats.mostActiveReviewers.map((reviewer, index) => (
                  <tr key={reviewer.id} className="border-b border-blue-100">
                    <td className="py-2 text-blue-900">{reviewer.name}</td>
                    <td className="py-2 text-blue-600 text-sm">{reviewer.email}</td>
                    <td className="py-2 text-right font-bold text-blue-800">
                      {reviewer.review_count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-blue-600">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
