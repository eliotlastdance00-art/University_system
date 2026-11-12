import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/token';

// Use the Vite proxy (/University_system/v1 → http://127.0.0.1:8000/University_system/v1) so that
// requests from any network client are forwarded server-side by Vite.
// Override with VITE_API_URL in .env.local for production builds.
const API_BASE = import.meta.env.VITE_API_URL || '/University_system/v1';

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

// ─── Single-flight refresh state ───────────────────────────
// Refresh token rotates on every use (backend deletes the old row).
// If 3 requests 401 at once, each must NOT call /auth/refresh separately —
// the first call wins, the token gets rotated, and the other 2 would send
// an already-deleted (stale) refresh_token → RefreshTokenNotFoundError.
// So: only ONE refresh call runs at a time; everyone else queues and
// reuses its result.
let isRefreshing = false;
let waitQueue = []; // { resolve, reject } for requests waiting on the in-flight refresh

function processQueue(error, newAccessToken = null) {
  waitQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  waitQueue = [];
}

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

      // A refresh is already in flight — queue this request instead of
      // firing a second /auth/refresh call with the same (soon-to-be-stale) token.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            originalRequest.headers['Authorization'] = newAccessToken;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

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
        processQueue(null, data.access_token);

        originalRequest.headers['Authorization'] = data.access_token;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;