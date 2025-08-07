import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

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

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('ess9ini_token');
        if (token) {
          // Verify token and get user data
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid token
        localStorage.removeItem('ess9ini_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      console.log('AuthContext: Attempting login for', email);
      const response = await authService.login(email, password);
      console.log('AuthContext: Login response received', response);

      // Store token
      if (response.data && response.data.token) {
        localStorage.setItem('ess9ini_token', response.data.token);
        console.log('AuthContext: Token stored');

        // Set user data
        setUser(response.data.user);
        console.log('AuthContext: User data set', response.data.user);
      } else {
        console.error('AuthContext: Invalid response format', response);
        throw new Error('Invalid response format from server');
      }

      return response;
    } catch (error) {
      console.error('AuthContext: Login error', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('AuthContext: Attempting registration for', userData.email);
      const response = await authService.register(userData);
      console.log('AuthContext: Registration response received', response);

      // Store token
      if (response.data && response.data.token) {
        localStorage.setItem('ess9ini_token', response.data.token);
        console.log('AuthContext: Token stored');

        // Set user data
        setUser(response.data.user);
        console.log('AuthContext: User data set', response.data.user);
      } else {
        console.error('AuthContext: Invalid response format', response);
        throw new Error('Invalid response format from server');
      }

      return response;
    } catch (error) {
      console.error('AuthContext: Registration error', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('ess9ini_token');
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user,
    isFarmer: user?.role === 'farmer',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
