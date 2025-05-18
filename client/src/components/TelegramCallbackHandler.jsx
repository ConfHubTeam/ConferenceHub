import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "./UserContext";

export default function TelegramCallbackHandler() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    async function processCallback() {
      try {
        // Get all query parameters from the URL
        const params = new URLSearchParams(location.search);
        
        // Get saved user type from localStorage
        const userType = localStorage.getItem('telegram_auth_user_type') || 'client';
        
        // Create a data object with all the Telegram data from the URL
        const telegramData = {};
        for (const [key, value] of params.entries()) {
          telegramData[key] = value;
        }
        
        // Add the userType
        telegramData.userType = userType;
        
        // Send the data to the server with a POST request so that we don't alter the hash
        const response = await axios.post('/api/telegram-auth/complete-login', telegramData);
        
        // Check the response
        if (response.data.ok) {
          // Successful login/registration
          localStorage.removeItem('telegram_auth_user_type'); // Clean up
          
          // Save the token to localStorage
          localStorage.setItem('token', response.data.token);
          
          // Update the user context
          setUser(response.data.user);
          
          // Redirect to account page with success message
          if (response.data.isNewUser) {
            navigate('/account?new_account=true');
          } else {
            navigate('/account?login_success=true');
          }
        } else {
          setError(response.data.error || "Authentication failed");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error processing Telegram callback:", err);
        
        // Check if it's a user type mismatch error
        if (err.response && err.response.data && err.response.data.error) {
          const errorMessage = err.response.data.error;
          
          // Check if the error is a user type mismatch
          if (errorMessage.includes('Account with this Telegram ID already exists as')) {
            // Extract the user types from the error message
            const match = errorMessage.match(/exists as (\w+) type. Cannot change to (\w+)./);
            if (match && match.length >= 3) {
              const existingType = match[1];
              const attemptedType = match[2];
              
              // Redirect to login with specific error
              navigate(`/login?error=user_type_mismatch&existing_type=${existingType}&attempted_type=${attemptedType}`);
              return;
            }
          }
          
          setError(errorMessage);
        } else {
          setError("Failed to complete authentication. Please try again.");
        }
        
        setLoading(false);
      }
    }

    // Only process if we have auth data in the URL
    if (location.search.includes('id=') && location.search.includes('hash=')) {
      processCallback();
    } else {
      // No auth data, redirect to login
      navigate('/login');
    }
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Completing Authentication</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">
          Please wait while we complete your Telegram authentication...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Authentication Error</h1>
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
          {error}
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
