import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";

export default function UsersPage() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch all users for agent
  useEffect(() => {
    if (user?.userType === 'agent') {
      setLoading(true);
      api.get('/users')
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
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{user.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getUserTypeClass(user.userType)}`}>
                          {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <a href={`/account/bookings?userId=${user.id}`} className="text-primary hover:underline text-sm">
                          View Bookings
                        </a>
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