# Communication Templates - Database Setup

## What Changed?

Previously, message templates were **hardcoded in the frontend** (Communication.jsx). Now they are stored in the **database** and fetched from the backend.

---

## Changes Made

### 1. Backend Changes

**File: `backend/routes/communication.py`**

Added 3 new endpoints:

1. **GET `/communication/templates`** - Fetch all templates from database
   - Optional parameter: `type` (SMS or Email)
   - Returns: List of templates with id, name, type, subject, content

2. **GET `/communication/variables`** - Fetch all available variables
   - Returns: List of variables like {InvestorName}, {Amount}, etc.

3. Existing endpoints remain unchanged

### 2. Frontend Changes

**File: `frontend/src/pages/Communication.jsx`**

- **Removed**: Hardcoded `smsTemplates` and `emailTemplates` arrays
- **Added**: State variables to store templates from backend:
  - `smsTemplates` - Fetched from backend
  - `emailTemplates` - Fetched from backend
  - `availableVariables` - Fetched from backend

- **Added**: `useEffect` hook to fetch templates on component mount
- **Updated**: Variable helper section to dynamically display variables from backend

**File: `frontend/src/services/api.js`**

Added 2 new API methods:
- `getCommunicationTemplates(type)` - Fetch templates
- `getCommunicationVariables()` - Fetch variables

### 3. Database Tables

**Table 1: `communication_templates`**
```sql
- id (Primary Key)
- name (Template name)
- type (SMS or Email)
- subject (For emails only)
- content (Template text with variables)
- is_active (Boolean)
- created_at, updated_at
- created_by
```

**Table 2: `communication_variables`**
```sql
- id (Primary Key)
- variable_name (e.g., {InvestorName})
- display_name (Human-readable name)
- description (What this variable does)
- example_value (Sample value)
- is_active (Boolean)
- created_at
```

---

## How to Setup

### Step 1: Run the SQL Script

**Option A: Using the Batch File (Easiest)**
```bash
# Double-click this file:
CREATE_COMMUNICATION_TEMPLATES.bat

# Enter your MySQL credentials when prompted
```

**Option B: Manual MySQL Command**
```bash
mysql -u root -p ncd_management < backend/CREATE_COMMUNICATION_TEMPLATES.sql
```

**Option C: MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your database
3. Open file: `backend/CREATE_COMMUNICATION_TEMPLATES.sql`
4. Click "Execute" (⚡ icon)

### Step 2: Verify Tables Created

Run this query in MySQL:
```sql
USE ncd_management;

-- Check templates
SELECT * FROM communication_templates WHERE is_active = TRUE;

-- Check variables
SELECT * FROM communication_variables WHERE is_active = TRUE;
```

You should see:
- **6 templates** (3 SMS + 3 Email)
- **7 variables** ({InvestorName}, {InvestorID}, etc.)

### Step 3: Restart Backend

```bash
# Stop the backend (Ctrl+C)
# Then restart:
START_BACKEND.bat
```

### Step 4: Test in Frontend

1. Open the application
2. Go to **Communication Center**
3. Click **"Quick Templates:"** dropdown
4. You should see templates from the database:
   - Interest Payment Notification
   - Payment Confirmation
   - General Update

---

## Default Templates Included

### SMS Templates

1. **Interest Payment Notification**
   ```
   Dear {InvestorName}, your interest of {Amount} for {SeriesName} 
   has been processed to account {BankAccountNumber}. - VVPL
   ```

2. **Payment Confirmation**
   ```
   Dear {InvestorName}, payment of {Amount} for {SeriesName} confirmed. 
   Investor ID: {InvestorID}. Thank you - VVPL
   ```

3. **General Update**
   ```
   Dear {InvestorName}, important update regarding {SeriesName}. 
   Please contact us for details. - VVPL
   ```

### Email Templates

1. **Interest Payment Notification**
   - Subject: Interest Payment Processed - {SeriesName}
   - Full formatted email body

2. **Payment Confirmation**
   - Subject: Payment Confirmation - {SeriesName}
   - Full formatted email body

3. **General Update**
   - Subject: Important Update - {SeriesName}
   - Full formatted email body

---

## Available Variables

All these variables can be used in templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{InvestorName}` | Full name of investor | Rajesh Kumar |
| `{InvestorID}` | Unique investor ID | INV001 |
| `{SeriesName}` | NCD series name | Series A - 2024 |
| `{Amount}` | Payment/investment amount | ₹10,000 |
| `{BankAccountNumber}` | Bank account number | XXXX1234 |
| `{InterestMonth}` | Interest payment month | January 2024 |
| `{Status}` | Transaction status | has been |

---

## How to Add New Templates

### Option 1: Direct SQL Insert

```sql
INSERT INTO communication_templates (name, type, subject, content, created_by) 
VALUES (
    'New Template Name',
    'SMS',  -- or 'Email'
    NULL,   -- Subject (only for Email)
    'Dear {InvestorName}, your message here...',
    'Admin'
);
```

### Option 2: Future Admin Panel (To Be Built)

In the future, you can add a template management page where admins can:
- Create new templates
- Edit existing templates
- Activate/deactivate templates
- Preview templates with sample data

---

## Benefits of Database Templates

✅ **No Code Changes**: Add/edit templates without touching code
✅ **Centralized**: All templates in one place
✅ **Version Control**: Track changes with created_at/updated_at
✅ **Easy Management**: Can build admin UI to manage templates
✅ **Consistent**: Same templates across all users
✅ **Scalable**: Easy to add more templates as needed

---

## Troubleshooting

### Templates Not Showing in Dropdown

1. **Check if tables exist:**
   ```sql
   SHOW TABLES LIKE 'communication_%';
   ```

2. **Check if templates exist:**
   ```sql
   SELECT * FROM communication_templates WHERE is_active = TRUE;
   ```

3. **Check backend logs:**
   - Look for "Fetching communication templates" in console
   - Check for any errors

4. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for API calls to `/communication/templates`
   - Check for any errors

### Backend Error: "Table doesn't exist"

Run the SQL script again:
```bash
CREATE_COMMUNICATION_TEMPLATES.bat
```

### Frontend Shows Empty Dropdown

1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart frontend: `START_FRONTEND.bat`
3. Check if backend is running on port 8000

---

## Files Modified

### Created:
- `backend/CREATE_COMMUNICATION_TEMPLATES.sql` - SQL script
- `CREATE_COMMUNICATION_TEMPLATES.bat` - Batch file to run SQL
- `COMMUNICATION_TEMPLATES_SETUP.md` - This documentation

### Modified:
- `backend/routes/communication.py` - Added 2 new endpoints
- `frontend/src/services/api.js` - Added 2 new API methods
- `frontend/src/pages/Communication.jsx` - Fetch templates from backend

---

## Next Steps (Optional Enhancements)

1. **Template Management Page**: Build admin UI to manage templates
2. **Template Categories**: Add categories for better organization
3. **Template Preview**: Show preview with sample data
4. **Template Versioning**: Track template changes over time
5. **Template Analytics**: Track which templates are used most

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify MySQL is running
3. Check backend logs for errors
4. Check browser console for frontend errors

---

**Status: ✅ COMPLETE**

Templates are now stored in the database and fetched dynamically!
