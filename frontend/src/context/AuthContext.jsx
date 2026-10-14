import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const extractError = (error, fallback) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.status === 404) {
    return 'Authentication service not reachable (404). Please verify backend connection.';
  }
  return error.message || fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('skillsync_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('skillsync_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Set auth token in Axios headers
  const setAuthHeader = (authToken) => {
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Verify session on initial mount
  useEffect(() => {
    const verifyUserSession = async () => {
      if (token) {
        setAuthHeader(token);
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/me`);
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('skillsync_user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.error('[AuthContext] Session verification failed:', error.response?.data?.message || error.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUserSession();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('skillsync_token', newToken);
        localStorage.setItem('skillsync_user', JSON.stringify(userData));
        setAuthHeader(newToken);
        return { success: true, user: userData };
      }
    } catch (error) {
      const msg = extractError(error, 'Login failed. Please check credentials.');
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Register handler (Student or Recruiter)
  const register = async ({ fullName, email, password, confirmPassword, role }) => {
    setAuthError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        fullName,
        email,
        password,
        confirmPassword,
        role
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('skillsync_token', newToken);
        localStorage.setItem('skillsync_user', JSON.stringify(userData));
        setAuthHeader(newToken);
        return { success: true, user: userData };
      }
    } catch (error) {
      const msg = extractError(error, 'Registration failed. Please check your details.');
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('skillsync_token');
    localStorage.removeItem('skillsync_user');
    setAuthHeader(null);
  };

  // Forgot password request
  const forgotPassword = async (email) => {
    setAuthError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      return { success: true, data: response.data };
    } catch (error) {
      const msg = extractError(error, 'Failed to request password reset.');
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Reset password submit
  const resetPassword = async (resetToken, password, confirmPassword) => {
    setAuthError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        resetToken,
        password,
        confirmPassword
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('skillsync_token', newToken);
        localStorage.setItem('skillsync_user', JSON.stringify(userData));
        setAuthHeader(newToken);
        return { success: true, user: userData };
      }
    } catch (error) {
      const msg = extractError(error, 'Failed to reset password.');
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        setAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
