import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, setAuthToken, clearAuth } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          await authAPI.verifyToken();
          setUser(JSON.parse(savedUser));
          setAuthToken(token);
        } catch (err) {
          // Token is invalid
          clearAuth();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { token, data } = response.data;

      // Store token and user data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(data));
      setAuthToken(token);
      setUser(data);

      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      const { token, data } = response.data;

      // Store token and user data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(data));
      setAuthToken(token);
      setUser(data);

      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
