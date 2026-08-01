import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/token';

const API_BASE = 'http://localhost:8000/University_system/v1';

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token
client.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      // Backend uses APIKeyHeader — raw token, no "Bearer" prefix
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with token refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest.url || '';

    // Don't intercept 401s from auth endpoints — let the UI handle them
    const isAuthEndpoint = requestUrl.includes('/auth/');
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, null, {
          params: { refresh_token: refreshToken },
        });

        saveTokens(data.access_token, data.refresh_token);
        originalRequest.headers['Authorization'] = data.access_token;
        return client(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
