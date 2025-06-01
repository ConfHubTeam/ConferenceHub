import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";

export default function TelegramAuth() {
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('client');
  const [roleSelected, setRoleSelected] = useState(false);
  const { setUser } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for error parameters in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    
    if (error === 'not_registered') {
      setError('You need to register or link your Telegram account first.');
    } else if (error === 'server_error') {
      setError('An error occurred during authentication. Please try again.');
    } else if (error === 'expired_auth') {
      setError('Authentication expired. Please try again.');
    } else if (error === 'invalid_auth') {
      setError('Invalid authentication data. Please try again.');
    } else if (error === 'invalid_user_type') {
      setError('Invalid user type selected. Please choose either "client" or "host".');
    }
    
    // Check for stored Telegram auth error
    const telegramAuthError = localStorage.getItem('telegram_auth_error');
    if (telegramAuthError) {
      setError(telegramAuthError);
      notify(telegramAuthError, "error");
      localStorage.removeItem('telegram_auth_error');
    }
    
    // If there was a success, show notification and redirect
    if (params.get('login_success') || params.get('new_account')) {
      notify(params.get('new_account') 
        ? 'Successfully registered with Telegram' 
        : 'Successfully logged in with Telegram', 
        'success');
      navigate('/account');
    }
  }, [location, navigate, notify]);

  // Telegram Login Widget initialization
  useEffect(() => {
    if (!roleSelected) return; // Only initialize after role is selected
    
    // This script initializes the Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js';
    script.async = true;
    
    // Use the VITE_ prefixed environment variable and provide a fallback
    const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 
                               import.meta.env.VITE_TELEGRAM_BOT_NAME || 
                               'YourBotName';
    
    // Determine the correct callback URL based on current environment
    // This ensures it works across different domains (render, localhost)
    const currentHost = window.location.host;
    const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
    
    // Use a different approach - add the userType during server-side processing
    // We'll store the userType in localStorage and retrieve it during callback processing
    localStorage.setItem('telegram_auth_user_type', userType);
    
    // Keep the callback URL clean without the userType parameter
    const callbackPath = `/api/telegram-auth/callback`;
    const callbackUrl = `${apiBase}${callbackPath}`;
    
    // Set up the Telegram Login Widget                   
    script.setAttribute('data-telegram-login', telegramBotUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', callbackUrl);
    script.setAttribute('data-request-access', 'write');
    
    // Add the script to the widget container
    const widgetContainer = document.getElementById('telegram-login-widget');
    if (widgetContainer) {
      // Clear any existing widgets first
      while (widgetContainer.firstChild) {
        widgetContainer.removeChild(widgetContainer.firstChild);
      }
      widgetContainer.appendChild(script);
    }
    
    // Clean up function to remove the script when component unmounts
    return () => {
      const widgetContainer = document.getElementById('telegram-login-widget');
      if (widgetContainer) {
        while (widgetContainer.firstChild) {
          widgetContainer.removeChild(widgetContainer.firstChild);
        }
      }
    };
  }, [userType, roleSelected]);

  const handleRoleSelect = (role) => {
    setUserType(role);
    setRoleSelected(true);
  };

  const changeUserType = () => {
    setRoleSelected(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-center mb-2">Login with Telegram</h1>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col items-center space-y-4">
        {!roleSelected ? (
          <>
            <p className="text-gray-600 text-center mb-4">
              Please select your account type before continuing:
            </p>
            
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={() => handleRoleSelect('client')}
                className="w-full py-4 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center border-2 border-blue-500 hover:border-blue-600"
              >
                <div className="bg-white p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="font-medium text-lg block">Client</span>
                  <span className="text-sm text-blue-100">Find and book places to stay</span>
                </div>
              </button>
              
              <button
                onClick={() => handleRoleSelect('host')}
                className="w-full py-4 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 flex items-center border-2 border-green-500 hover:border-green-600"
              >
                <div className="bg-white p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="font-medium text-lg block">Host</span>
                  <span className="text-sm text-green-100">Rent out your property to guests</span>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`mb-4 p-4 rounded-lg border-2 flex items-center ${userType === 'client' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}`}>
              <div className={`p-2 rounded-full mr-3 ${userType === 'client' ? 'bg-blue-500' : 'bg-green-500'}`}>
                {userType === 'client' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${userType === 'client' ? 'text-blue-800' : 'text-green-800'}`}>
                  Selected: <span className="font-bold">{userType === 'client' ? 'Client' : 'Host'}</span>
                </p>
                <p className={`text-sm ${userType === 'client' ? 'text-blue-600' : 'text-green-600'}`}>
                  {userType === 'client' ? 'You will be able to book places to stay' : 'You will be able to list your properties'}
                </p>
              </div>
              <button 
                onClick={changeUserType}
                className={`text-sm py-1 px-3 rounded ${userType === 'client' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors`}
              >
                Change
              </button>
            </div>
            
            <p className="text-gray-600 text-center mb-4">
              Click the button below to authenticate with your Telegram account as a {userType === 'client' ? 'Client' : 'Host'}.
            </p>
            
            <div id="telegram-login-widget" className="mt-2 flex justify-center"></div>
          </>
        )}
      </div>
    </div>
  );
}