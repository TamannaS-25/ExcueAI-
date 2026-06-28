import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Configure Axios default headers
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const checkUserSession = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Session validation failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login/json`, {
        email,
        password,
      });
      const data = response.data;
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      setUser({
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
      });
      return { success: true, role: data.role };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isManager = user?.role === 'Manager';
  const isEmployee = user?.role === 'Employee';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isManager,
        isEmployee,
        isAuthenticated,
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
