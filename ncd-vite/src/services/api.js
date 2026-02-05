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
    // Always get the latest token from localStorage
    const currentToken = localStorage.getItem('authToken');
    this.token = currentToken;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    console.log('🔑 Using token:', this.token ? 'Present' : 'None');
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
    console.log('🔄 API Service: Attempting login for', username);
    console.log('🔄 API Service: Using URL', `${API_BASE_URL}/auth/login`);
    
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      console.log('✅ API Service: Login response received', response);
      
      if (response.access_token) {
        this.setToken(response.access_token);
        console.log('✅ API Service: Token set successfully');
      }
      
      return response;
    } catch (error) {
      console.error('❌ API Service: Login failed', error);
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
  async getPermissions() {
    console.log('🔄 API Service: Getting permissions...');
    const result = await this.request('/permissions/');
    console.log('✅ API Service: Permissions received:', Object.keys(result).length, 'roles');
    console.log('✅ API Service: Super Admin administrator:', result['Super Admin']?.['administrator']);
    return result;
  }

  async updatePermissions(permissionsData) {
    console.log('🔄 API Service: Updating permissions...', Object.keys(permissionsData));
    console.log('🔄 API Service: Full permissions data:', permissionsData);
    console.log('🔄 API Service: Token present:', this.token ? 'Yes' : 'No');
    console.log('🔄 API Service: Making PUT request to /permissions/');
    
    try {
      const result = await this.request('/permissions/', {
        method: 'PUT',
        body: JSON.stringify(permissionsData),
      });
      console.log('✅ API Service: Permissions updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service: Permission update failed:', error);
      console.error('❌ API Service: Error details:', {
        message: error.message,
        status: error.status,
        url: '/permissions/',
        method: 'PUT'
      });
      throw error;
    }
  }

  async getRolePermissions(role) {
    return await this.request(`/permissions/${encodeURIComponent(role)}`);
  }

  // Logout
  logout() {
    this.setToken(null);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;