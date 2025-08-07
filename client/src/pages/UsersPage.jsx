import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate } from "react-router-dom";
import { useNotification } from "../components/NotificationContext";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import EditUserModal from "../components/EditUserModal";
import Pagination from "../components/Pagination";
import { useDateLocalization } from "../hooks/useDateLocalization";

export default function UsersPage() {
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const { t } = useTranslation('users');
  const { formatLocalizedDate } = useDateLocalization();
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

  // Get user type badge class
  const getUserTypeClass = (userType) => {
    switch(userType) {
      case 'host': return 'bg-success-100 text-success-800';
      case 'agent': return 'bg-secondary/10 text-secondary';
      default: return 'bg-info-100 text-info-800';
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
      
      notify(t('notifications.userUpdated'), "success");
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
        notify("messages.phoneNumberExists", "error");
      } else if (errorData?.code === 'INVALID_PHONE_FORMAT') {
        notify("messages.invalidPhoneFormat", "error");
      } else {
        notify(errorData?.error || t('notifications.updateFailed'), "error");
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
      notify(t('notifications.userDeleted'), "success");
      
      // Reset delete state
      setDeleteUserId(null);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      notify(error.response?.data?.error || t('notifications.deleteFailed'), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div>
        <AccountNav />
        <div className="spacing-container spacing-section">
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
      <div className="spacing-container">
       
        {/* Search and filter controls */}
        <div className="bg-white spacing-card rounded-lg shadow-md mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
            <div className="w-full lg:w-1/2">
              <input
                type="text"
                placeholder={t('search.placeholder')}
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
                {t('filters.all')} ({users.length})
              </button>
              <button 
                onClick={() => setFilterType('client')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === 'client' ? 'bg-info-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {t('filters.clients')} ({users.filter(u => u.userType === 'client').length})
              </button>
              <button 
                onClick={() => setFilterType('host')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === 'host' ? 'bg-success-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {t('filters.hosts')} ({users.filter(u => u.userType === 'host').length})
              </button>
              <button 
                onClick={() => setFilterType('agent')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === 'agent' ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {t('filters.agents')} ({users.filter(u => u.userType === 'agent').length})
              </button>
            </div>
          </div>
          
          {/* Results summary */}
          <div className="text-sm text-gray-600">
            {t('search.showing', { count: currentUsers.length, total: totalUsers })}
            {searchTerm && ` ${t('search.matching', { term: searchTerm })}`}
          </div>
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
            title={t('deleteModal.title')}
            itemToDelete={selectedUser}
            itemDetails={[
              { label: t('deleteModal.labels.name'), value: selectedUser.name },
              { label: t('deleteModal.labels.email'), value: selectedUser.email },
              { label: t('deleteModal.labels.phone'), value: selectedUser.phoneNumber || t('deleteModal.labels.noPhone') },
              { label: t('deleteModal.labels.role'), value: (
                <span className={`px-2 py-0.5 text-xs rounded-full ${getUserTypeClass(selectedUser.userType)}`}>
                  {t(`userTypes.${selectedUser.userType}`)}
                </span>
              )},
              { label: t('deleteModal.labels.joined'), value: formatLocalizedDate(new Date(selectedUser.createdAt)) }
            ]}
            consequences={[
              t('deleteModal.consequences.account'),
              t('deleteModal.consequences.bookings'),
              ...(selectedUser.userType === 'host' ? [
                t('deleteModal.consequences.hostRooms'),
                t('deleteModal.consequences.hostBookings')
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
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('table.headers.id')}</th>
                  <th 
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      {t('table.headers.name')}
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
                      {t('table.headers.email')}
                      {sortBy === 'email' && (
                        <span className="text-primary">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('table.headers.phone')}</th>
                  <th 
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('userType')}
                  >
                    <div className="flex items-center gap-1">
                      {t('table.headers.type')}
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
                      {t('table.headers.joined')}
                      {sortBy === 'createdAt' && (
                        <span className="text-primary">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('table.headers.actions')}</th>
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
                          <span>{t('search.noResults')}</span>
                          {searchTerm && (
                            <p className="text-sm text-gray-400">{t('search.noResultsHelp')}</p>
                          )}
                        </div>
                      ) : (
                        t('table.noUsersOnPage')
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
                            <span className="text-gray-400 italic">{t('table.noPhone')}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getUserTypeClass(userItem.userType)}`}>
                          {t(`userTypes.${userItem.userType}`)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {formatLocalizedDate(new Date(userItem.createdAt))}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          <a 
                            href={`/account/bookings?userId=${userItem.id}`} 
                            className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                            title={t('actions.viewBookings')}
                          >
                            {t('actions.bookings')}
                          </a>
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="text-info-600 hover:text-info-800 text-sm font-medium transition-colors"
                            title={t('actions.editUser')}
                          >
                            {t('actions.edit')}
                          </button>
                          {/* Don't allow deleting yourself */}
                          {userItem.id !== user?.id && (
                            <button 
                              onClick={() => !cooldown && confirmDelete(userItem.id)}
                              className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors"
                              title={t('actions.deleteUser')}
                              disabled={cooldown}
                            >
                              {t('actions.delete')}
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