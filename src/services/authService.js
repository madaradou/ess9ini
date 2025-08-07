// Authentication service for Ess9ini backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('ess9ini_token');
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Generic fetch wrapper with error handling
  async fetchWithErrorHandling(url, options = {}) {
    try {
      console.log('AuthService: Making request to', url, 'with options:', options);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      console.log('AuthService: Response status:', response.status);

      const data = await response.json();
      console.log('AuthService: Response data:', data);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('ess9ini_token');
          throw new Error('Session expired. Please login again.');
        }

        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('AuthService: API request failed:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('NetworkError when attempting to fetch resource. Please check if the backend server is running.');
      }
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return response;
  }

  // Register new user
  async register(userData) {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response;
  }

  // Get current user data
  async getCurrentUser() {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/me`);
    return response.user;
  }

  // Logout user
  async logout() {
    try {
      await this.fetchWithErrorHandling(`${this.baseURL}/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      // Don't throw error for logout - we'll clear local storage anyway
      console.error('Logout API call failed:', error);
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    return response.user;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/password`, {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    return response;
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response;
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    });

    return response;
  }

  // Verify email
  async verifyEmail(token) {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/verify-email/${token}`);
    return response;
  }

  // Refresh token
  async refreshToken() {
    const response = await this.fetchWithErrorHandling(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
    });

    if (response.token) {
      localStorage.setItem('ess9ini_token', response.token);
    }

    return response;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic token validation (you might want to decode JWT and check expiry)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Get user role from token
  getUserRole() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (error) {
      return null;
    }
  }

  // Get user ID from token
  getUserId() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      return null;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
