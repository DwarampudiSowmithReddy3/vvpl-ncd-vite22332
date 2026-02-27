# SIMPLIFIED COMMUNICATION SYSTEM

## Overview
This is a completely redesigned, simplified, and secure communication system where **ALL LOGIC IS IN THE BACKEND**. The frontend is just a UI that displays data and sends simple requests.

## Why This Redesign?

### Problems with Old System:
1. ❌ **Complex frontend logic** - State management was too complicated
2. ❌ **Security risks** - Frontend could manipulate data before sending
3. ❌ **Hard to maintain** - Logic scattered between frontend and backend
4. ❌ **No template management** - Templates hardcoded in frontend
5. ❌ **Attack surface** - Frontend could send malicious data

### Benefits of New System:
1. ✅ **All logic in backend** - Frontend just displays and sends requests
2. ✅ **Attack-proof** - All validation and processing server-side
3. ✅ **Database-driven** - Templates and variables stored in MySQL
4. ✅ **Simple to maintain** - One source of truth (backend)
5. ✅ **Secure** - No way for frontend to manipulate logic

---

## Database Tables

### 1. `communication_templates`
Stores all message templates (SMS and Email)

```sql
CREATE TABLE communication_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('SMS', 'Email') NOT NULL,
    subject VARCHAR(500) NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL
);
```

**Example Data:**
- Interest Payment Notification (SMS)
- Payment Confirmation (Email)
- General Update (SMS/Email)

### 2. `communication_variables`
Stores available variables for message personalization

```sql
CREATE TABLE communication_variables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    variable_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    example_value VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Available Variables:**
- `{InvestorName}` - Full name of investor
- `{InvestorID}` - Unique investor ID
- `{SeriesName}` - NCD series name
- `{Amount}` - Payment/investment amount
- `{BankAccountNumber}` - Bank account number
- `{InterestMonth}` - Interest payment month
- `{Status}` - Transaction status

### 3. `communication_history`
Stores all sent communications (already exists)

---

## API Endpoints

### 1. GET `/communication/templates`
**Purpose:** Get all active templates from database  
**Query Params:** `type` (optional) - 'SMS' or 'Email'  
**Returns:** List of templates  
**Logic:** ALL IN BACKEND - Frontend just displays

### 2. GET `/communication/variables`
**Purpose:** Get all active variables from database  
**Returns:** List of variables with descriptions  
**Logic:** ALL IN BACKEND - Frontend just displays

### 3. GET `/communication/series`
**Purpose:** Get all series with investor counts  
**Query Params:**
- `search` (optional) - Search series name
- `status_filter` (optional) - Filter by status  
**Returns:** List of series with investor counts  
**Logic:** ALL IN BACKEND - Joins, counts, filtering all server-side

### 4. POST `/communication/send`
**Purpose:** Send messages to investors  
**Request Body:**
```json
{
  "type": "SMS" | "Email",
  "template_id": 1 (optional),
  "custom_message": "text" (optional),
  "series_ids": [1, 2, 3]
}
```
**Logic:** ALL IN BACKEND
1. Validates request
2. Gets template from database (if template_id provided)
3. Gets all investors from selected series
4. Personalizes message for each investor
5. Sends via Kaleyra (SMS) or SMTP (Email)
6. Saves to communication_history
7. Creates audit log
8. Returns success/failure counts

### 5. GET `/communication/history`
**Purpose:** Get communication history  
**Query Params:**
- `type` (optional) - 'SMS' or 'Email'
- `status` (optional) - 'Success' or 'Failed'
- `limit` (optional) - Number of records
- `offset` (optional) - Pagination offset  
**Returns:** List of sent communications  
**Logic:** ALL IN BACKEND - Simple database query

### 6. GET `/communication/history/stats`
**Purpose:** Get communication statistics  
**Returns:** Total count, SMS count, Email count  
**Logic:** ALL IN BACKEND - Simple aggregation query

---

## Frontend Component

### File: `frontend/src/pages/CommunicationSimple.jsx`

**What it does:**
1. Displays UI
2. Fetches data from backend
3. Sends simple requests
4. Shows results

**What it DOESN'T do:**
1. ❌ No complex state management
2. ❌ No data manipulation
3. ❌ No business logic
4. ❌ No calculations
5. ❌ No validation (backend does it)

**Simple Flow:**
1. User selects communication type (SMS/Email)
2. User selects template OR writes custom message
3. User selects series (checkboxes)
4. User clicks "Send"
5. Frontend sends simple request to backend
6. Backend does EVERYTHING
7. Frontend shows success/failure message

---

## Security Features

### 1. Input Validation
- All validation in backend
- Type checking (SMS/Email)
- Required field validation
- SQL injection prevention (parameterized queries)

### 2. Permission Checks
- Every endpoint checks permissions
- Unauthorized access logged
- 403 Forbidden if no permission

### 3. Audit Logging
- Every send action logged
- IP address tracked
- User details recorded
- Changes tracked

### 4. Attack Prevention
- No frontend logic to manipulate
- All data fetched from database
- No hardcoded values
- Rate limiting possible (add if needed)

---

## Setup Instructions

### Step 1: Create Database Tables
```bash
# Run the SQL file
mysql -u root -p ncd_management < backend/COMMUNICATION_TABLES.sql
```

### Step 2: Configure Environment Variables
Update `backend/.env`:
```env
# Kaleyra SMS Configuration
KALEYRA_API_KEY=your_actual_api_key_here
KALEYRA_SID=your_actual_sid_here
KALEYRA_SENDER_ID=your_sender_id_here
KALEYRA_API_URL=https://api.kaleyra.io/v1/

# SMTP Email Configuration
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_email@domain.com
VITE_SMTP_PASSWORD=your_email_password
```

### Step 3: Update Backend Routes
Replace old communication route with new one in `backend/main.py`:
```python
# OLD (comment out or remove)
# from routes import communication

# NEW (add this)
from routes import communication_simple

# Register route
app.include_router(communication_simple.router)
```

### Step 4: Update Frontend Route
Update `frontend/src/App.jsx`:
```jsx
// OLD (comment out or remove)
// import Communication from './pages/Communication';

// NEW (add this)
import CommunicationSimple from './pages/CommunicationSimple';

// In routes
<Route path="/communication" element={<CommunicationSimple />} />
```

### Step 5: Implement Kaleyra API
Update `backend/routes/communication_simple.py` line ~200:
```python
def send_sms_via_kaleyra(phone: str, message: str) -> tuple:
    # Replace the TODO with actual Kaleyra API call
    import requests
    
    api_key = os.getenv('KALEYRA_API_KEY')
    sid = os.getenv('KALEYRA_SID')
    sender_id = os.getenv('KALEYRA_SENDER_ID')
    api_url = os.getenv('KALEYRA_API_URL')
    
    response = requests.post(
        f"{api_url}messages",
        headers={'api-key': api_key},
        json={
            'to': phone,
            'sender': sender_id,
            'body': message,
            'type': 'TXN'
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return (True, data.get('id'), None)
    else:
        return (False, None, response.text)
```

### Step 6: Implement SMTP Email
Update `backend/routes/communication_simple.py` line ~250:
```python
def send_email_via_smtp(email: str, subject: str, message: str) -> tuple:
    # Replace the TODO with actual SMTP call
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    smtp_host = os.getenv('VITE_SMTP_HOST')
    smtp_port = int(os.getenv('VITE_SMTP_PORT'))
    smtp_user = os.getenv('VITE_SMTP_USER')
    smtp_password = os.getenv('VITE_SMTP_PASSWORD')
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = email
    msg['Subject'] = subject
    msg.attach(MIMEText(message, 'plain'))
    
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
    
    message_id = f"EMAIL_{datetime.now().timestamp()}"
    return (True, message_id, None)
```

---

## Testing

### 1. Test Database Tables
```sql
-- Check templates
SELECT * FROM communication_templates WHERE is_active = TRUE;

-- Check variables
SELECT * FROM communication_variables WHERE is_active = TRUE;

-- Check history
SELECT * FROM communication_history ORDER BY sent_at DESC LIMIT 10;
```

### 2. Test API Endpoints
```bash
# Get templates
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/communication/templates?type=SMS

# Get variables
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/communication/variables

# Get series
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/communication/series

# Send messages
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"SMS","template_id":1,"series_ids":[1,2]}' \
  http://localhost:8000/communication/send
```

### 3. Test Frontend
1. Login to application
2. Go to Communication page
3. Select SMS or Email
4. Select a template
5. Select series
6. Click Send
7. Check communication history

---

## Maintenance

### Adding New Templates
```sql
INSERT INTO communication_templates (name, type, subject, content, created_by) 
VALUES (
  'New Template Name',
  'SMS',
  NULL,
  'Dear {InvestorName}, your message here...',
  'Admin'
);
```

### Adding New Variables
```sql
INSERT INTO communication_variables (variable_name, display_name, description, example_value) 
VALUES (
  '{NewVariable}',
  'New Variable',
  'Description of what this variable does',
  'Example Value'
);
```

### Deactivating Templates
```sql
UPDATE communication_templates 
SET is_active = FALSE 
WHERE id = 1;
```

---

## Comparison: Old vs New

| Feature | Old System | New System |
|---------|-----------|------------|
| **Logic Location** | Frontend + Backend | Backend Only |
| **Templates** | Hardcoded in Frontend | Database |
| **Variables** | Hardcoded in Frontend | Database |
| **State Management** | Complex (Maps, Sets) | Simple (Arrays) |
| **Security** | Medium | High |
| **Maintainability** | Hard | Easy |
| **Attack Surface** | Large | Small |
| **Code Lines** | ~1000+ | ~500 |
| **Complexity** | High | Low |

---

## Summary

This new system is:
1. ✅ **Simpler** - Less code, easier to understand
2. ✅ **Safer** - All logic in backend, attack-proof
3. ✅ **Maintainable** - One source of truth
4. ✅ **Database-driven** - Templates and variables in MySQL
5. ✅ **Scalable** - Easy to add new features

The frontend is now just a UI that displays data and sends simple requests. All the heavy lifting, validation, and business logic is in the backend where it belongs.
