import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ActiveFilters, { FilterCreators } from "./ActiveFilters";
import api from "../utils/api";

export default function BookingFilters({
  user,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  stats,
  selectedUserId,
  setSelectedUserId,
  onClearAllFilters
}) {
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Load users list for agent filtering
  useEffect(() => {
    if (user?.userType === "agent") {
      setLoadingUsers(true);
      api.get("/users/all")
        .then(({data}) => {
          setAllUsers(data);
          setLoadingUsers(false);
        })
        .catch(err => {
          console.error("Error fetching users:", err);
          setLoadingUsers(false);
        });
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest(".user-filter-container")) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  // Handle user filter change
  const handleUserFilterChange = (newUserId) => {
    setSelectedUserId(newUserId);
    
    // Update URL to reflect the filter
    const newParams = new URLSearchParams(location.search);
    if (newUserId) {
      newParams.set("userId", newUserId);
    } else {
      newParams.delete("userId");
    }
    
    // Navigate to the new URL
    const newUrl = `${location.pathname}?${newParams.toString()}`;
    navigate(newUrl, { replace: true });
  };

  // Get selected user details
  function getSelectedUser() {
    if (!selectedUserId || !allUsers.length) return null;
    return allUsers.find(u => u.id.toString() === selectedUserId);
  }

  // Helper function to get active filters
  const getActiveFilters = () => {
    const filters = [];
    
    if (selectedUserId && user?.userType === "agent") {
      filters.push(FilterCreators.user(getSelectedUser(), () => {
        handleUserFilterChange("");
        setUserSearchTerm("");
      }));
    }
    
    if (searchTerm) {
      filters.push(FilterCreators.search(searchTerm, () => setSearchTerm("")));
    }
    
    if (statusFilter !== "pending" && statusFilter !== "all") {
      filters.push(FilterCreators.status(statusFilter, () => setStatusFilter("pending")));
    }
    
    return filters;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Agent User Filter */}
        {user?.userType === "agent" && (
          <div className="lg:w-64 user-filter-container">
            <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by User
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={selectedUserId ? getSelectedUser()?.name || "Select user..." : "Search users..."}
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                onFocus={() => setShowUserDropdown(true)}
                disabled={loadingUsers}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {selectedUserId && (
                <button
                  onClick={() => {
                    handleUserFilterChange("");
                    setUserSearchTerm("");
                    setShowUserDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* User Dropdown */}
              {showUserDropdown && !loadingUsers && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      handleUserFilterChange("");
                      setUserSearchTerm("");
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 text-sm"
                  >
                    <span className="font-medium">All Users</span>
                    <span className="text-gray-500 ml-2">({allUsers.length} total)</span>
                  </button>
                  
                  {allUsers
                    .filter(user => {
                      if (!userSearchTerm) return true;
                      const searchLower = userSearchTerm.toLowerCase();
                      return (
                        user.name.toLowerCase().includes(searchLower) ||
                        user.email.toLowerCase().includes(searchLower) ||
                        user.userType.toLowerCase().includes(searchLower)
                      );
                    })
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          handleUserFilterChange(user.id.toString());
                          setUserSearchTerm("");
                          setShowUserDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{user.name}</span>
                            <span className="text-gray-500 ml-2">({user.userType})</span>
                          </div>
                          <span className="text-xs text-gray-400">{user.email}</span>
                        </div>
                      </button>
                    ))
                  }
                  
                  {userSearchTerm && allUsers.filter(user => {
                    const searchLower = userSearchTerm.toLowerCase();
                    return (
                      user.name.toLowerCase().includes(searchLower) ||
                      user.email.toLowerCase().includes(searchLower) ||
                      user.userType.toLowerCase().includes(searchLower)
                    );
                  }).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No users found matching "{userSearchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {loadingUsers && (
              <p className="mt-2 text-xs text-gray-500">Loading users...</p>
            )}
          </div>
        )}

        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search bookings
          </label>
          <input
            id="search"
            type="text"
            placeholder={
              user?.userType === "agent" 
                ? "Search by request ID, host name, client name, or property name..."
                : user?.userType === "host"
                ? "Search by request ID, property name, or address..."
                : "Search by property name or address..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="lg:w-64">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px"
            }}
          >
            <option value="pending">Pending ({stats.pending})</option>
            <option value="all">All ({stats.total})</option>
            <option value="approved">
              {user?.userType === "client" ? "Confirmed" : "Approved"} ({stats.approved})
            </option>
            <option value="rejected">Rejected ({stats.rejected})</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="lg:w-64">
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            id="sort"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white cursor-pointer text-sm appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px"
            }}
          >
            <option value="createdAt-desc">Newest first</option>
            <option value="createdAt-asc">Oldest first</option>
            <option value="checkInDate-asc">Check-in date</option>
            <option value="totalPrice-desc">Highest price</option>
            <option value="totalPrice-asc">Lowest price</option>
            <option value="place-asc">Property name</option>
          </select>
        </div>
      </div>
      
      {/* Active Filters */}
      <ActiveFilters 
        filters={getActiveFilters()}
        onClearAllFilters={onClearAllFilters}
      />
    </div>
  );
}
