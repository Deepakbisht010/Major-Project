import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
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
    if (error.response && error.response.status === 401) {
      console.error('[API Response] 401 Unauthorized detected. Redirecting to login...');
      // Clear expired token/session
      localStorage.removeItem('etaxpay-user');
      // Redirect to login (avoiding crash as requested)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
