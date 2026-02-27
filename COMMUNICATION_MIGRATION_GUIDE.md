# Communication System Migration Guide

## 🎯 Goal
Replace the complex communication system with a simple, secure, backend-driven system.

---

## ⚠️ IMPORTANT: Read This First

**The old system was too complex:**
- Frontend had too much logic
- State management was complicated (Maps, Sets, complex arrays)
- Templates hardcoded in frontend
- Security risks - frontend could manipulate data
- Hard to maintain

**The new system is simple:**
- ALL logic in backend
- Frontend is just UI
- Templates in database
- Attack-proof
- Easy to maintain

---

## 📋 Migration Steps

### Step 1: Create Database Tables (5 minutes)

Run this SQL file to create the new tables:

```bash
cd backend
mysql -u root -p ncd_management < COMMUNICATION_TABLES.sql
```

This creates:
- `communication_templates` - Stores SMS/Email templates
- `communication_variables` - Stores available variables
- Inserts default templates and variables

**Verify:**
```sql
USE ncd_management;
SELECT * FROM communication_templates;
SELECT * FROM communication_variables;
```

You should see 6 templates (3 SMS, 3 Email) and 7 variables.

---

### Step 2: Update Backend Configuration (2 minutes)

Edit `backend/.env` and replace dummy values with real ones:

```env
# Kaleyra SMS Configuration
KALEYRA_API_KEY=your_real_api_key_here
KALEYRA_SID=your_real_sid_here
KALEYRA_SENDER_ID=your_real_sender_id_here
KALEYRA_API_URL=https://api.kaleyra.io/v1/

# SMTP Email Configuration
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_email@domain.com
VITE_SMTP_PASSWORD=your_app_password_here
```

**Note:** For Gmail, you need an "App Password", not your regular password.

---

### Step 3: Update Backend Routes (3 minutes)

Edit `backend/main.py`:

**Find this line:**
```python
from routes import communication
```

**Replace with:**
```python
from routes import communication_simple
```

**Find this line:**
```python
app.include_router(communication.route