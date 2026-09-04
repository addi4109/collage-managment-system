import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return 'http://localhost:5000/api';
    }
  }
  return 'https://collage-managment-system.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create configured Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required to send/receive httpOnly cookies for refresh token
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(true);

  // Configure Interceptors
  useEffect(() => {
    // 1. Request interceptor: attach token
    const reqInterceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Response interceptor: auto-refresh access token on 401
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // Attempt to hit the refresh endpoint
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
            const newToken = res.data.accessToken;
            
            // Save token
            localStorage.setItem('accessToken', newToken);
            setAccessToken(newToken);
            
            // Retry original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh token expired or invalid -> log out
            console.error('Refresh token failed. Logging out...');
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, [accessToken]);

  // Load user profile on startup
  useEffect(() => {
    const fetchMe = async () => {
      if (accessToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          // Token invalid/expired
          localStorage.removeItem('accessToken');
          setAccessToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [accessToken]);

  // Session Inactivity Auto-Logout Timer (60 minutes)
  useEffect(() => {
    let timeoutId;
    if (!accessToken) return;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn('Session ended due to inactivity.');
        logout();
      }, 60 * 60 * 1000); 
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [accessToken]);

  const login = async (credential, password, role, captchaToken, captchaValue) => {
    const res = await api.post('/auth/login', {
      credential,
      password,
      role,
      captchaToken,
      captchaValue,
    });
    
    const { accessToken: token, user: userData } = res.data;
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed');
    } finally {
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
