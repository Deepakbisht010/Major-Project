import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
      // Assuming you store the Supabase session token inside your user object
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch(e) {
      console.error('Failed to parse user from local storage');
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
