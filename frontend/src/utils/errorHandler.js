/**
 * Error Handler Utility
 * Converts technical error messages into user-friendly messages
 */

/**
 * Get user-friendly error message
 * @param {Error|string} error - The error object or message
 * @param {string} defaultMessage - Default message if error can't be parsed
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyError = (error, defaultMessage = 'An error occurred. Please try again.') => {
  try {
    // If error is a string
    if (typeof error === 'string') {
      return cleanErrorMessage(error);
    }
    
    // If error has a message property
    if (error && error.message) {
      return cleanErrorMessage(error.message);
    }
    
    // If error has a response with data
    if (error && error.response && error.response.data) {
      if (error.response.data.detail) {
        return cleanErrorMessage(error.response.data.detail);
      }
      if (error.response.data.message) {
        return cleanErrorMessage(error.response.data.message);
      }
    }
    
    // Default fallback
    return defaultMessage;
  } catch (e) {
    return defaultMessage;
  }
};

/**
 * Clean technical error message to user-friendly format
 * @param {string} message - Raw error message
 * @returns {string} Cleaned message
 */
const cleanErrorMessage = (message) => {
  // Remove localhost URLs
  message = message.replace(/http:\/\/localhost:\d+/g, '');
  message = message.replace(/https?:\/\/[^\s]+/g, '');
  
  // Remove technical error codes
  message = message.replace(/Error:\s*/gi, '');
  message = message.replace(/\b\d{3}\s+(Internal Server Error|Bad Request|Not Found|Forbidden)\b/gi, '');
  
  // Remove stack traces
  message = message.split('\n')[0];
  
  // Remove "at ApiService" and similar technical details
  message = message.replace(/at\s+\w+\.\w+.*$/gi, '');
  
  // Clean up specific error patterns
  const errorMappings = {
    'calculate_series_status() got an unexpected keyword argument': 'Unable to process series status. Please contact support.',
    'Not authenticated': 'Your session has expired. Please login again.',
    'Access Denied': 'You do not have permission to perform this action.',
    'Not Found': 'The requested resource was not found.',
    'Internal Server Error': 'A server error occurred. Please try again later.',
    'Network Error': 'Unable to connect to the server. Please check your internet connection.',
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
    'Unauthorized': 'Your session has expired. Please login again.',
    '403': 'You do not have permission to perform this action.',
    '404': 'The requested resource was not found.',
    '500': 'A server error occurred. Please try again later.',
    '401': 'Your session has expired. Please login again.',
  };
  
  // Check for known error patterns
  for (const [pattern, replacement] of Object.entries(errorMappings)) {
    if (message.includes(pattern)) {
      return replacement;
    }
  }
  
  // Trim and clean up
  message = message.trim();
  
  // If message is too technical or empty, return generic message
  if (!message || message.length < 5 || message.includes('undefined')) {
    return 'An error occurred. Please try again.';
  }
  
  // Capitalize first letter
  message = message.charAt(0).toUpperCase() + message.slice(1);
  
  // Ensure message ends with period
  if (!message.endsWith('.') && !message.endsWith('!') && !message.endsWith('?')) {
    message += '.';
  }
  
  return message;
};

/**
 * Get user-friendly success message
 * @param {string} action - The action performed (e.g., 'approved', 'created', 'updated')
 * @param {string} entityType - Type of entity (e.g., 'series', 'investor', 'payout')
 * @param {string} entityName - Name of the entity (optional)
 * @returns {string} User-friendly success message
 */
export const getSuccessMessage = (action, entityType, entityName = '') => {
  const name = entityName ? `"${entityName}" ` : '';
  const actionPast = action.endsWith('e') ? `${action}d` : `${action}ed`;
  
  return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${name}${actionPast} successfully!`;
};

/**
 * Common error messages for different scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Unable to connect to the server. Please check your internet connection.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN: 'An error occurred. Please try again.',
};

/**
 * Common success messages for different scenarios
 */
export const SUCCESS_MESSAGES = {
  CREATED: (entity) => `${entity} created successfully!`,
  UPDATED: (entity) => `${entity} updated successfully!`,
  DELETED: (entity) => `${entity} deleted successfully!`,
  APPROVED: (entity) => `${entity} approved successfully!`,
  REJECTED: (entity) => `${entity} rejected successfully!`,
  SAVED: (entity) => `${entity} saved successfully!`,
};
