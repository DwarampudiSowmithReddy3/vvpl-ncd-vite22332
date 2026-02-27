// API Service for NCD Management System
import encryptionService from './encryptionService';

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
    
    // CRITICAL FIX: Always read token fresh from localStorage to ensure we have the latest token
    const currentToken = localStorage.getItem('authToken') || this.token;
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
      // Update instance token if it's different
      if (this.token !== currentToken) {
        this.token = currentToken;
      }
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // CRITICAL FIX: Always get fresh headers to ensure latest token
    // BUT: Don't set Content-Type for FormData (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;
    
    // Always start with auth headers
    const baseHeaders = this.getHeaders();
    
    const config = {
      ...options,
      headers: {
        ...baseHeaders,
        ...options.headers
      }
    };
    
    // Remove Content-Type for FormData (browser will set it with boundary)
    if (isFormData && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }

    // SECURITY: Only log in development mode
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) { console.log('🔄 API Request:', url); }
      if (import.meta.env.DEV) {

        if (import.meta.env.DEV) { console.log('🔑 Auth token present:', !!this.token || !!localStorage.getItem('authToken')); }

      }
    }

    try {
      const response = await fetch(url, config);
      
      // SECURITY: Only log in development mode
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) { console.log('📡 API Response status:', response.status, response.statusText); }
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        // SECURITY: Don't log token details in production
        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) { console.error('❌ 401 Unauthorized - Token might be expired or invalid'); }
        }
        
        this.setToken(null);
        
        // Redirect to login page
        window.location.href = '/login';
        
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // SECURITY: Only log error details in development
        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) { console.error('❌ API Error response:', errorData); }
        }
        
        // Better error message formatting
        let errorMessage = `HTTP ${response.status}`;
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Validation errors from FastAPI
            errorMessage = errorData.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // SECURITY: Only log response data in development mode
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log('✅ API Response data (raw):', data); }

        }
      }
      
      // Decrypt response if encrypted (async operation)
      try {
        const processedData = await encryptionService.processResponse(data);
        
        // SECURITY: Only log in development mode
        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) {

            if (import.meta.env.DEV) { console.log('✅ API Response data (processed):', processedData); }

          }
        }
        
        return processedData;
      } catch (decryptError) {
        // SECURITY: Only log in development mode
        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) { console.error('❌ Decryption error:', decryptError); }
          if (import.meta.env.DEV) { console.warn('⚠️ Returning raw data due to decryption failure'); }
        }
        return data;
      }
    } catch (error) {
      // SECURITY: Only log in development mode
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.error(`❌ API Error (${endpoint}):`, error); }

        }
      }
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
      
      // Decrypt response if encrypted (async operation)
      const processedData = await encryptionService.processResponse(data);
      
      if (processedData.access_token) {
        this.setToken(processedData.access_token);
      }
      
      return processedData;
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Login failed:', error.message); }
      throw error;
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async verifyToken() {
    return await this.request('/auth/verify-token', { method: 'POST' });
  }

  async logout() {
    try {
      const response = await this.request('/auth/logout', { method: 'POST' });
      // Clear token after successful logout
      this.clearToken();
      return response;
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Logout failed:', error.message); }
      // Clear token even if logout fails
      this.clearToken();
      throw error;
    }
  }

  async trackActivity() {
    try {
      // Don't track if no token
      const token = localStorage.getItem('authToken') || this.token;
      if (!token) return;

      // Use regular fetch with keepalive instead of sendBeacon
      // sendBeacon doesn't support Authorization headers properly
      try {
        await fetch(`${API_BASE_URL}/auth/track-activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({}),
          keepalive: true // This ensures the request completes even if page is closing
        });
      } catch (fetchError) {
        // Silently fail - this is called during page unload
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log('Activity tracking request sent (may complete after page unload)'); }

        }
      }
    } catch (error) {
      // Don't throw error as this is called during page unload
      if (import.meta.env.DEV) { console.log('Activity tracking attempted'); }
    }
  }

  // User management endpoints
  async getUsers(search = null, limit = null) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/users/?${queryString}` : '/users/';
    
    return await this.request(endpoint);
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
    if (import.meta.env.DEV) { console.log('🔄 API Service: Getting permissions from backend...'); }
    return await this.request('/permissions/');
  }

  async updatePermissions(permissionsData) {
    if (import.meta.env.DEV) { console.log('🚨 CRITICAL DEBUG: API Service updatePermissions called!'); }
    if (import.meta.env.DEV) { console.log('🚨 CRITICAL DEBUG: This should appear in Network tab as PUT /permissions/'); }
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

  // ============================================
  // SERIES ENDPOINTS
  // ============================================
  
  async getSeries(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    const endpoint = `/series${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getSeriesById(seriesId) {
    return await this.request(`/series/${seriesId}`);
  }

  async createSeries(seriesData) {
    return await this.request('/series', {
      method: 'POST',
      body: JSON.stringify(seriesData),
    });
  }

  async updateSeries(seriesId, seriesData) {
    return await this.request(`/series/${seriesId}`, {
      method: 'PUT',
      body: JSON.stringify(seriesData),
    });
  }

  async deleteSeries(seriesId) {
    return await this.request(`/series/${seriesId}`, {
      method: 'DELETE',
    });
  }

  async approveSeries(seriesId, approvalData) {
    return await this.request(`/series/${seriesId}/approve`, {
      method: 'POST',
      body: JSON.stringify(approvalData),
    });
  }

  async rejectSeries(seriesId, rejectionData) {
    return await this.request(`/series/${seriesId}/reject`, {
      method: 'POST',
      body: JSON.stringify(rejectionData),
    });
  }

  async getSeriesDocuments(seriesId) {
    return await this.request(`/series/${seriesId}/documents`);
  }

  async uploadSeriesDocument(seriesId, documentType, file) {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/series/${seriesId}/documents/upload`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    };
    
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async uploadSeriesDocuments(seriesId, termSheet, offerDocument, boardResolution) {
    const formData = new FormData();
    
    // Append all 3 required documents
    if (termSheet) {
      formData.append('term_sheet', termSheet);
    }
    if (offerDocument) {
      formData.append('offer_document', offerDocument);
    }
    if (boardResolution) {
      formData.append('board_resolution', boardResolution);
    }
    
    const url = `${API_BASE_URL}/series/${seriesId}/documents/upload`;
    
    // Get fresh token
    const currentToken = localStorage.getItem('authToken') || this.token;
    
    const config = {
      method: 'POST',
      headers: {
        'Authorization': currentToken ? `Bearer ${currentToken}` : '',
      },
      body: formData,
    };
    
    if (import.meta.env.DEV) { console.log('📤 Uploading 3 documents to:', url); }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (import.meta.env.DEV) { console.error('❌ Document upload failed:', errorData); }
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    if (import.meta.env.DEV) { console.log('✅ Documents uploaded successfully:', result); }
    return result;
  }

  async getPendingApprovals() {
    return await this.request('/series/pending-approvals');
  }

  async getApprovalHistory(seriesId) {
    return await this.request(`/series/${seriesId}/approval-history`);
  }

  async getSeriesByCategory() {
    return await this.request('/series/by-category');
  }

  async getSeriesEnhanced(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    const endpoint = `/series/enhanced${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getSeriesInvestors(seriesId) {
    return await this.request(`/series/${seriesId}/investors`);
  }

  // Get series display data with formatted dates (ALL LOGIC IN BACKEND)
  async getSeriesDisplayData(seriesId) {
    return await this.request(`/series/${seriesId}/display-data`);
  }

  // Get series insights with ALL calculations (ALL LOGIC IN BACKEND)
  async getSeriesInsights(seriesId) {
    return await this.request(`/series/${seriesId}/insights`);
  }

  // Get upcoming payouts for a specific series (ALL LOGIC IN BACKEND)
  async getSeriesUpcomingPayouts(seriesId) {
    return await this.request(`/series/${seriesId}/upcoming-payouts`);
  }

  // Get recent payout history for a specific series (ALL LOGIC IN BACKEND)
  async getSeriesRecentPayouts(seriesId, limit = 10) {
    return await this.request(`/series/${seriesId}/recent-payouts?limit=${limit}`);
  }

  // ============================================
  // COMMUNICATION ENDPOINTS - SIMPLIFIED
  // ALL LOGIC IN BACKEND
  // ============================================

  // Get templates from database
  async getCommunicationTemplates(type = null) {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    const url = `/communication/templates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  // Get series for communication
  async getSeriesForCommunication(search = null, statusFilter = null) {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (statusFilter && statusFilter !== 'all') queryParams.append('status_filter', statusFilter);
    const url = `/communication/series${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  // Send messages - ALL LOGIC IN BACKEND
  async sendCommunicationMessages(messageData) {
    return await this.request('/communication/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Get communication history
  async getCommunicationHistory(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    const endpoint = `/communication/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  // Get communication statistics
  async getCommunicationHistoryStats() {
    return await this.request('/communication/history/stats');
  }

  async getCommunicationTemplates(type = null) {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    
    const endpoint = `/communication/templates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  // ============================================
  // OLD COMMUNICATION ENDPOINTS (DEPRECATED - Keep for backward compatibility)
  // ============================================

  async getSeriesWithInvestors(search = null, statusFilter = null) {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (statusFilter && statusFilter !== 'all') queryParams.append('status_filter', statusFilter);
    const url = `/communication/series-with-investors${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getInvestorsForCommunication(seriesId) {
    return await this.request(`/communication/series/${seriesId}/investors-for-communication`);
  }

  async searchInvestorsForCommunication(search) {
    return await this.request(`/communication/search-investors?search=${encodeURIComponent(search)}`);
  }

  async sendBulkMessages(messageData) {
    return await this.request('/communication/send-messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // ============================================
  // GRIEVANCE ENDPOINTS
  // ============================================

  async getGrievances(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.grievance_type) queryParams.append('grievance_type', params.grievance_type);
    if (params.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params.category) queryParams.append('category', params.category);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.series_id) queryParams.append('series_id', params.series_id);
    if (params.investor_id) queryParams.append('investor_id', params.investor_id);
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    if (params.search) queryParams.append('search', params.search);
    
    const endpoint = `/grievances${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getGrievance(grievanceId) {
    return await this.request(`/grievances/${grievanceId}`);
  }

  async createGrievance(grievanceData) {
    return await this.request('/grievances', {
      method: 'POST',
      body: JSON.stringify(grievanceData),
    });
  }

  async updateGrievance(grievanceId, grievanceData) {
    return await this.request(`/grievances/${grievanceId}`, {
      method: 'PUT',
      body: JSON.stringify(grievanceData),
    });
  }

  async updateGrievanceStatus(grievanceId, statusData) {
    return await this.request(`/grievances/${grievanceId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async deleteGrievance(grievanceId) {
    return await this.request(`/grievances/${grievanceId}`, {
      method: 'DELETE',
    });
  }

  async getGrievanceStats(grievanceType = null) {
    const endpoint = `/grievances/stats${grievanceType ? '?grievance_type=' + grievanceType : ''}`;
    return await this.request(endpoint);
  }

  async getInvestorGrievances(investorId) {
    return await this.getGrievances({ 
      investor_id: investorId,
      grievance_type: 'investor'
    });
  }

  // ============================================
  // COMPLIANCE ENDPOINTS
  // ============================================
  
  async getComplianceSeries(searchTerm = null) {
    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.append('search', searchTerm);
    const endpoint = `/compliance/series${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getSeriesCompliance(seriesId, year = null, month = null) {
    const queryParams = new URLSearchParams();
    if (year !== null) queryParams.append('year', year);
    if (month !== null) queryParams.append('month', month);
    const endpoint = `/compliance/series/${seriesId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getComplianceDetails(seriesId) {
    return await this.request(`/compliance/series/${seriesId}`);
  }

  async updateComplianceStatus(seriesId, itemId, statusData) {
    return await this.request(`/compliance/series/${seriesId}/item/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async getSeriesComplianceSummary(seriesId) {
    return await this.request(`/compliance/series/${seriesId}/summary`);
  }

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  
  async getDashboardMetrics() {
    return await this.request('/dashboard/metrics');
  }

  async getPayoutStats() {
    return await this.request('/dashboard/payout-stats');
  }

  async getTopInvestors(limit = 10) {
    return await this.request(`/dashboard/top-investors?limit=${limit}`);
  }

  async getMaturityLockinDistribution() {
    return await this.request('/dashboard/maturity-lockin-distribution');
  }

  async getUpcomingMaturityCalendar() {
    return await this.request('/dashboard/upcoming-maturity-calendar');
  }

  async getSatisfactionMetrics() {
    return await this.request('/dashboard/satisfaction-metrics');
  }

  // ============================================
  // INVESTOR ENDPOINTS
  // ============================================
  
  async getInvestors(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.kyc_status) queryParams.append('kyc_status', params.kyc_status);
    const endpoint = `/investors${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getInvestor(investorId) {
    return await this.request(`/investors/${investorId}`);
  }

  async createInvestor(investorData) {
    return await this.request('/investors', {
      method: 'POST',
      body: JSON.stringify(investorData),
    });
  }

  async updateInvestor(investorId, investorData) {
    return await this.request(`/investors/${investorId}`, {
      method: 'PUT',
      body: JSON.stringify(investorData),
    });
  }

  async deleteInvestor(investorId) {
    return await this.request(`/investors/${investorId}`, {
      method: 'DELETE',
    });
  }

  async addInvestment(investorId, investmentData, paymentDocument) {
    const formData = new FormData();
    formData.append('series_id', investmentData.series_id);
    formData.append('amount', investmentData.amount);
    formData.append('date_transferred', investmentData.date_transferred);
    formData.append('date_received', investmentData.date_received);
    
    if (paymentDocument) {
      formData.append('payment_document', paymentDocument);
    }
    
    return await this.request(`/investors/${investorId}/investments`, {
      method: 'POST',
      body: formData
      // Don't set headers - request method will handle authentication
    });
  }

  async getInvestorInvestments(investorId) {
    return await this.request(`/investors/${investorId}/investments`);
  }

  async uploadInvestorDocument(investorId, documentType, file) {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/investors/${investorId}/documents`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    };
    
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async getInvestorDocuments(investorId) {
    return await this.request(`/investors/${investorId}/documents`);
  }

  async exitInvestorFromSeries(investorId, seriesId) {
    return await this.request(`/investors/${investorId}/series/${seriesId}/exit`, {
      method: 'POST',
    });
  }

  async uploadSeriesInvestorDocument(investorId, seriesId, documentType, file) {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/investors/${investorId}/series/${seriesId}/documents`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    };
    
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  // Investor Statistics and Analytics
  async getInvestorStatistics() {
    return await this.request('/investors/stats/summary');
  }

  async getUniqueSeriesForFilters() {
    return await this.request('/investors/filters/series');
  }

  async searchInvestors(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.kyc_status) queryParams.append('kyc_status', params.kyc_status);
    if (params.series_name) queryParams.append('series_name', params.series_name);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    
    const url = `/investors/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async generateInvestorId() {
    return await this.request('/investors/generate-id');
  }

  async exportInvestorsCSV(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.kyc_status) queryParams.append('kyc_status', params.kyc_status);
    if (params.series_name) queryParams.append('series_name', params.series_name);
    if (params.status) queryParams.append('status', params.status);
    
    const url = `/investors/export/csv${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async validateInvestment(investorId, seriesId, amount) {
    return await this.request('/investors/validate-investment', {
      method: 'POST',
      body: JSON.stringify({ investor_id: investorId, series_id: seriesId, amount })
    });
  }

  // Get available series for investment (with backend-calculated status)
  async getAvailableSeriesForInvestment() {
    if (import.meta.env.DEV) { console.log('🔄 Calling getAvailableSeriesForInvestment...'); }
    if (import.meta.env.DEV) { console.log('🔄 Endpoint: /investors/series/available-for-investment'); }
    if (import.meta.env.DEV) { console.log('🔄 Method: GET'); }
    
    try {
      const result = await this.request('/investors/series/available-for-investment', {
        method: 'GET'
      });
      if (import.meta.env.DEV) { console.log('✅ getAvailableSeriesForInvestment SUCCESS:', result); }
      return result;
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ getAvailableSeriesForInvestment FAILED:', error); }
      if (import.meta.env.DEV) { console.error('❌ Error message:', error.message); }
      if (import.meta.env.DEV) { console.error('❌ Error stack:', error.stack); }
      throw error;
    }
  }

  // Series methods for investment
  async getSeriesForInvestment(search = '') {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    
    const url = `/series/available-for-investment${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  // ============================================
  // INTEREST PAYOUT METHODS
  // ============================================

  // Get all payouts (main table view)
  async getAllPayouts(seriesId = null, statusFilter = null, search = null) {
    const queryParams = new URLSearchParams();
    if (seriesId) queryParams.append('series_id', seriesId);
    if (statusFilter) queryParams.append('status_filter', statusFilter);
    if (search) queryParams.append('search', search);
    
    const url = `/payouts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  // Get export payouts (for export modal)
  async getExportPayouts(seriesId = null, monthType = 'current') {
    const queryParams = new URLSearchParams();
    if (seriesId) queryParams.append('series_id', seriesId);
    queryParams.append('month_type', monthType);
    
    const url = `/payouts/export?${queryParams.toString()}`;
    return await this.request(url);
  }

  // Get payout summary statistics
  async getPayoutSummary() {
    return await this.request('/payouts/summary');
  }

  // Import payout data (to be implemented)
  async importPayouts(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return await this.request('/payouts/import', {
      method: 'POST',
      body: formData
    });
  }

  // Update payout status
  async updatePayoutStatus(payoutId, newStatus) {
    return await this.request(`/payouts/update-status/${payoutId}?new_status=${newStatus}`, {
      method: 'PUT'
    });
  }

  // Download payouts as CSV (backend generates file)
  async downloadPayoutsCSV(seriesId = null, statusFilter = null) {
    const queryParams = new URLSearchParams();
    if (seriesId) queryParams.append('series_id', seriesId);
    if (statusFilter) queryParams.append('status_filter', statusFilter);
    
    const url = `/payouts/download/csv${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    // Download file from backend
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to download CSV');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'interest-payouts.csv';
    
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true, filename };
  }

  // Download export CSV (backend generates file)
  async downloadExportCSV(seriesId = null, monthType = 'current') {
    const queryParams = new URLSearchParams();
    if (seriesId) queryParams.append('series_id', seriesId);
    queryParams.append('month_type', monthType);
    
    const url = `/payouts/download/export-csv?${queryParams.toString()}`;
    
    // Download file from backend
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to download export CSV');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'interest-payout-export.csv';
    
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true, filename };
  }

  // Download sample template (backend generates file)
  async downloadSampleTemplate() {
    const url = '/payouts/download/sample-template';
    
    // Download file from backend
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to download sample template');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'Interest_Payout_Sample.xlsx';
    
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true, filename };
  }

  // Get unique series names for filter dropdown (backend calculates)
  async getUniqueSeriesNames() {
    return await this.request('/payouts/unique-series-names');
  }

  // Get unique series for export dropdown (backend calculates)
  async getUniqueSeriesForExport() {
    return await this.request('/payouts/unique-series-for-export');
  }

  // ============================================
  // REPORTS ENDPOINTS
  // ============================================
  
  async getReportStatistics() {
    return await this.request('/reports/statistics');
  }

  async getMonthlyCollectionReport(fromDate = null, toDate = null, seriesId = null) {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    if (seriesId) queryParams.append('series_id', seriesId);
    const url = `/reports/monthly-collection${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getPayoutStatementReport(fromDate = null, toDate = null, month = null, seriesId = null) {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    if (month) queryParams.append('month', month);
    if (seriesId) queryParams.append('series_id', seriesId);
    const url = `/reports/payout-statement${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getSeriesPerformanceReport() {
    return await this.request('/reports/series-performance');
  }

  async getInvestorPortfolioReport(fromDate = null, toDate = null, investorId = null, seriesId = null) {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    if (investorId) queryParams.append('investor_id', investorId);
    if (seriesId) queryParams.append('series_id', seriesId);
    const url = `/reports/investor-portfolio${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getKYCStatusReport() {
    return await this.request('/reports/kyc-status');
  }

  async getNewInvestorsReport(fromDate = null, toDate = null, investorId = null) {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    if (investorId) queryParams.append('investor_id', investorId);
    const url = `/reports/new-investors${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getRBIComplianceReport(seriesId = null, securityType = null) {
    const queryParams = new URLSearchParams();
    if (seriesId) queryParams.append('series_id', seriesId);
    if (securityType && securityType !== 'all') queryParams.append('security_type', securityType);
    const url = `/reports/rbi-compliance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getSEBIDisclosureReport(seriesId = null) {
    const queryParams = new URLSearchParams();
    if (seriesId) queryParams.append('series_id', seriesId);
    const url = `/reports/sebi-disclosure${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getAuditTrailReport(fromDate = null, toDate = null, seriesId = null) {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    if (seriesId) queryParams.append('series_id', seriesId);
    const url = `/reports/audit-trail${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getDailyActivityReport(fromDate = null, toDate = null, role = null) {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    if (role && role !== 'all') queryParams.append('role', role);
    const url = `/reports/daily-activity${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(url);
  }

  async getSubscriptionTrendAnalysis() {
    return await this.request('/reports/subscription-trend-analysis');
  }

  async getSeriesMaturityReport() {
    return await this.request('/reports/series-maturity');
  }

  async getLastGeneratedDates() {
    return await this.request('/reports/last-generated');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;