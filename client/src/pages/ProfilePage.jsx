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
      await api.post("/telegram-auth/logout");
      notify("Successfully logged out from Telegram", "success");
      setRedirect("/");
      setUser(null);
    } catch (error) {
      notify("Error logging out from Telegram. Please try again.", "error");
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
            {/* Display Telegram photo if available */}
            {user.telegramPhotoUrl && (
              <div className="flex justify-center mb-4">
                <img 
                  src={user.telegramPhotoUrl} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
              </div>
            )}
            <div className="text-3xl font-bold mb-1">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
            
            {/* Show Telegram username if available */}
            {user.telegramUsername && (
              <div className="text-sm text-gray-500 mt-1">
                Telegram: @{user.telegramUsername}
              </div>
            )}
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-lg mb-3">Account Information</h3>
            <div className="grid grid-cols-1 gap-3 text-left">
              <div>
                <span className="text-gray-600">Account Type:</span> 
                <span className="font-medium ml-2">
                  {user.userType === 'host' ? 
                    'Host (can create and manage conference rooms)' : 
                    'Client (can browse and book conference rooms)'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium ml-2">
                  {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}
                </span>
              </div>
              
              {/* Show Telegram connection status */}
              {user.telegramLinked !== undefined && (
                <div>
                  <span className="text-gray-600">Telegram Connected:</span>
                  <span className={`font-medium ml-2 ${user.telegramLinked ? 'text-green-600' : 'text-red-600'}`}>
                    {user.telegramLinked ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2 mt-6">
            {/* Show Telegram-specific logout button if the user is connected to Telegram */}
            {user.telegramLinked && (
              <button 
                onClick={logoutTelegram} 
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout from Telegram'}
              </button>
            )}
            
            <button 
              onClick={logout} 
              className="primary max-w-sm"
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
