import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";

export default function TelegramAuth() {
  const [error, setError] = useState('');
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
    }
  }, [location]);

  // Telegram Login Widget initialization
  useEffect(() => {
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
    const callbackPath = '/api/telegram-auth/callback';
    const callbackUrl = `${apiBase}${callbackPath}`;
    
    // Set up the Telegram Login Widget                   
    script.setAttribute('data-telegram-login', telegramBotUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', callbackUrl);
    script.setAttribute('data-request-access', 'write');
    
    // Add the script to the widget container
    const widgetContainer = document.getElementById('telegram-login-widget');
    if (widgetContainer) {
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
  }, []);

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Login with Telegram</h1>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col items-center space-y-4">
        <p className="text-gray-600 text-center">
          Click the button below to authenticate with your Telegram account.
        </p>
        
        <div id="telegram-login-widget" className="mt-4"></div>
      </div>
    </div>
  );
}