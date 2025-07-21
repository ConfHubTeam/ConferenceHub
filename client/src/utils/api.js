import axios from 'axios';

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

// Add request interceptor to inject the token from localStorage into all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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