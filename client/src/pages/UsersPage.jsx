import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { useNotification } from "../components/NotificationContext";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import EditUserModal from "../components/EditUserModal";
import Pagination from "../components/Pagination";
import ActiveFilters, { FilterCreators } from "../components/ActiveFilters";

export default function UsersPage() {
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cooldown, setCooldown] = useState(false);
  
  // Edit modal state
  const [editUser, setEditUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch all users for agent
  useEffect(() => {
    if (user?.userType === 'agent') {
      setLoading(true);
      api.get('/users/all')
        .then(({data}) => {
          setUsers(data);
          setFilteredUsers(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching users:', err);
          setLoading(false);
        });
    }
  }, [user]);

  // Redirect non-agents away from this page
  if (user && user.userType !== 'agent') {
    return <Navigate to="/account" />;
  }

  // Filter users by search term and type
  useEffect(() => {
    let filtered = [...users];
    
    // Filter by user type
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.userType === filterType);
    }
    
    // Filter by search term (name, email, or phone)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(term))
      );
    }
    
    // Sort users
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "userType":
          aValue = a.userType;
          bValue = b.userType;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, filterType, users, sortBy, sortOrder]);

  // Calculate pagination
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Pagination info for the component
  const showingFrom = totalUsers > 0 ? startIndex + 1 : 0;
  const showingTo = Math.min(endIndex, totalUsers);

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterType("all");
  };

  // Helper function to get active filters for the ActiveFilters component
  const getActiveFilters = () => {
    const filters = [];
    
    if (searchTerm) {
      filters.push(FilterCreators.search(searchTerm, () => setSearchTerm("")));
    }
    
    if (filterType !== "all") {
      filters.push(FilterCreators.userType(filterType, () => setFilterType("all")));
    }
    
    return filters;
  };

  // Get user type badge class
  const getUserTypeClass = (userType) => {
    switch(userType) {
      case 'host': return 'bg-green-100 text-green-800';
      case 'agent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Handle edit user
  const handleEditUser = (userToEdit) => {
    setEditUser(userToEdit);
    setIsEditModalOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async (formData) => {
    if (!editUser) return;
    
    setIsSavingEdit(true);
    try {
      await api.put(`/users/${editUser.id}`, formData);
      
      notify("User updated successfully", "success");
      setIsEditModalOpen(false);
      setEditUser(null);
      
      // Refresh the users list from server to get the latest data
      const { data } = await api.get('/users/all');
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error updating user:", error);
      
      // Handle specific error codes
      const errorData = error.response?.data;
      if (errorData?.code === 'PHONE_NUMBER_EXISTS') {
        notify("A user with this phone number already exists", "error");
      } else if (errorData?.code === 'INVALID_PHONE_FORMAT') {
        notify("Please enter a valid phone number in international format", "error");
      } else {
        notify(errorData?.error || "Error updating user", "error");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditUser(null);
  };

  // Handle delete confirmation
  const confirmDelete = (userId) => {
    // Find the user object to display their details in the confirmation
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setDeleteUserId(userId);
      
      // Set a cooldown to prevent rapid delete clicks
      setCooldown(true);
      setTimeout(() => setCooldown(false), 500);
    }
  };

  // Handle delete cancellation
  const closeDeleteModal = () => {
    setDeleteUserId(null);
    setSelectedUser(null);
  };

  // Handle actual user deletion
  const deleteUser = async () => {
    if (!deleteUserId) return;
    
    setIsDeleting(true);
    try {
      // Double-confirm with the backend
      await api.delete(`/users/${deleteUserId}?confirmation=true`);
      
      // Remove user from state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== deleteUserId));
      notify("User deleted successfully", "success");
      
      // Reset delete state
      setDeleteUserId(null);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      notify(error.response?.data?.error || "Error deleting user", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div>
        <AccountNav />
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold mb-4">Users Management</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav />
      <div className="px-8">
        <h1 className="text-2xl font-bold mb-4">Users Management</h1>
        
        {/* Search and filter controls */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
            <div className="w-full lg:w-1/2">
              <input
                type="text"
                placeholder="Search by name, email, or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                All ({users.length})
              </button>
              <button 
                onClick={() => setFilterType('client')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Clients ({users.filter(u => u.userType === 'client').length})
              </button>
              <button 
                onClick={() => setFilterType('host')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === 'host' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Hosts ({users.filter(u => u.userType === 'host').length})
              </button>
              <button 
                onClick={() => setFilterType('agent')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === 'agent' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Agents ({users.filter(u => u.userType === 'agent').length})
              </button>
            </div>
          </div>
          
          {/* Results summary */}
          <div className="text-sm text-gray-600">
            Showing {currentUsers.length} of {totalUsers} users
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          
          {/* Active filters */}
          <ActiveFilters 
            filters={getActiveFilters()}
            onClearAllFilters={clearAllFilters}
          />
        </div>
        
        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          user={editUser}
          isSaving={isSavingEdit}
        />
        
        {/* Delete confirmation modal using reusable component */}
        {deleteUserId && selectedUser && (
          <DeleteConfirmationModal
            isOpen={true}
            onClose={closeDeleteModal}
            onDelete={deleteUser}
            title="Delete User"
            itemToDelete={selectedUser}
            itemDetails={[
              { label: "Name", value: selectedUser.name },
              { label: "Email", value: selectedUser.email },
              { label: "Phone", value: selectedUser.phoneNumber || "No phone number" },
              { label: "Role", value: (
                <span className={`px-2 py-0.5 text-xs rounded-full ${getUserTypeClass(selectedUser.userType)}`}>
                  {selectedUser.userType.charAt(0).toUpperCase() + selectedUser.userType.slice(1)}
                </span>
              )},
              { label: "Joined", value: format(new Date(selectedUser.createdAt), 'MMM d, yyyy') }
            ]}
            consequences={[
              "User's account and profile information",
              "All of their bookings",
              ...(selectedUser.userType === 'host' ? [
                "All conference rooms owned by this host",
                "All bookings associated with their rooms"
              ] : [])
            ]}
            deleteInProgress={isDeleting}
          />
        )}
        
        {/* Users table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th 
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortBy === 'name' && (
                        <span className="text-primary">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortBy === 'email' && (
                        <span className="text-primary">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Phone</th>
                  <th 
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('userType')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortBy === 'userType' && (
                        <span className="text-primary">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      {sortBy === 'createdAt' && (
                        <span className="text-primary">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                      {filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span>No users found</span>
                          {searchTerm && (
                            <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                          )}
                        </div>
                      ) : (
                        "No users on this page"
                      )}
                    </td>
                  </tr>
                ) : (
                  currentUsers.map(userItem => (
                    <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">#{userItem.id}</td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900 break-all">{userItem.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {userItem.phoneNumber || (
                            <span className="text-gray-400 italic">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getUserTypeClass(userItem.userType)}`}>
                          {userItem.userType.charAt(0).toUpperCase() + userItem.userType.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {format(new Date(userItem.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          <a 
                            href={`/account/bookings?userId=${userItem.id}`} 
                            className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                            title="View user's bookings"
                          >
                            Bookings
                          </a>
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            title="Edit user details"
                          >
                            Edit
                          </button>
                          {/* Don't allow deleting yourself */}
                          {userItem.id !== user?.id && (
                            <button 
                              onClick={() => !cooldown && confirmDelete(userItem.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                              title="Delete user"
                              disabled={cooldown}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          showingFrom={showingFrom}
          showingTo={showingTo}
          totalItems={totalUsers}
          itemName="users"
        />
      </div>
    </div>
  );
}