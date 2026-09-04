import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brainwave_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const code = error.response.data?.code;
      if (code === 'TOKEN_EXPIRED' || code === 'AUTH_TOKEN_MISSING' || code === 'INVALID_TOKEN') {
        localStorage.removeItem('brainwave_token');
        localStorage.removeItem('brainwave_user');
        window.dispatchEvent(new CustomEvent('auth:session_expired', {
          detail: { message: error.response.data.message || 'Session expired. Please log in again.' }
        }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
