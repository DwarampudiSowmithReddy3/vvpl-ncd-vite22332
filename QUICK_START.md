# Quick Start Guide - NCD Management System

## 🚀 Starting the Application

### Step 1: Start the Backend (Port 8003)

**Option A: Using the simple batch file (Windows)**
```bash
start-backend-simple.bat
```

**Option B: Manual start**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend will start on: **http://localhost:8003**

### Step 2: Start the Frontend (Port 5173)

Open a **new terminal** and run:
```bash
npm install
npm run dev
```

The frontend will start on: **http://localhost:5173**

---

## ✅ What Was Fixed

1. **Icon Import Error**: Fixed `LuCircleCheckBig` → `LuCheckCircle2` in Dashboard.jsx
2. **Backend Port**: Updated main.py to run on port 8003 (matching frontend)
3. **Error Handling**: Frontend now works even if backend is not running
4. **Async Login**: Fixed async/await in Login component
5. **Duplicate Keys**: Removed duplicate keys in DataContext

---

## 🔍 Troubleshooting

### Backend won't start?
- Make sure Python 3.8+ is installed
- Install dependencies: `pip install -r backend/requirements.txt`
- Check if port 8003 is already in use

### Frontend shows white screen?
- Open browser console (F12) and check for errors
- Make sure backend is running on port 8003
- Clear browser cache: `localStorage.clear()` in console

### Connection refused?
- Verify backend is running: Visit http://localhost:8003/health
- Check CORS settings in backend/config.py
- Ensure both frontend and backend are running

---

## 📝 Default Login Credentials

Check the README.md for default user credentials.

---

## 🎯 Next Steps

1. Start backend first (port 8003)
2. Start frontend second (port 5173)
3. Open http://localhost:5173/login
4. Login with your credentials

---

**Note**: The frontend will work even if the backend is not running (you'll see API errors in console, but the UI will still render).
