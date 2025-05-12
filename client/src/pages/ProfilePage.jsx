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
      await api.post("/logout");
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
      await api.post("/logout");
      notify("Successfully logged out", "success");
      setRedirect("/");
      setUser(null);
    } catch (error) {
      notify("Error logging out. Please try again.", "error");
      setIsLoggingOut(false);
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

          <div className="flex flex-col items-center space-y-2 mt-6">
            {/* Single logout button that handles both regular and Telegram logout */}
            <button 
              onClick={user.telegramLinked ? logoutTelegram : logout} 
              className="primary w-full max-w-xs mx-auto"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
