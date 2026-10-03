import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('lostlink_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('lostlink_token');
      const storedUser = localStorage.getItem('lostlink_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse cached user:', e);
          }
        }

        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('lostlink_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session verification error, using cached credentials if valid:', err.message);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data.data;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('lostlink_token', receivedToken);
      localStorage.setItem('lostlink_user', JSON.stringify(receivedUser));

      return { success: true, user: receivedUser };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token: receivedToken, user: receivedUser } = res.data.data;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('lostlink_token', receivedToken);
      localStorage.setItem('lostlink_user', JSON.stringify(receivedUser));

      return { success: true, user: receivedUser };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message: msg };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      const updated = res.data.data;
      setUser(updated);
      localStorage.setItem('lostlink_user', JSON.stringify(updated));
      return { success: true, user: updated };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Profile update failed';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lostlink_token');
    localStorage.removeItem('lostlink_user');
  };

  // Quick Demo Login helper for instant FYP demo
  const quickDemoLogin = async (role = 'student') => {
    if (role === 'admin') {
      return await login('admin@lostlink.ai', 'admin123');
    }
    return await login('john@lostlink.ai', 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        login,
        register,
        updateProfile,
        logout,
        quickDemoLogin
      }}
    >
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
