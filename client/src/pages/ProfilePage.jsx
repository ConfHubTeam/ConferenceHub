import { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { Navigate, useParams, useLocation } from "react-router-dom";
import api from "../utils/api";
import AccountNav from "../components/AccountNav";

export default function ProfilePage({}) {
  const [redirect, setRedirect] = useState(); // control the redirect after logout
  const { isReady, user, setUser, setReady } = useContext(UserContext); // check the user data loading status
  const { notify } = useNotification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const notificationShown = useRef(false);
  
  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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
  
  // Function to delete account
  async function deleteAccount() {
    if (deleteConfirmText !== "DELETE") {
      return;
    }
    
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
  
  // Check if delete should be enabled
  const isDeleteEnabled = deleteConfirmText === "DELETE" && !isDeleting;

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
            {/* For Telegram users, prioritize displaying first name if available, otherwise fallback to regular name */}
            <div className="text-2xl font-bold mb-1">
              {user.telegramLinked && user.telegramFirstName ? user.telegramFirstName : user.name}
            </div>
            
            {/* Only show email if it exists and doesn't contain "telegram_" */}
            {user.email && !user.email.includes("telegram_") && (
              <div className="text-sm text-gray-500">{user.email}</div>
            )}
            
            {/* Show Telegram username if available */}
            {user.telegramUsername && (
              <div className="text-xs text-gray-500 mt-1">
                Telegram: @{user.telegramUsername}
              </div>
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold text-base mb-2">Account Information</h3>
            <div className="grid grid-cols-1 gap-1 text-left text-sm">
              <div className="flex items-center">
                <span className="text-gray-600">Account Type:</span> 
                <span className="font-medium ml-1">
                  {user.userType === 'host' ? 'Host' : 'Client'}
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  {user.userType === 'host' ? '(manages rooms)' : '(books rooms)'}
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
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Delete Account - Confirmation Required
              </h3>
              
              <p className="font-semibold text-red-600 mb-2">Warning: This action cannot be undone!</p>
              <p className="mb-4">
                The following data will be permanently deleted:
              </p>
              <ul className="list-disc ml-6 mb-4 text-sm text-gray-600">
                <li>Your account and profile information</li>
                <li>All of your bookings</li>
                {user?.userType === 'host' && (
                  <>
                    <li><span className="font-semibold">All conference rooms you own</span></li>
                    <li>All bookings associated with your rooms</li>
                  </>
                )}
              </ul>
              
              {/* Type DELETE to confirm section */}
              <div className="mt-4 border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Type DELETE in all caps"
                  autoComplete="off"
                />
                <div className="text-sm mt-1 text-gray-500">
                  This helps prevent accidental deletions
                </div>
              </div>
              
              <div className="flex gap-4 justify-end mt-6">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteAccount}
                  className={`px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDeleteEnabled 
                      ? 'bg-red-600 hover:bg-red-700 cursor-pointer' 
                      : 'bg-red-300 cursor-not-allowed'
                  }`}
                  disabled={!isDeleteEnabled}
                >
                  {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
