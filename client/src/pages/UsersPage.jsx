import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { useNotification } from "../components/NotificationContext";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

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
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, filterType, users]);

  // Get user type badge class
  const getUserTypeClass = (userType) => {
    switch(userType) {
      case 'host': return 'bg-green-100 text-green-800';
      case 'agent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
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
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-full text-sm ${filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType('client')}
                className={`px-4 py-2 rounded-full text-sm ${filterType === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Clients
              </button>
              <button 
                onClick={() => setFilterType('host')}
                className={`px-4 py-2 rounded-full text-sm ${filterType === 'host' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Hosts
              </button>
              <button 
                onClick={() => setFilterType('agent')}
                className={`px-4 py-2 rounded-full text-sm ${filterType === 'agent' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Agents
              </button>
            </div>
          </div>
        </div>
        
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
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">User Type</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Joined</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(userItem => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{userItem.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{userItem.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{userItem.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getUserTypeClass(userItem.userType)}`}>
                          {userItem.userType.charAt(0).toUpperCase() + userItem.userType.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {format(new Date(userItem.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <a href={`/account/bookings?userId=${userItem.id}`} className="text-primary hover:underline text-sm">
                          View Bookings
                        </a>
                        {/* Don't allow deleting yourself */}
                        {userItem.id !== user?.id && (
                          <button 
                            onClick={() => !cooldown && confirmDelete(userItem.id)}
                            className="text-red-600 hover:underline text-sm ml-3 flex items-center gap-1 border border-red-200 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete user"
                            disabled={cooldown}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}