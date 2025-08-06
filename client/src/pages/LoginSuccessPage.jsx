import { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../components/UserContext';
import { useNotification } from '../components/NotificationContext';
import api from '../utils/api';

export default function LoginSuccessPage() {
  const { t } = useTranslation('common');
  const { setUser, user } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isNewAccount, setIsNewAccount] = useState(false);
  const fetchAttempted = useRef(false);
  
  useEffect(() => {
    // Prevent multiple fetch attempts on rerender
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;
    
    // Check if this is a new account creation
    const params = new URLSearchParams(location.search);
    const newAccount = params.get('new_account') === 'true';
    setIsNewAccount(newAccount);
    
    // Check for token in URL parameters (from Telegram login)
    const token = params.get('token');
    
    // If token exists in URL, store it in localStorage
    if (token) {
      localStorage.setItem('token', token);
    }
    
    // Attempt to get user info with existing token (from cookie or localStorage)
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Make the API request
        const { data } = await api.get('/users/profile');
        
        if (data) {
          setUser(data);
          if (newAccount) {
            notify('messages.accountCreatedSuccess', 'success');
          } else {
            notify('messages.loginSuccessful', 'success');
          }
          setLoading(false);
          
          // Auto-redirect to account page after successful login
          // Small timeout to allow the success message to be seen
          setTimeout(() => {
            navigate('/account');
          }, 1500);
        } else {
          notify('messages.authenticationFailed', 'error');
          navigate('/login');
        }
      } catch (error) {
        notify('messages.authenticationFailed', 'error');
        navigate('/login');
      }
    };
    
    fetchUserData();
  }, []); // Remove location from dependencies to prevent infinite loop
  
  const handleContinue = () => {
    navigate('/account'); // Changed to redirect to account page instead of home
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading your account...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">
        {isNewAccount ? 'Account Created!' : 'Login Successful!'}
      </h1>
      
      {user && (
        <div className="flex flex-col items-center space-y-4 mb-6">
          {user.telegramPhotoUrl && (
            <img 
              src={user.telegramPhotoUrl} 
              alt={user.name} 
              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
            />
          )}
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            
            {user.telegramUsername && (
              <p className="text-sm text-gray-500 mt-1">
                Telegram: @{user.telegramUsername}
              </p>
            )}
          </div>
          
          {isNewAccount && (
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mt-4">
              <p>Your conference hub account has been created using your Telegram information.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col space-y-3 mt-6">
        <button
          onClick={handleContinue}
          className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition"
        >
          Go to Account
        </button>
        
        <Link 
          to="/" 
          className="text-center text-primary underline hover:text-primary-dark"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}