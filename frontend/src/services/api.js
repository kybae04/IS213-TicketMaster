import axios from 'axios';

// In development with the proxy, we use relative URLs
// In production, we use the full API_URL
const isProduction = process.env.NODE_ENV === 'production';
const API_URL = isProduction ? (process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8000') : '';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth tokens if needed
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle errors (e.g., 401 unauthorized, etc.)
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;