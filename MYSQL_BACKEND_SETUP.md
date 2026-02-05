# MySQL Backend Setup Guide

## Overview
Your NCD Management System backend has been successfully converted from SQL Server to MySQL as requested by your boss. This guide will help you set up and deploy the MySQL backend.

## 🎯 What's Been Done

### ✅ Completed Tasks
1. **Database Conversion**: Converted from SQL Server to MySQL
2. **Schema Migration**: All 7 tables converted to MySQL syntax
3. **API Updates**: FastAPI backend now uses `mysql-connector-python`
4. **Dummy Data**: All sample data converted to MySQL format
5. **Authentication**: JWT authentication with admin/admin123 login
6. **Requirements**: Created MySQL-specific requirements file

### 📁 New Files Created
- `backend/mysql_setup.sql` - Complete MySQL database schema
- `backend/mysql_api.py` - FastAPI server with MySQL integration
- `backend/requirements_mysql.txt` - MySQL Python dependencies
- `backend/.env.mysql` - MySQL environment configuration
- `backend/setup_mysql.py` - Automated setup script
- `backend/test_mysql_api.py` - API testing script

## 🚀 Quick Start

### Step 1: Install MySQL Server
```bash
# Windows (using Chocolatey)
choco install mysql

# Or download from: https://dev.mysql.com/downloads/mysql/
```

### Step 2: Start MySQL Service
```bash
# Windows
net start mysql

# Set root password (if not set)
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
```

### Step 3: Run Automated Setup
```bash
cd backend
python setup_mysql.py
```

This script will:
- ✅ Check MySQL connection
- ✅ Create NCDManagement database
- ✅ Install Python requirements
- ✅ Set up database schema and sample data
- ✅ Start the FastAPI server

### Step 4: Test the API
```bash
# In another terminal
cd backend
python test_mysql_api.py
```

## 📊 Database Schema

### Tables Created (7 total)
1. **admin_users** - System administrators (5 users)
2. **ncd_series** - NCD series data (5 series, ₹65 Crores)
3. **investors** - Investor information (10 investors, ₹22.6 Crores)
4. **interest_payouts** - Interest payment records (15 payouts)
5. **grievances** - Customer grievances (8 grievances)
6. **reports** - Generated reports (8 reports)
7. **audit_log** - System audit trail (5 entries)

### Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `super_admin`

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user info

### Dashboard
- `GET /api/v1/dashboard/metrics` - Dashboard statistics
- `GET /api/v1/dashboard/recent-activities` - Recent activities

### Data Management
- `GET /api/v1/series/` - All NCD series
- `GET /api/v1/investors/` - All investors
- `GET /api/v1/interest/payouts` - Interest payouts
- `GET /api/v1/grievance/investor` - Grievances
- `GET /api/v1/reports/` - Reports

### System
- `GET /health` - Health check
- `GET /docs` - API documentation

## 🔧 Manual Setup (Alternative)

If the automated setup doesn't work:

### 1. Install Requirements
```bash
pip install -r backend/requirements_mysql.txt
```

### 2. Create Database
```sql
CREATE DATABASE NCDManagement;
USE NCDManagement;
```

### 3. Run SQL Setup
```bash
mysql -u root -p NCDManagement < backend/mysql_setup.sql
```

### 4. Update Environment
Edit `backend/.env.mysql` with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_DATABASE=NCDManagement
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_PORT=3306
```

### 5. Start Server
```bash
cd backend
python mysql_api.py
```

## 🌍 Cloud Deployment Options

For your company deployment with a single URL:

### Option 1: Railway (Recommended)
1. Create account at railway.app
2. Connect your GitHub repository
3. Add MySQL database service
4. Deploy FastAPI service
5. Get single URL: `https://your-app.railway.app`

### Option 2: Heroku + ClearDB
1. Create Heroku app
2. Add ClearDB MySQL addon
3. Deploy FastAPI app
4. Get URL: `https://your-app.herokuapp.com`

### Option 3: DigitalOcean App Platform
1. Create DigitalOcean account
2. Use App Platform with MySQL database
3. Deploy from GitHub
4. Get URL: `https://your-app.ondigitalocean.app`

## 📋 Deployment Checklist

### Before Deployment
- [ ] MySQL backend tested locally
- [ ] All API endpoints working
- [ ] Frontend still working (unchanged)
- [ ] Environment variables configured
- [ ] Database credentials secured

### For Company Handover
- [ ] Cloud database set up
- [ ] Application deployed to cloud
- [ ] Single URL provided
- [ ] Login credentials documented
- [ ] API documentation accessible

## 🔒 Security Notes

### Production Security
1. **Change default passwords**
2. **Use environment variables for secrets**
3. **Enable HTTPS in production**
4. **Restrict database access**
5. **Use strong JWT secret key**

### Environment Variables for Production
```env
MYSQL_HOST=your-cloud-db-host
MYSQL_DATABASE=NCDManagement
MYSQL_USER=your-db-user
MYSQL_PASSWORD=your-secure-password
JWT_SECRET_KEY=your-super-secret-jwt-key
```

## 🆘 Troubleshooting

### Common Issues

#### MySQL Connection Failed
```bash
# Check if MySQL is running
net start mysql

# Check credentials
mysql -u root -p
```

#### Port Already in Use
```bash
# Kill process on port 8002
netstat -ano | findstr :8002
taskkill /PID <process_id> /F
```

#### Requirements Installation Failed
```bash
# Upgrade pip first
python -m pip install --upgrade pip
pip install -r backend/requirements_mysql.txt
```

## 📞 Support

### API Testing
- Health Check: `http://localhost:8002/health`
- API Docs: `http://localhost:8002/docs`
- Test Login: Use `admin/admin123`

### Database Access
```bash
mysql -u root -p NCDManagement
SHOW TABLES;
SELECT COUNT(*) FROM admin_users;
```

## ✅ Success Confirmation

Your MySQL backend is ready when:
1. ✅ Health check returns "healthy"
2. ✅ Login with admin/admin123 works
3. ✅ Dashboard metrics show data
4. ✅ All API endpoints respond
5. ✅ Frontend still works unchanged

## 🎉 Next Steps

1. **Test locally** - Ensure everything works
2. **Choose cloud provider** - Railway/Heroku/DigitalOcean
3. **Deploy to cloud** - Get single URL
4. **Update frontend** - Point to cloud API (if needed)
5. **Handover to company** - Provide URL and credentials

Your boss will be happy with the MySQL backend! 🚀