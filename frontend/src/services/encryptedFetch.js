// Encrypted Fetch Wrapper - Minimizes network tab exposure
// Encrypts payloads before sending, making network tab show only gibberish

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'ncd-system-secret-key-min-32-chars!';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class EncryptedFetch {
  // Encrypt data with AES
  static encrypt(data) {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      /* Log removed for security */
      return null;
    }
  }

  // Decrypt data
  static decrypt(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      /* Log removed for security */
      return null;
    }
  }

  // Obfuscate endpoint URL
  static obfuscateUrl(endpoint) {
    // Encode endpoint in base64 to hide it from network tab
    return `/api/obs/${btoa(endpoint)}`;
  }

  // Make encrypted request
  static async request(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${this.obfuscateUrl(endpoint)}`;
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Encrypted': 'true',
        'X-Client-Version': '1.0.0',
      };

      // Add auth token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Encrypt request body if present
      let body = options.body;
      if (body && typeof body === 'object') {
        const encrypted = this.encrypt(body);
        body = JSON.stringify({ encrypted });
      }

      // Make request
      const response = await fetch(url, {
        ...options,
        method: options.method || 'GET',
        headers,
        body,
      });

      // Handle errors
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Decrypt response
      const responseData = await response.json();
      
      if (responseData.encrypted) {
        return this.decrypt(responseData.encrypted);
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }

  // GET request
  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  static post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  static put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // DELETE request
  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default EncryptedFetch;
