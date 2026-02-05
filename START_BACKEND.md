# 🚀 How to Start the Backend

## Quick Start

### Option 1: Using Batch File (Easiest)
```bash
start-backend-simple.bat
```

### Option 2: Manual Start
```bash
cd backend
python main.py
```

## ✅ What Was Fixed

1. **Added Permissions Endpoint**: `/api/v1/admin/permissions` now exists
2. **Fixed Config Validation**: Updated Settings class to ignore extra .env fields
3. **Backend Port**: Set to 8003 (matching frontend)

## 🔍 Verify Backend is Running

1. Open browser: http://localhost:8003/health
2. Should see: `{"status": "healthy", "service": "ncd-management-backend"}`
3. API Docs: http://localhost:8003/docs

## 📝 Backend Endpoints

- **Health Check**: `GET /health`
- **Login**: `POST /api/v1/auth/login`
- **Permissions**: `GET /api/v1/admin/permissions`
- **Users**: `GET /api/v1/admin/users`
- **Audit Logs**: `GET /api/v1/admin/audit-logs`

## ⚠️ Troubleshooting

### Port Already in Use?
```bash
# Find process using port 8003
netstat -ano | findstr :8003

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Database Errors?
- SQLite database will be created automatically at `backend/ncd_management.db`
- No setup needed for SQLite

### Import Errors?
```bash
cd backend
pip install -r requirements.txt
```

---

**The backend should now start successfully!** 🎉
