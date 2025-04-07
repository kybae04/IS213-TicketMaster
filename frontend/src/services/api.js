import axios from 'axios';

// Use relative URLs to leverage the proxy in package.json
const API_URL = '';  // Empty means use relative URLs which will be proxied

// Debug log
console.log('API client initialized to use proxy through React dev server');

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable cookies for proxied requests
});

// Add request interceptor for auth tokens if needed
apiClient.interceptors.request.use(
  config => {
    // Log every request for debugging
    console.log(`Making API request to: ${config.url} with method ${config.method}`);
    
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
  response => {
    console.log(`API response from ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    // Handle errors (e.g., 401 unauthorized, etc.)
    console.error('API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;