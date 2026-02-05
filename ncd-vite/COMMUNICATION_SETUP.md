# Communication Service Setup Guide

This guide explains how to configure real SMS and Email functionality for the Communication page.

## Configuration Options

### Option 1: Backend API (Recommended for Production)

Create a backend API that handles SMS and Email sending. This keeps your API keys secure on the server.

**Backend Endpoints Required:**

1. **SMS Endpoint:** `POST /api/sms/send`
   ```json
   Request Body:
   {
     "to": "mobile_number",
     "message": "message content"
   }
   
   Response:
   {
     "success": true,
     "messageId": "unique_message_id",
     "id": "unique_message_id"
   }
   ```

2. **Email Endpoint:** `POST /api/email/send`
   ```json
   Request Body:
   {
     "to": "email@example.com",
     "subject": "Email Subject",
     "text": "Plain text message",
     "html": "<html>HTML content</html>"
   }
   
   Response:
   {
     "success": true,
     "messageId": "unique_message_id",
     "id": "unique_message_id"
   }
   ```

**Setup Steps:**

1. Create a `.env` file in the project root
2. Add: `VITE_API_BASE_URL=https://your-backend-api.com/api`
3. Restart the development server

---

### Option 2: Direct SMS Provider (Twilio)

**Setup Steps:**

1. Sign up for a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio Console
3. Get a Twilio phone number
4. Create a `.env` file in the project root with:
   ```
   VITE_SMS_PROVIDER=twilio
   VITE_SMS_API_KEY=your_account_sid
   VITE_SMS_API_SECRET=your_auth_token
   VITE_SMS_FROM_NUMBER=your_twilio_phone_number
   ```
5. Restart the development server

---

### Option 3: Direct SMS Provider (TextLocal - India)

**Setup Steps:**

1. Sign up at https://www.textlocal.in
2. Get your API key from the dashboard
3. Create a `.env` file in the project root with:
   ```
   VITE_SMS_PROVIDER=textlocal
   VITE_SMS_API_KEY=your_textlocal_api_key
   VITE_SMS_FROM_NUMBER=your_sender_id
   ```
4. Restart the development server

---

### Option 4: Direct Email Provider (SendGrid)

**Setup Steps:**

1. Sign up for SendGrid at https://sendgrid.com
2. Create an API key in the SendGrid dashboard
3. Verify your sender email address
4. Create a `.env` file in the project root with:
   ```
   VITE_EMAIL_PROVIDER=sendgrid
   VITE_EMAIL_API_KEY=your_sendgrid_api_key
   VITE_EMAIL_FROM=your_verified_email@domain.com
   VITE_EMAIL_FROM_NAME=Your Company Name
   ```
5. Restart the development server

---

## Environment Variables Summary

Create a `.env` file in the project root with any of these configurations:

### Backend API (Recommended)
```
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### Twilio SMS
```
VITE_SMS_PROVIDER=twilio
VITE_SMS_API_KEY=your_account_sid
VITE_SMS_API_SECRET=your_auth_token
VITE_SMS_FROM_NUMBER=+1234567890
```

### TextLocal SMS
```
VITE_SMS_PROVIDER=textlocal
VITE_SMS_API_KEY=your_textlocal_api_key
VITE_SMS_FROM_NUMBER=TXTLCL
```

### SendGrid Email
```
VITE_EMAIL_PROVIDER=sendgrid
VITE_EMAIL_API_KEY=your_sendgrid_api_key
VITE_EMAIL_FROM=noreply@yourcompany.com
VITE_EMAIL_FROM_NAME=NCD System
```

---

## Important Notes

1. **Never commit `.env` file** - It contains sensitive API keys
2. **Restart the dev server** after changing environment variablesi
3. **Backend API is recommended** for production as it keeps API keys secure
4. **Test with a single message first** before sending bulk messages
5. Check your SMS/Email provider's rate limits and pricing

---

## Testing

After configuration:

1. Upload an Excel file with investor data
2. Select a template
3. Click "Send Quick SMS" or "Send Quick Email"
4. Check the Communication History tab to see results
5. Verify messages were sent by checking your phone/email

---

## Troubleshooting

**Error: "Unable to connect to SMS service"**
- Check if `VITE_API_BASE_URL` is correct
- Ensure your backend API is running
- Check network connectivity

**Error: "API credentials not configured"**
- Verify your `.env` file exists in the project root
- Check that environment variables are prefixed with `VITE_`
- Restart the development server after adding/changing `.env`

**Messages not being received**
- Check the Communication History tab for detailed error messages
- Verify phone numbers/emails are correct in the Excel file
- Check your SMS/Email provider dashboard for delivery status
- Verify API keys are correct and have necessary permissions

