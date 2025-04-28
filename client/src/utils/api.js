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

export default api;