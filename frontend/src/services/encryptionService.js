/**
 * Frontend Encryption Service
 * Handles decryption of encrypted API responses
 * Uses Fernet-compatible decryption (Python cryptography library compatible)
 */

class EncryptionService {
  constructor() {
    // Get encryption key from environment variable
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || '';
    this.encryptionEnabled = import.meta.env.VITE_ENABLE_ENCRYPTION !== 'false';
    
    if (this.encryptionEnabled && !this.encryptionKey) {
      if (import.meta.env.DEV) { console.warn('⚠️ Encryption is enabled but no VITE_ENCRYPTION_KEY found in environment'); }
    }
    
    if (this.encryptionEnabled) {
      if (import.meta.env.DEV) { console.log('✅ Frontend encryption service initialized'); }
    } else {
      if (import.meta.env.DEV) { console.log('ℹ️ Frontend encryption is disabled'); }
    }
  }

  /**
   * Check if response is encrypted
   * @param {Object} response - API response
   * @returns {boolean}
   */
  isEncrypted(response) {
    return response && typeof response === 'object' && response.encrypted === true;
  }

  /**
   * Base64 URL decode (Fernet uses URL-safe base64)
   * @param {string} str - Base64 URL encoded string
   * @returns {Uint8Array}
   */
  base64UrlDecode(str) {
    // Convert URL-safe base64 to standard base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (str.length % 4) {
      str += '=';
    }
    
    // Decode base64
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Decrypt Fernet token
   * @param {string} token - Fernet token (base64 encoded)
   * @param {Uint8Array} key - Encryption key
   * @returns {Promise<string>} - Decrypted plaintext
   */
  async decryptFernet(token, key) {
    try {
      // Decode the token
      const tokenBytes = this.base64UrlDecode(token);
      
      // Fernet token structure:
      // Version (1 byte) | Timestamp (8 bytes) | IV (16 bytes) | Ciphertext (variable) | HMAC (32 bytes)
      
      if (tokenBytes.length < 57) {
        throw new Error('Invalid Fernet token: too short');
      }
      
      const version = tokenBytes[0];
      if (version !== 0x80) {
        throw new Error(`Invalid Fernet version: ${version}`);
      }
      
      // Extract components
      const iv = tokenBytes.slice(9, 25);
      const ciphertext = tokenBytes.slice(25, tokenBytes.length - 32);
      
      // Derive encryption key from Fernet key (first 16 bytes for encryption)
      const encryptionKey = key.slice(0, 16);
      
      // Import key for AES-128-CBC
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv },
        cryptoKey,
        ciphertext
      );
      
      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Fernet decryption error:', error); }
      throw error;
    }
  }

  /**
   * Decrypt API response
   * @param {string} encryptedData - Base64 encoded Fernet token
   * @returns {Promise<any>} - Decrypted data
   */
  async decrypt(encryptedData) {
    if (!this.encryptionEnabled) {
      throw new Error('Encryption is not enabled');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    try {
      // Decode the Fernet key
      const keyBytes = this.base64UrlDecode(this.encryptionKey);
      
      // Decrypt the Fernet token
      const decryptedText = await this.decryptFernet(encryptedData, keyBytes);
      
      // Parse JSON
      const data = JSON.parse(decryptedText);
      
      console.debug('✅ Successfully decrypted response data');
      return data;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Decryption failed:', error); }
      throw new Error(`Failed to decrypt response: ${error.message}`);
    }
  }

  /**
   * Process API response - decrypt if encrypted, return as-is if not
   * @param {Object} response - API response
   * @returns {Promise<any>} - Processed data
   */
  async processResponse(response) {
    // Check if response is encrypted
    if (this.isEncrypted(response)) {
      console.debug('🔐 Response is encrypted, decrypting...');
      return await this.decrypt(response.data);
    }
    
    // If encryption is disabled or response is not encrypted
    if (response && typeof response === 'object' && 'data' in response && response.encrypted === false) {
      console.debug('ℹ️ Response is not encrypted (encryption disabled on server)');
      return response.data;
    }
    
    // Return as-is if not in encrypted format
    console.debug('ℹ️ Response is not in encrypted format, returning as-is');
    return response;
  }

  /**
   * Check if encryption is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.encryptionEnabled && !!this.encryptionKey;
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

export default encryptionService;
