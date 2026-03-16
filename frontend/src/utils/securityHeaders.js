import CryptoJS from 'crypto-js';

// Security Headers Configuration
// These should be set by the server, but we can add meta tags as fallback

// SECRET KEY for local storage encryption - In production, this should be moved to env
const STORAGE_ENCRYPTION_KEY = 'ncd-platform-secure-storage-key-2024';

export const initSecurityHeaders = () => {
  // Content Security Policy - Prevent data exfiltration
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = `
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self' http://localhost:8000;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim();
  document.head.appendChild(cspMeta);

  // X-Content-Type-Options - Prevent MIME type sniffing
  const xContentType = document.createElement('meta');
  xContentType.httpEquiv = 'X-Content-Type-Options';
  xContentType.content = 'nosniff';
  document.head.appendChild(xContentType);

  // X-Frame-Options - Prevent clickjacking
  const xFrameOptions = document.createElement('meta');
  xFrameOptions.httpEquiv = 'X-Frame-Options';
  xFrameOptions.content = 'DENY';
  document.head.appendChild(xFrameOptions);

  // X-XSS-Protection - Enable XSS protection
  const xXssProtection = document.createElement('meta');
  xXssProtection.httpEquiv = 'X-XSS-Protection';
  xXssProtection.content = '1; mode=block';
  document.head.appendChild(xXssProtection);

  // Referrer-Policy - Don't leak referrer
  const referrerPolicy = document.createElement('meta');
  referrerPolicy.name = 'referrer';
  referrerPolicy.content = 'no-referrer';
  document.head.appendChild(referrerPolicy);

  // Permissions-Policy - Disable dangerous features
  const permissionsPolicy = document.createElement('meta');
  permissionsPolicy.httpEquiv = 'Permissions-Policy';
  permissionsPolicy.content = `
    geolocation=(),
    microphone=(),
    camera=(),
    payment=(),
    usb=(),
    magnetometer=(),
    gyroscope=(),
    accelerometer=()
  `.replace(/\s+/g, ' ').trim();
  document.head.appendChild(permissionsPolicy);
};

// Prevent data from being sent to external services
export const preventDataExfiltration = () => {
  // Block all external requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Only allow requests to our API
    if (!url.includes('localhost:8000') && !url.includes(window.location.hostname)) {
      /* Log removed */
      return Promise.reject(new Error('External requests are not allowed'));
    }
    return originalFetch.apply(this, arguments);
  };

  // Block XMLHttpRequest to external domains
  const originalXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (!url.includes('localhost:8000') && !url.includes(window.location.hostname)) {
      /* Log removed */
      throw new Error('External requests are not allowed');
    }
    return originalXHR.apply(this, arguments);
  };
};

// Prevent data from being stored in localStorage
export const secureLocalStorage = () => {
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;

  // Only allow specific keys
  const allowedKeys = ['authToken', 'userPreferences', 'user'];

  Storage.prototype.setItem = function(key, value) {
    if (!allowedKeys.includes(key)) {
      return;
    }
    
    try {
      // Encrypt before storing using AES
      const encrypted = CryptoJS.AES.encrypt(value, STORAGE_ENCRYPTION_KEY).toString();
      return originalSetItem.call(this, key, encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return originalSetItem.call(this, key, value);
    }
  };

  Storage.prototype.getItem = function(key) {
    const value = originalGetItem.call(this, key);
    if (value && allowedKeys.includes(key)) {
      try {
        // Decrypt after retrieving using AES
        const bytes = CryptoJS.AES.decrypt(value, STORAGE_ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || value;
      } catch (error) {
        // Fallback for non-encrypted or incorrectly encrypted data
        return value;
      }
    }
    return value;
  };
};
