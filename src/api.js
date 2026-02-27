import axios from 'axios';

// baseURL is relative so that proxy (Vite) or same host in production
const api = axios.create({
  baseURL: '/api',
});

// attach token when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
