
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? '/api' : (import.meta.env.VITE_API_URL || 'https://usport-backend.onrender.com/api'),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // ✅ standard format
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ================= RESPONSE INTERCEPTOR =================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ✅ FIXED: removed TOKEN_EXPIRED dependency
    if (error.response?.status === 401 && !originalRequest._retry) {

      // ✅ DO NOT intercept 401 for auth routes (login, verify, register)
      const isAuthRoute = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/verify-otp') || 
                          originalRequest.url?.includes('/auth/register');
                          
      if (isAuthRoute) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      try {
        const baseURL = import.meta.env.MODE === 'development' ? '/api' : (import.meta.env.VITE_API_URL || 'https://usport-backend.onrender.com/api');
        const res = await axios.post(
          `${baseURL}/auth/refresh`, // ✅ direct call (avoid loop)
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        // ✅ update storage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // ✅ update default header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);

        localStorage.clear();
        window.location.href = '/'; // redirect to login

        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

