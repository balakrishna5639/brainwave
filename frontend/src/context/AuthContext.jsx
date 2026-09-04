import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brainwave_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('brainwave_token') || null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');
  const [zohoStatus, setZohoStatus] = useState(null);

  // Fetch integration status and current profile on boot
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const [meRes, statusRes] = await Promise.all([
            api.get('/auth/me'),
            api.get('/zoho/status')
          ]);
          setUser(meRes.data.user);
          localStorage.setItem('brainwave_user', JSON.stringify(meRes.data.user));
          setZohoStatus(statusRes.data);
        } catch (err) {
          console.warn('[Auth] Token validation failed:', err);
          logout();
        }
      } else {
        // Still fetch public health / zoho status
        try {
          const res = await api.get('/health');
          setZohoStatus({
            mode: res.data.zohoMode,
            isLive: res.data.zohoMode === 'LIVE'
          });
        } catch (err) {
          // backend not yet reachable
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for session expiration events from API interceptor
    const handleExpired = (e) => {
      setUser(null);
      setToken(null);
      setSessionExpiredMessage(e.detail?.message || 'Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:session_expired', handleExpired);
    return () => window.removeEventListener('auth:session_expired', handleExpired);
  }, [token]);

  const login = async (email, password) => {
    setSessionExpiredMessage('');
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('brainwave_token', receivedToken);
    localStorage.setItem('brainwave_user', JSON.stringify(receivedUser));

    // Refresh Zoho status
    try {
      const statusRes = await api.get('/zoho/status', {
        headers: { Authorization: `Bearer ${receivedToken}` }
      });
      setZohoStatus(statusRes.data);
    } catch (e) {
      console.error('[Zoho Status Check Error]', e);
    }

    return receivedUser;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('brainwave_token');
      localStorage.removeItem('brainwave_user');
      setToken(null);
      setUser(null);
    }
  };

  const refreshZohoStatus = async () => {
    try {
      const res = await api.get('/zoho/status');
      setZohoStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        sessionExpiredMessage,
        setSessionExpiredMessage,
        zohoStatus,
        login,
        logout,
        refreshZohoStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
