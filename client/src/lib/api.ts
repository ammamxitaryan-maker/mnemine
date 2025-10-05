import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';

const baseURL = `${backendUrl}/api`;
// console.log(`[API] Initializing with baseURL: ${baseURL}`); // Removed log

export const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth tokens
api.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;
  
  // Add Telegram initData if available
  if (tg?.initData) {
    console.log('[CLIENT_API] Adding Telegram initData to request');
    config.headers['x-telegram-init-data'] = tg.initData;
  } else {
    // Try to get initData from localStorage (fallback mode)
    const storedInitData = localStorage.getItem('telegram_init_data');
    if (storedInitData) {
      console.log('[CLIENT_API] Using stored Telegram initData');
      config.headers['x-telegram-init-data'] = storedInitData;
    } else {
      console.log('[CLIENT_API] No Telegram data available, proceeding without it');
    }
  }

  // Add admin token for admin routes
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken && config.url?.includes('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url?.includes('/admin')) {
      // Clear admin token on 401
      localStorage.removeItem('admin_token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/admin-login')) {
        window.location.href = '/admin-login';
      }
    }
    return Promise.reject(error);
  }
);