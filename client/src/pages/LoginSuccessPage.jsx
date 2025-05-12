import { useEffect, useContext, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserContext } from '../components/UserContext';
import { useNotification } from '../components/NotificationContext';
import api from '../utils/api';

export default function LoginSuccessPage() {
  const { setUser, user } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isNewAccount, setIsNewAccount] = useState(false);
  
  useEffect(() => {
    // Check if this is a new account creation
    const params = new URLSearchParams(location.search);
    const newAccount = params.get('new_account') === 'true';
    setIsNewAccount(newAccount);
    
    // Check for token in URL parameters (from Telegram login)
    const token = params.get('token');
    
    // If token exists in URL, store it in localStorage
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token saved from URL parameters');
    }
    
    // Attempt to get user info with existing token (from cookie or localStorage)
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Include token from localStorage in the request headers if available
        const headers = {};
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }
        
        const { data } = await api.get('/profile', { headers });
        
        if (data) {
          setUser(data);
          if (newAccount) {
            notify('Your conference hub account has been created successfully!', 'success');
          } else {
            notify('Login successful!', 'success');
          }
          setLoading(false);
        } else {
          notify('Authentication failed. Please try again.', 'error');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        notify('Authentication failed. Please try again.', 'error');
        navigate('/login');
      }
    };
    
    fetchUserData();
  }, [location, navigate, setUser, notify]);
  
  const handleContinue = () => {
    navigate('/');
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
          Continue to Conference Hub
        </button>
        
        <Link 
          to="/profile" 
          className="text-center text-primary underline hover:text-primary-dark"
        >
          Update Profile Information
        </Link>
      </div>
    </div>
  );
}