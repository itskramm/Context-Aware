/**
 * Base44 API Client
 * Axios-based wrapper around the backend API with caching
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
const getCacheKey = (url, params) => {
  return `${url}${params ? '?' + new URLSearchParams(params).toString() : ''}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

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
   * GET request with caching
   */
  async get(endpoint, params = {}, options = {}) {
    const { cache: useCache = true } = options;
    
    if (useCache) {
      const cacheKey = getCacheKey(endpoint, params);
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        console.log(`[Cache Hit] ${endpoint}`);
        return cachedData;
      }
    }
    
    const response = await this.axios.get(endpoint, { params });
    
    if (useCache) {
      const cacheKey = getCacheKey(endpoint, params);
      setCachedData(cacheKey, response);
    }
    
    return response;
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

  /**
   * Clear cache (useful after mutations)
   */
  clearCache(pattern) {
    if (pattern) {
      // Clear specific entries matching pattern
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      cache.clear();
    }
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
      return this.post('/auth/logout').catch(() => {});
    },
    forgotPassword: (email) => this.post('/auth/forgot-password', { email }),
    resetPassword: (data) => this.post('/auth/reset-password', data),
    changePassword: (currentPassword, newPassword) => 
      this.post('/auth/change-password', { currentPassword, newPassword }),
    verifyOtp: (data) => this.post('/auth/verify-otp', data),
    resendOtp: (email) => this.post('/auth/resend-otp', { email }),
    me: () => this.get('/auth/me', {}, { cache: false }),
    updateMe: (data) => this.patch('/auth/me', data),
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

  // Functions methods (cloud/edge functions)
  functions = {
    invoke: async (functionName, params) => {
      return this.post(`/functions/${functionName}`, params);
    },
  };

  // Legacy entities wrapper for backward compatibility
  entities = {
    Lecture: {
      list: async (sort = '-created_date', limit = 50) => {
        const response = await this.lectures.list({ sort, limit });
        return response.lectures || response;
      },
      filter: async (filters, sort = '-created_date', limit = 50) => {
        const params = { ...filters, sort, limit };
        const response = await this.lectures.list(params);
        return response.lectures || response;
      },
      get: async (id) => {
        return this.lectures.get(id);
      },
      create: (data) => this.lectures.create(data),
      update: (id, data) => this.lectures.update(id, data),
      delete: (id) => this.lectures.delete(id),
    },
    Digest: {
      list: async (sort = '-created_date', limit = 50) => {
        const response = await this.digests.list({ sort, limit });
        return response.digests || response;
      },
      filter: async (filters, sort = '-created_date', limit = 50) => {
        const params = { ...filters, sort, limit };
        const response = await this.digests.list(params);
        return response.digests || response;
      },
      get: async (id) => {
        return this.digests.get(id);
      },
      create: (data) => this.digests.create(data),
      update: (id, data) => this.digests.update(id, data),
      delete: (id) => this.digests.delete(id),
    },
    DigestSegment: {
      filter: async (filters, sort = 'start_time', limit = 100) => {
        const params = { ...filters, sort, limit };
        try {
          return this.get('/digest-segments', params);
        } catch (error) {
          console.warn('DigestSegment.filter not implemented:', error);
          return [];
        }
      },
      deleteMany: async (filters) => {
        try {
          return this.post('/digest-segments/delete-many', filters);
        } catch (error) {
          console.warn('DigestSegment.deleteMany not implemented:', error);
          return { deleted: 0 };
        }
      },
    },
    Transcript: {
      filter: async (filters, sort = 'timestamp', limit = 500) => {
        const params = { ...filters, sort, limit };
        try {
          const response = await axiosInstance.get('/transcripts', { params });
          return response || [];
        } catch (error) {
          console.warn('Transcript.filter error:', error);
          return [];
        }
      },
    },
    Topic: {
      filter: async (filters, sort = 'start_time', limit = 100) => {
        const params = { ...filters, sort, limit };
        try {
          const response = await axiosInstance.get('/topics', { params });
          return response || [];
        } catch (error) {
          console.warn('Topic.filter error:', error);
          return [];
        }
      },
    },
    UserInteraction: {
      create: async (data) => {
        try {
          return this.post('/interactions', data);
        } catch (error) {
          console.warn('UserInteraction.create not implemented:', error);
          return { success: false };
        }
      },
    },
  };
}

// Create and export a singleton instance
export const base44 = new Base44Client();

// Also export the class for testing or multiple instances
export default Base44Client;
