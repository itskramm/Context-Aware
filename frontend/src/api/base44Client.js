/**
 * Base44 API Client
 * Axios-based wrapper around the backend API
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('base44_access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      status: error.response?.status || 0,
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed',
      data: error.response?.data || null,
    };
    return Promise.reject(customError);
  }
);

class Base44Client {
  constructor() {
    this.axios = axiosInstance;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('base44_access_token');
    }
  }

  /**
   * Get authentication token
   */
  getToken() {
    return localStorage.getItem('auth_token') || 
           localStorage.getItem('token') || 
           localStorage.getItem('base44_access_token');
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    return this.axios.get(endpoint, { params });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.axios.post(endpoint, data);
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.axios.put(endpoint, data);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    return this.axios.patch(endpoint, data);
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.axios.delete(endpoint);
  }

  // Authentication methods
  auth = {
    login: async (credentials) => {
      const response = await this.post('/auth/login', credentials);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    },
    loginViaEmailPassword: async (email, password) => {
      const response = await this.auth.login({ email, password });
      return response;
    },
    register: async (userData) => {
      const response = await this.post('/auth/register', userData);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    },
    logout: () => {
      this.setToken(null);
      return this.post('/auth/logout');
    },
    forgotPassword: (email) => this.post('/auth/forgot-password', { email }),
    resetPassword: (data) => this.post('/auth/reset-password', data),
    verifyOtp: (data) => this.post('/auth/verify-otp', data),
    me: () => this.get('/auth/me'),
  };

  // Users methods
  users = {
    list: (params) => this.get('/users', params),
    get: (id) => this.get(`/users/${id}`),
    create: (userData) => this.post('/users', userData),
    update: (id, userData) => this.put(`/users/${id}`, userData),
    delete: (id) => this.delete(`/users/${id}`),
  };

  // Lectures methods
  lectures = {
    list: (params) => this.get('/lectures', params),
    get: (id) => this.get(`/lectures/${id}`),
    create: (lectureData) => this.post('/lectures', lectureData),
    update: (id, lectureData) => this.put(`/lectures/${id}`, lectureData),
    delete: (id) => this.delete(`/lectures/${id}`),
    transcript: (id) => this.get(`/lectures/${id}/transcript`),
    upload: (formData) => {
      return this.axios.post('/lectures/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  };

  // Digests methods
  digests = {
    list: (params) => this.get('/digests', params),
    get: (id) => this.get(`/digests/${id}`),
    create: (digestData) => this.post('/digests', digestData),
    update: (id, digestData) => this.put(`/digests/${id}`, digestData),
    delete: (id) => this.delete(`/digests/${id}`),
    generate: (params) => this.post('/digests/generate', params),
  };

  // Chat methods (for digest chat/tutor)
  chat = {
    send: (message, context) => this.post('/chat/message', { message, context }),
    history: (sessionId) => this.get(`/chat/history/${sessionId}`),
  };

  // Settings methods
  settings = {
    get: () => this.get('/settings'),
    update: (settings) => this.put('/settings', settings),
    public: () => this.get('/settings/public'),
  };

  // Analytics methods
  analytics = {
    dashboard: () => this.get('/analytics/dashboard'),
    activity: (params) => this.get('/analytics/activity', params),
  };
}

// Create and export a singleton instance
export const base44 = new Base44Client();

// Also export the class for testing or multiple instances
export default Base44Client;
