// API Service for NCD Management System
const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log('🔄 API Request:', url, config);

    try {
      const response = await fetch(url, config);
      console.log('📡 API Response status:', response.status, response.statusText);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.setToken(null);
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error response:', errorData);
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response data:', data);
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(username, password) {
    try {
      // Don't use this.request() for login as it adds auth headers
      const url = `${API_BASE_URL}/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        this.setToken(data.access_token);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async verifyToken() {
    return await this.request('/auth/verify-token', { method: 'POST' });
  }

  // User management endpoints
  async getUsers() {
    return await this.request('/users/');
  }

  async createUser(userData) {
    return await this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return await this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return await this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Permissions endpoints
  async getPermissions() {
    console.log('🔄 API Service: Getting permissions from backend...');
    return await this.request('/permissions/');
  }

  async updatePermissions(permissionsData) {
    console.log('🚨 CRITICAL DEBUG: API Service updatePermissions called!');
    console.log('🚨 CRITICAL DEBUG: This should appear in Network tab as PUT /permissions/');
    return await this.request('/permissions/', {
      method: 'PUT',
      body: JSON.stringify(permissionsData),
    });
  }

  // Audit log endpoints
  async getAuditLogs(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const endpoint = `/audit/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async createAuditLog(auditData) {
    return await this.request('/audit/', {
      method: 'POST',
      body: JSON.stringify(auditData),
    });
  }

  async getAuditLogsCount(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    
    const endpoint = `/audit/count${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  // Permissions endpoints
  async updatePermissions(permissionsData) {
    return await this.request('/permissions/', {
      method: 'PUT',
      body: JSON.stringify(permissionsData),
    });
  }

  async getPermissions() {
    return await this.request('/permissions/');
  }

  async getRolePermissions(roleName) {
    return await this.request(`/permissions/${roleName}`);
  }

  async syncPermissions(permissionsData) {
    return await this.request('/permissions/sync', {
      method: 'POST',
      body: JSON.stringify(permissionsData),
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }

  // Logout
  logout() {
    this.setToken(null);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;