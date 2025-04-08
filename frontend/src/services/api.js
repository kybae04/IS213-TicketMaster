import axios from 'axios';

// Use the URL that works directly in the browser
const API_URL = 'http://localhost:8000';

// We'll try both formats - with and without the Kong path prefix
const SHOULD_USE_KONG = false; // Set to false since direct calls to /events/ work
const API_PATH_PREFIX = SHOULD_USE_KONG ? '/ESDProject/rest/' : ''; 

// Debug log
console.log('API client initialized with URL:', API_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Disable sending cookies to avoid CORS preflight issues
});

// Add request interceptor for auth tokens if needed
apiClient.interceptors.request.use(
  config => {
    // Only add Kong prefix if we're using Kong
    if (SHOULD_USE_KONG && config.url && !config.url.startsWith(API_PATH_PREFIX)) {
      config.url = API_PATH_PREFIX + config.url.replace(/^\/+/, '');
    }
    
    // Remove any unsafe headers that might trigger CORS issues
    if (config.headers) {
      delete config.headers['Access-Control-Request-Method'];
      delete config.headers['X-HTTP-Method-Override'];
    }
    
    // Log every request for debugging
    console.log(`Making API request to: ${config.baseURL}${config.url} with method ${config.method}`);
    
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