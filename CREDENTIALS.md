# 🔐 NCD Management System - Login Credentials

## Admin User (Backend Database)
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Super Admin
- **User ID:** ADMIN001
- **Email:** admin@ncdmanagement.com
- **Phone:** +91 9999999999

## Database Credentials
- **Database:** ncd_management
- **Host:** localhost
- **Port:** 3306
- **Username:** root
- **Password:** sowmith

## Demo/Fallback Accounts (Frontend Only)
These work when backend is not available:

### Super Admin Accounts
- `subbireddy` / `subbireddy`
- `super_admin` / `super_admin`

### Other Role Accounts
- `demo` / `demo` (Admin)
- `finance_manager` / `finance_manager` (Finance Manager)
- `compliance_manager` / `compliance_manager` (Compliance Manager)
- `board_member` / `board_member` (Board Member Base)
- `finance_executive` / `financeexecutive` (Finance Executive)
- `investor` / `investor` (Investor)
- `sowmith` / `sowmith` (Investor)

## Server URLs
- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## How to Start Backend
1. Open terminal/command prompt
2. Navigate to project folder
3. Run: `cd backend`
4. Run: `python start_server.py`
5. Backend will start on http://localhost:8000

## How to Start Frontend
1. Open another terminal/command prompt
2. Navigate to project folder
3. Run: `cd ncd-vite`
4. Run: `npm run dev`
5. Frontend will start on http://localhost:5175

## Testing the Integration
1. Start both backend and frontend
2. Go to http://localhost:5175
3. Login with `admin` / `admin123`
4. Go to Administrator page
5. Create/edit/delete users - all data will be saved to MySQL database!