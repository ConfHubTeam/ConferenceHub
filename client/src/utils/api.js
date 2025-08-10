import axios from 'axios';
import i18n from '../i18n/config';

// Determine the base URL based on the environment
let baseURL = '';

// Add /api prefix properly for both development and production environments
if (import.meta.env.PROD) {
  // In production (on Render), API is available at /api path
  baseURL = '/api';
} else {
  // In development, add /api prefix to the base URL
  const devBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  baseURL = `${devBaseUrl}/api`;
}

// Create an Axios instance with default settings
const api = axios.create({
  baseURL,
  withCredentials: true, // To handle cookies for authentication
});

// Add request interceptor to inject the token and language into all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add current language to the request headers
    const currentLanguage = i18n.language || 'en';
    config.headers['Accept-Language'] = currentLanguage;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors and extract tokens
api.interceptors.response.use(
  (response) => {
    // Check if response contains a new token cookie and sync to localStorage
    if (response.config.url?.includes('/auth/login') && response.data?.id) {
      // For login responses, check if we have a token in cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        localStorage.setItem('token', token);
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear it
      localStorage.removeItem('token');
      // Don't automatically redirect to login, let components handle it
      console.warn('Authentication token expired or invalid');
    }
    return Promise.reject(error);
  }
);

export default api;

// Utility function to get password requirements
export const getPasswordRequirements = async () => {
  try {
    const response = await api.get('/auth/password-requirements');
    return response.data;
  } catch (error) {
    console.error('Error fetching password requirements:', error);
    // Fallback to default requirements if the API fails
    return {
      minLength: 8,
      requiresUppercase: true,
      requiresLowercase: true,
      requiresNumber: true,
      requiresSpecialChar: true,
      allowedSpecialChars: "@$!%*?&",
      regex: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
    };
  }
};

// Utility function to update password
export const updatePassword = async (newPassword) => {
  try {
    const response = await api.put('/users/password', {
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Host review reply functions - US-R007 implementation
export const createReviewReply = async (reviewId, replyText) => {
  try {
    const response = await api.post(`/reviews/${reviewId}/reply`, {
      replyText
    });
    return response.data;
  } catch (error) {
    console.error('Error creating review reply:', error);
    throw error;
  }
};

export const updateReviewReply = async (reviewId, replyText) => {
  try {
    const response = await api.put(`/reviews/${reviewId}/reply`, {
      replyText
    });
    return response.data;
  } catch (error) {
    console.error('Error updating review reply:', error);
    throw error;
  }
};