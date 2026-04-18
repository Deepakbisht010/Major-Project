import axios from 'axios';

// Create an Axios instance with base configuration
let baseUrl = import.meta.env.VITE_API_URL || 'https://epay-backend-lfz1.onrender.com/api/';

// Ensure it ends with /api/
if (!baseUrl.endsWith('/api/')) {
  if (baseUrl.endsWith('/')) {
    baseUrl += 'api/';
  } else {
    baseUrl += '/api/';
  }
}

const api = axios.create({
  baseURL: baseUrl,
  timeout: 60000, // 60 seconds timeout (increased for AI and Render cold start)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('etaxpay-user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Log for debugging (requested in Step 6)
      if (user.token) {
        console.log(`[API Request] Calling ${config.url} with token: ${user.token.substring(0, 10)}...`);
        config.headers.Authorization = `Bearer ${user.token}`;
      } else {
        console.warn(`[API Request] Calling ${config.url} but NO token found in user object.`);
      }
    } catch (e) {
      console.error('Failed to parse user from local storage');
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server returned an error (4xx, 5xx)
      console.error(`[API Response Error] ${error.config.url} returned ${error.response.status}:`, error.response.data);

      if (error.response.status === 401) {
        console.error('[API Response] 401 Unauthorized detected. Redirecting to login...');
        localStorage.removeItem('etaxpay-user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('[API Network Error] No response received from server. Check if backend is running at:', baseUrl);
    } else {
      // Something happened in setting up the request
      console.error('[API Setup Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
