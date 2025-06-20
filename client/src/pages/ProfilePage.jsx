import { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { Navigate, useParams, useLocation } from "react-router-dom";
import api from "../utils/api";
import AccountNav from "../components/AccountNav";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import CustomPhoneInput from "../components/CustomPhoneInput";

export default function ProfilePage({}) {
  const [redirect, setRedirect] = useState(); // control the redirect after logout
  const { isReady, user, setUser, setReady } = useContext(UserContext); // check the user data loading status
  const { notify } = useNotification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const notificationShown = useRef(false);
  
  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Only process notifications once to prevent infinite loops
    if (notificationShown.current) return;
    
    // Check for success/new account flags in URL params
    const searchParams = new URLSearchParams(location.search);
    const loginSuccess = searchParams.get('login_success');
    const newAccount = searchParams.get('new_account');
    
    // Show notifications based on URL parameters
    if (newAccount === 'true') {
      notify('Your conference hub account has been created successfully!', 'success');
      notificationShown.current = true;
    } else if (loginSuccess === 'true') {
      notify('Login successful!', 'success');
      notificationShown.current = true;
    }
    
    // Clean up URL params after showing notifications
    if (loginSuccess || newAccount) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location.search]); // Only depend on location.search, not the notify function

  if (!isReady) {
    return <div className="px-14"><p>Loading...</p></div>;
  }

  if (isReady && !user && !redirect) {
    // check if user logined
    return <Navigate to={"/login"} />;
  }

  async function logout() {
    setIsLoggingOut(true);
    try {
      // Regular logout
      await api.post("/auth/logout");
      
      // Clear any token or auth data from local storage
      localStorage.removeItem('token');
      localStorage.removeItem('telegram_auth_user_type');
      localStorage.removeItem('telegram_auth_error');
      
      // Clear all cookies by setting their expiration to past date
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      notify("Successfully logged out", "success");
      setRedirect("/");
      setUser(null);
    } catch (error) {
      notify("Error logging out. Please try again.", "error");
      setIsLoggingOut(false);
    }
  }

  async function logoutTelegram() {
    setIsLoggingOut(true);
    try {
      // First log out from Telegram
      await api.post("/telegram-auth/logout");
      // Then perform regular logout
      await api.post("/auth/logout");
      
      // Remove any Telegram-related data from local storage
      localStorage.removeItem('telegram_auth_user_type');
      localStorage.removeItem('telegram_auth_error');
      localStorage.removeItem('token');
      
      // Clear all cookies by setting their expiration to past date
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      notify("Successfully logged out", "success");
      setRedirect("/");
      setUser(null);
    } catch (error) {
      notify("Error logging out. Please try again.", "error");
      setIsLoggingOut(false);
    }
  }
  
  // Start editing profile
  function startEditing() {
    setEditName(user.telegramLinked && user.telegramFirstName ? user.telegramFirstName : user.name);
    setEditPhoneNumber(user.phoneNumber || '');
    setIsEditing(true);
  }
  
  // Cancel editing
  function cancelEditing() {
    setIsEditing(false);
    setEditName('');
    setEditPhoneNumber('');
  }
  
  // Save profile changes
  async function saveProfile() {
    if (!editName.trim()) {
      notify("Name is required", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await api.put('/users/profile', {
        name: editName.trim(),
        phoneNumber: editPhoneNumber.trim()
      });
      
      // Update the user context with the new data
      setUser(response.data.user);
      setIsEditing(false);
      notify(response.data.message, "success");
    } catch (error) {
      notify(error.response?.data?.error || "Error updating profile", "error");
    } finally {
      setIsSaving(false);
    }
  }
  
  // Function to delete account
  async function deleteAccount() {
    setIsDeleting(true);
    try {
      await api.delete('/users/account/delete?confirmation=true');
      
      // Clear local storage and cookies
      localStorage.clear();
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      notify("Your account has been deleted successfully", "success");
      setUser(null);
      setRedirect("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      notify(error.response?.data?.error || "Error deleting account. Please try again.", "error");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div>
      <AccountNav />
      <div className="text-center max-w-lg mx-auto mt-8">
        {/* User info card */}
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="mb-5">
            {!isEditing ? (
              <>
                {/* View mode */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <button
                    onClick={startEditing}
                    className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
                
                <div className="text-left space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <div className="text-lg font-semibold">
                      {user.telegramLinked && user.telegramFirstName ? user.telegramFirstName : user.name}
                    </div>
                  </div>
                  
                  {user.email && !user.email.includes("telegram_") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <div className="text-sm text-gray-700">{user.email}</div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                    <div className="text-sm text-gray-700">
                      {user.phoneNumber || 'Not provided'}
                    </div>
                  </div>
                  
                  {/* Show Telegram username if available */}
                  {user.telegramUsername && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Telegram</label>
                      <div className="text-sm text-gray-700">@{user.telegramUsername}</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Edit mode */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Edit Profile</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={cancelEditing}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
                
                <div className="text-left space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                    <CustomPhoneInput
                      value={editPhoneNumber}
                      onChange={setEditPhoneNumber}
                      placeholder="Enter your phone number"
                      disabled={isSaving}
                    />
                  </div>
                  
                  {user.email && !user.email.includes("telegram_") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
                        {user.email} (cannot be changed)
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold text-base mb-2">Account Information</h3>
            <div className="grid grid-cols-1 gap-1 text-left text-sm">
              <div className="flex items-center">
                <span className="text-gray-600">Account Type:</span> 
                <span className="font-medium ml-1">
                  {user.userType === 'host' ? 'Host' : 
                   user.userType === 'agent' ? 'Agent' : 'Client'}
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  {user.userType === 'host' ? '(manages rooms)' : 
                   user.userType === 'agent' ? '(system administrator)' : '(books rooms)'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium ml-1">
                  {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}
                </span>
              </div>
              
              {/* Show Telegram connection status */}
              {user.telegramLinked !== undefined && (
                <div className="flex items-center">
                  <span className="text-gray-600">Telegram:</span>
                  <span className={`font-medium ml-1 ${user.telegramLinked ? 'text-green-600' : 'text-red-600'}`}>
                    {user.telegramLinked ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2 mt-6 border-t pt-5">
            {/* Single logout button that handles both regular and Telegram logout */}
            <button 
              onClick={user.telegramLinked ? logoutTelegram : logout} 
              className="primary w-full max-w-xs mx-auto"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
            
            {/* Delete account button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors mt-4 w-full max-w-xs mx-auto flex items-center justify-center"
              disabled={isDeleting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </button>
          </div>
        </div>
        
        {/* Delete account confirmation modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onDelete={deleteAccount}
          title="Delete Account"
          itemToDelete={user}
          itemDetails={[
            { label: "Name", value: user?.telegramLinked && user?.telegramFirstName ? user?.telegramFirstName : user?.name },
            { label: "Email", value: user?.email && !user?.email.includes("telegram_") ? user?.email : "No email provided" },
            { label: "Account", value: 
              user?.userType === 'host' ? 'Host Account' : 
              user?.userType === 'agent' ? 'Agent Account' : 'Client Account' }
          ]}
          consequences={[
            "Your account and profile information",
            "All of your bookings",
            ...(user?.userType === 'host' ? [
              "All conference rooms you own",
              "All bookings associated with your rooms"
            ] : []),
            ...(user?.userType === 'agent' ? [
              "All administrative access to the system",
              "Access to user and booking management"
            ] : [])
          ]}
          deleteInProgress={isDeleting}
        />
      </div>
    </div>
  );
}
