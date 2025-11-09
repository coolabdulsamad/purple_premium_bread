import axios from 'axios';

// Set your backend base URL
const API_BASE_URL = 'https://purple-premium-bread-backend.onrender.com/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Automatically attach JWT token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or from context if preferred
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Automatically handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized — redirecting to login.');
      localStorage.removeItem('token');
      // Optional: redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
