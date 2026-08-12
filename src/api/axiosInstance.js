import axios from 'axios';
import { toast } from 'react-toastify';

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

// ✅ Global response handling:
// - 202 pending_approval: the workflow engine staged the action for approval
// - 401: session expired, back to login
// - 403 with required_permission: role permission denied by the server
api.interceptors.response.use(
  (response) => {
    if (response.status === 202 && response.data?.pending_approval) {
      toast.info(
        response.data.message ||
          'Submitted for approval. It will take effect once an approver confirms it.'
      );
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized — redirecting to login.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } else if (error.response?.status === 403 && error.response?.data?.required_permission) {
      toast.error(
        error.response.data.error ||
          'You do not have permission to perform this action.'
      );
    }
    return Promise.reject(error);
  }
);

export default api;
