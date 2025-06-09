import { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { Navigate, useParams, useLocation } from "react-router-dom";
import api from "../utils/api";
import AccountNav from "../components/AccountNav";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

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
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onDelete={deleteAccount}
          title="Delete Account"
          itemToDelete={user}
          itemDetails={[
            { label: "Name", value: user?.telegramLinked && user?.telegramFirstName ? user?.telegramFirstName : user?.name },
            { label: "Email", value: user?.email && !user?.email.includes("telegram_") ? user?.email : "No email provided" },
            { label: "Account", value: user?.userType === 'host' ? 'Host Account' : 'Client Account' }
          ]}
          consequences={[
            "Your account and profile information",
            "All of your bookings",
            ...(user?.userType === 'host' ? [
              "All conference rooms you own",
              "All bookings associated with your rooms"
            ] : [])
          ]}
          deleteInProgress={isDeleting}
        />
      </div>
    </div>
  );
}
