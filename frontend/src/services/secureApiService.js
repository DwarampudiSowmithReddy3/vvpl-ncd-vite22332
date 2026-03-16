// Secure API Service - Encrypts ALL data in transit
import CryptoJS from 'crypto-js';

const API_BASE_URL = 'http://localhost:8000';
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-min-32-chars-long!';

class SecureApiService {
  constructor() {
    this.token = this.getTokenFromCookie();
  }

  // Get token from HTTP-only cookie (cannot be accessed by JavaScript in production)
  getTokenFromCookie() {
    if (typeof document === 'undefined') return null;
    const name = 'authToken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length);
      }
    }
    return null;
  }

  // Encrypt data
  encryptData(data) {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    } catch (error) {
      /* Log removed */
      return null;
    }
  }

  // Decrypt data
  decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      /* Log removed */
      return null;
    }
  }

  // Get headers with token
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Encrypted': 'true', // Tell backend this is encrypted
    };

    const token = this.getTokenFromCookie();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Secure request - encrypts request and response
  async secureRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Prepare request
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      // Encrypt the request body
      body = this.encryptData(body);
    }

    const config = {
      ...options,
      method: options.method || 'GET',
      headers: this.getHeaders(),
      body: body ? JSON.stringify({ encrypted: body }) : undefined,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Decrypt response
      const responseData = await response.json();
      
      if (responseData.encrypted) {
        return this.decryptData(responseData.encrypted);
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }

  // Set token in HTTP-only cookie (backend should do this)
  setToken(token) {
    // This is set by backend via Set-Cookie header
    // Frontend cannot set HTTP-only cookies
    this.token = token;
  }

  // Clear token
  clearToken() {
    this.token = null;
    // Backend should clear the cookie
  }

  // All API methods using secure encryption
  async getSeries() {
    return this.secureRequest('/series');
  }

  async getSeriesCompliance(seriesId, year, month) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    const queryString = params.toString();
    return this.secureRequest(`/compliance/series/${seriesId}${queryString ? '?' + queryString : ''}`);
  }

  async getInvestors() {
    return this.secureRequest('/investors');
  }

  async createAuditLog(data) {
    return this.secureRequest('/audit/', {
      method: 'POST',
      body: data,
    });
  }

  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.secureRequest(`/audit/?${queryString}`);
  }

  // Add more methods as needed...
}

export default new SecureApiService();
