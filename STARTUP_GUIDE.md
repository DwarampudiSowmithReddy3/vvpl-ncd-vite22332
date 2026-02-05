# 🚀 NCD Management System - Startup Guide

## **QUICK START OPTIONS**

### **Option 1: Start Everything Together (Recommended)**
```bash
npm run start:full
```
**This starts both frontend and backend simultaneously!**

### **Option 2: Start Backend Only**
```bash
npm run backend
```
**Or:**
```bash
npm run start:backend
```

### **Option 3: Manual Startup (Traditional)**
**Terminal 1 (Backend):**
```bash
cd backend
python mysql_api.py
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

### **Option 4: Windows Batch File**
**Double-click:** `start-backend.bat`

### **Option 5: PowerShell Script**
```powershell
.\start-backend.ps1
```

---

## **🔧 WHAT EACH STARTUP METHOD INCLUDES:**

### **Backend Components Started:**
- ✅ **FastAPI Server** (Port 8002)
- ✅ **MySQL Database Connection**
- ✅ **JWT Authentication System**
- ✅ **CORS Configuration**
- ✅ **Audit Logging**
- ✅ **Role-based Permissions**
- ✅ **API Documentation** (http://localhost:8002/docs)

### **Frontend Components Started:**
- ✅ **React Development Server** (Port 3000)
- ✅ **Vite Hot Reload**
- ✅ **React Router**
- ✅ **Component Hot Refresh**

---

## **📋 STARTUP SEQUENCE**

### **Recommended Development Workflow:**

1. **Start Everything:**
   ```bash
   npm run start:full
   ```

2. **Open Applications:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8002/docs
   - **Health Check:** http://localhost:8002/health

3. **Login Credentials:**
   - **Username:** admin
   - **Password:** admin123

---

## **🛠️ TROUBLESHOOTING**

### **If Backend Fails to Start:**
```bash
# Install backend dependencies
npm run backend:install

# Or manually:
cd backend
pip install -r requirements_mysql.txt
```

### **If MySQL Connection Fails:**
1. **Check MySQL is running**
2. **Verify credentials in backend/.env.mysql**
3. **Check port 3306 is available**

### **If Port 8002 is Busy:**
```bash
# Kill existing process
taskkill /f /im python.exe
# Or find and kill specific process
netstat -ano | findstr :8002
```

### **If Frontend Fails:**
```bash
# Install frontend dependencies
npm install

# Clear cache and restart
npm run dev
```

---

## **🎯 PRODUCTION DEPLOYMENT**

### **Build Frontend:**
```bash
npm run build
```

### **Start Backend in Production:**
```bash
cd backend
python -m uvicorn mysql_api:app --host 0.0.0.0 --port 8002
```

---

## **📊 MONITORING**

### **Check System Health:**
- **Backend Health:** http://localhost:8002/health
- **API Documentation:** http://localhost:8002/docs
- **Frontend:** http://localhost:3000

### **Logs Location:**
- **Backend Logs:** Console output
- **Frontend Logs:** Browser console (F12)
- **Database Logs:** MySQL logs

---

## **🔐 SECURITY NOTES**

- **JWT tokens expire after 24 hours**
- **All API endpoints require authentication**
- **CORS is configured for development**
- **Database passwords should be changed in production**

---

## **💡 DEVELOPMENT TIPS**

### **Hot Reload:**
- **Frontend:** Automatic with Vite
- **Backend:** Restart required for changes

### **API Testing:**
- **Swagger UI:** http://localhost:8002/docs
- **Postman:** Import OpenAPI spec from /docs
- **Browser Console:** Direct fetch() calls

### **Database Management:**
- **MySQL Workbench:** Connect to localhost:3306
- **phpMyAdmin:** If installed
- **Command Line:** mysql -u root -p

---

**🎉 Your NCD Management System is ready for development!**