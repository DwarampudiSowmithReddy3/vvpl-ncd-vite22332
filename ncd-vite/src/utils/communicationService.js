/**
 * Communication Service
 * Handles sending SMS and Email messages
 * 
 * Configuration:
 * - Set VITE_API_BASE_URL in .env file to use your backend API
 * - Or configure direct API keys for SMS/Email services
 */

// API Configuration - Update these values or use environment variables
const API_CONFIG = {
  // Backend API endpoint (recommended for production)
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // Direct API configuration (alternative approach)
  // SMS Provider - Options: 'twilio', 'textlocal', 'custom'
  SMS_PROVIDER: import.meta.env.VITE_SMS_PROVIDER || 'custom',
  SMS_API_KEY: import.meta.env.VITE_SMS_API_KEY || '',
  SMS_API_SECRET: import.meta.env.VITE_SMS_API_SECRET || '',
  SMS_FROM_NUMBER: import.meta.env.VITE_SMS_FROM_NUMBER || '',
  
  // Email Provider - Options: 'sendgrid', 'ses', 'custom'
  EMAIL_PROVIDER: import.meta.env.VITE_EMAIL_PROVIDER || 'custom',
  EMAIL_API_KEY: import.meta.env.VITE_EMAIL_API_KEY || '',
  EMAIL_FROM: import.meta.env.VITE_EMAIL_FROM || 'noreply@yourcompany.com',
  EMAIL_FROM_NAME: import.meta.env.VITE_EMAIL_FROM_NAME || 'NCD System',
};

/**
 * Send SMS using backend API or direct API
 */
export const sendSMS = async (mobileNumber, message) => {
  try {
    // Option 1: Direct API calls (if configured with API keys)
    if (API_CONFIG.SMS_PROVIDER === 'twilio' && API_CONFIG.SMS_API_KEY) {
      return await sendSMSTwilio(mobileNumber, message);
    }
    
    if (API_CONFIG.SMS_PROVIDER === 'textlocal' && API_CONFIG.SMS_API_KEY) {
      return await sendSMSTextLocal(mobileNumber, message);
    }

    // Option 2: Use backend API (recommended for production)
    const apiUrl = API_CONFIG.BASE_URL;
    const response = await fetch(`${apiUrl}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: mobileNumber,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `API request failed: ${response.status} ${response.statusText}` 
      }));
      throw new Error(errorData.error || `Failed to send SMS. Status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId || data.id || Date.now().toString(),
      status: 'Success',
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    
    // Check if it's a network/API error
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Unable to connect to SMS service. Please check your API configuration. See .env.example for setup instructions.',
        status: 'Failed',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send SMS. Please check your API configuration.',
      status: 'Failed',
    };
  }
};

/**
 * Send Email using backend API or direct API
 */
export const sendEmail = async (emailId, subject, message, htmlContent = null) => {
  try {
    // Option 1: Direct API calls (if configured with API keys)
    if (API_CONFIG.EMAIL_PROVIDER === 'sendgrid' && API_CONFIG.EMAIL_API_KEY) {
      return await sendEmailSendGrid(emailId, subject, message, htmlContent);
    }
    
    if (API_CONFIG.EMAIL_PROVIDER === 'ses') {
      return await sendEmailSES(emailId, subject, message, htmlContent);
    }

    // Option 2: Use backend API (recommended for production)
    const apiUrl = API_CONFIG.BASE_URL;
    const response = await fetch(`${apiUrl}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailId,
        subject: subject || 'NCD Interest Payment Notification',
        text: message,
        html: htmlContent || message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `API request failed: ${response.status} ${response.statusText}` 
      }));
      throw new Error(errorData.error || `Failed to send email. Status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId || data.id || Date.now().toString(),
      status: 'Success',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Check if it's a network/API error
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Unable to connect to email service. Please check your API configuration. See .env.example for setup instructions.',
        status: 'Failed',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send email. Please check your API configuration.',
      status: 'Failed',
    };
  }
};

/**
 * Send SMS via Twilio (requires Twilio account)
 */
const sendSMSTwilio = async (mobileNumber, message) => {
  const accountSid = API_CONFIG.SMS_API_KEY;
  const authToken = API_CONFIG.SMS_API_SECRET;
  const fromNumber = API_CONFIG.SMS_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: mobileNumber,
        Body: message,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send SMS via Twilio');
  }

  const data = await response.json();
  return {
    success: true,
    messageId: data.sid,
    status: 'Success',
  };
};

/**
 * Send SMS via TextLocal (India focused service)
 */
const sendSMSTextLocal = async (mobileNumber, message) => {
  const apiKey = API_CONFIG.SMS_API_KEY;
  const sender = API_CONFIG.SMS_FROM_NUMBER || 'TXTLCL';

  if (!apiKey) {
    throw new Error('TextLocal API key not configured');
  }

  const response = await fetch('https://api.textlocal.in/send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey: apiKey,
      numbers: mobileNumber,
      message: message,
      sender: sender,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Failed to send SMS via TextLocal');
  }

  const data = await response.json();
  if (data.status === 'failure') {
    throw new Error(data.errors?.[0]?.message || 'Failed to send SMS');
  }

  return {
    success: true,
    messageId: data.batch_id,
    status: 'Success',
  };
};

/**
 * Send Email via SendGrid
 */
const sendEmailSendGrid = async (emailId, subject, message, htmlContent) => {
  const apiKey = API_CONFIG.EMAIL_API_KEY;

  if (!apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: emailId }],
          subject: subject,
        },
      ],
      from: {
        email: API_CONFIG.EMAIL_FROM,
        name: API_CONFIG.EMAIL_FROM_NAME,
      },
      content: [
        {
          type: 'text/plain',
          value: message,
        },
        {
          type: 'text/html',
          value: htmlContent || message,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to send email via SendGrid');
  }

  return {
    success: true,
    messageId: response.headers.get('x-message-id'),
    status: 'Success',
  };
};

/**
 * Send Email via AWS SES (requires AWS credentials on backend)
 */
const sendEmailSES = async (emailId, subject, message, htmlContent) => {
  // AWS SES typically requires backend API due to AWS credentials
  // This would call your backend API that uses AWS SDK
  throw new Error('AWS SES requires backend API integration');
};

