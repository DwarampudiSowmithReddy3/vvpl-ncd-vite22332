# 🗄️ SQL Server Integration Guide - NCD Management System

## 📋 **Prerequisites**

### **1. SQL Server Installation**
- **SQL Server 2019/2022** (Express, Standard, or Enterprise)
- **SQL Server Management Studio (SSMS)** (recommended)
- **ODBC Driver 17 for SQL Server** (required)

### **2. Python Dependencies**
```bash
cd backend
pip install -r requirements_sqlserver.txt
```

## 🔧 **SQL Server Setup**

### **Step 1: Create Database**
```sql
-- Connect to SQL Server using SSMS or sqlcmd
CREATE DATABASE NCDManagement;
GO

USE NCDManagement;
GO
```

### **Step 2: Create SQL Server User (Optional)**
```sql
-- Create a dedicated user for the application
CREATE LOGIN ncd_user WITH PASSWORD = 'NCD@2024!';
GO

USE NCDManagement;
GO

CREATE USER ncd_user FOR LOGIN ncd_user;
GO

-- Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER ncd_user;
ALTER ROLE db_datawriter ADD MEMBER ncd_user;
ALTER ROLE db_ddladmin ADD MEMBER ncd_user;
GO
```

### **Step 3: Configure Connection**
Copy and update the environment file:
```bash
cp backend/.env.sqlserver backend/.env
```

Edit `backend/.env` with your SQL Server details:
```env
# For SQL Server Authentication
SQL_SERVER=localhost
SQL_DATABASE=NCDManagement
SQL_USERNAME=ncd_user
SQL_PASSWORD=NCD@2024!
SQL_TRUSTED_CONNECTION=no

# For Windows Authentication (if preferred)
# SQL_TRUSTED_CONNECTION=yes
```

## 🚀 **Running the Application**

### **Step 1: Install ODBC Driver**
Download and install **ODBC Driver 17 for SQL Server** from Microsoft:
- Windows: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
- Linux: Follow Microsoft's installation guide

### **Step 2: Test Database Connection**
```bash
cd backend
python -c "
import pyodbc
try:
    conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=NCDManagement;UID=ncd_user;PWD=NCD@2024!')
    print('✅ SQL Server connection successful!')
    conn.close()
except Exception as e:
    print(f'❌ Connection failed: {e}')
"
```

### **Step 3: Start the FastAPI Server**
```bash
cd backend
python sql_server_api.py
```

The server will:
- ✅ Connect to SQL Server
- ✅ Create all necessary tables
- ✅ Insert sample data
- ✅ Start API server on http://localhost:8001

## 📊 **Database Schema**

The application will automatically create these tables:

### **admin_users**
```sql
CREATE TABLE admin_users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    hashed_password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'admin',
    status NVARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT GETDATE(),
    last_login DATETIME,
    failed_login_attempts INT DEFAULT 0
);
```

### **ncd_series**
```sql
CREATE TABLE ncd_series (
    id INT IDENTITY(1,1) PRIMARY KEY,
    series_name NVARCHAR(100) NOT NULL,
    series_code NVARCHAR(20) UNIQUE NOT NULL,
    issue_size DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    interest_frequency NVARCHAR(20) NOT NULL,
    tenure_years INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active',
    total_subscribed DECIMAL(15,2) DEFAULT 0,
    total_allotted DECIMAL(15,2) DEFAULT 0,
    maturity_date DATE,
    created_at DATETIME DEFAULT GETDATE()
);
```

### **investors**
```sql
CREATE TABLE investors (
    id INT IDENTITY(1,1) PRIMARY KEY,
    investor_id NVARCHAR(20) UNIQUE NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    phone NVARCHAR(15) NOT NULL,
    pan_number NVARCHAR(10) NOT NULL,
    total_investments DECIMAL(15,2) DEFAULT 0,
    active_investments INT DEFAULT 0,
    kyc_status NVARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT GETDATE()
);
```

### **interest_payouts**
```sql
CREATE TABLE interest_payouts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    payout_id NVARCHAR(20) UNIQUE NOT NULL,
    series_name NVARCHAR(100) NOT NULL,
    investor_name NVARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payout_date DATE NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT GETDATE()
);
```

### **grievances**
```sql
CREATE TABLE grievances (
    id INT IDENTITY(1,1) PRIMARY KEY,
    grievance_id NVARCHAR(20) UNIQUE NOT NULL,
    investor_name NVARCHAR(100) NOT NULL,
    subject NVARCHAR(200) NOT NULL,
    description NTEXT,
    status NVARCHAR(20) NOT NULL DEFAULT 'open',
    priority NVARCHAR(20) NOT NULL DEFAULT 'medium',
    created_at DATETIME DEFAULT GETDATE()
);
```

### **reports**
```sql
CREATE TABLE reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    report_id NVARCHAR(20) UNIQUE NOT NULL,
    report_name NVARCHAR(200) NOT NULL,
    report_type NVARCHAR(50) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    file_path NVARCHAR(500),
    generated_at DATETIME DEFAULT GETDATE()
);
```

## 🧪 **Testing the Integration**

### **1. Test Database Connection**
```bash
curl http://localhost:8001/api/v1/test-db
```

### **2. Test Authentication**
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","user_type":"admin"}'
```

### **3. Test API Endpoints**
```bash
# Get JWT token first, then:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8001/api/v1/dashboard/metrics
```

## 📈 **Sample Data**

The application automatically creates:
- **1 Admin User**: admin/admin123
- **3 NCD Series**: ₹22.5 Crores total
- **5 Investors**: ₹28 Lakhs investments
- **5 Interest Payouts**: Various statuses
- **4 Grievances**: Different priorities
- **4 Reports**: Multiple types

## 🔧 **Configuration Options**

### **Connection String Formats**

**SQL Server Authentication:**
```
DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=NCDManagement;UID=username;PWD=password;
```

**Windows Authentication:**
```
DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=NCDManagement;Trusted_Connection=yes;
```

**Named Instance:**
```
DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost\SQLEXPRESS;DATABASE=NCDManagement;UID=username;PWD=password;
```

**Remote Server:**
```
DRIVER={ODBC Driver 17 for SQL Server};SERVER=192.168.1.100,1433;DATABASE=NCDManagement;UID=username;PWD=password;
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **ODBC Driver Not Found**
   ```
   Error: [Microsoft][ODBC Driver Manager] Data source name not found
   ```
   **Solution**: Install ODBC Driver 17 for SQL Server

2. **Connection Timeout**
   ```
   Error: [Microsoft][ODBC SQL Server Driver][DBNETLIB]SQL Server does not exist
   ```
   **Solution**: Check server name, port, and firewall settings

3. **Authentication Failed**
   ```
   Error: Login failed for user 'username'
   ```
   **Solution**: Verify username/password or use Windows Authentication

4. **Database Not Found**
   ```
   Error: Cannot open database "NCDManagement"
   ```
   **Solution**: Create the database first using SSMS

### **Enable SQL Server TCP/IP (if needed):**
1. Open **SQL Server Configuration Manager**
2. Go to **SQL Server Network Configuration**
3. Enable **TCP/IP** protocol
4. Restart **SQL Server** service

## 🎯 **Production Considerations**

1. **Security**: Use strong passwords and dedicated service accounts
2. **Backup**: Implement regular database backups
3. **Monitoring**: Set up SQL Server monitoring and alerts
4. **Performance**: Configure appropriate indexes and query optimization
5. **Scaling**: Consider connection pooling for high-load scenarios

## ✅ **Verification Checklist**

- [ ] SQL Server installed and running
- [ ] ODBC Driver 17 installed
- [ ] Database created
- [ ] User credentials configured
- [ ] Python dependencies installed
- [ ] Environment variables set
- [ ] FastAPI server starts successfully
- [ ] Database tables created automatically
- [ ] Sample data inserted
- [ ] API endpoints responding
- [ ] JWT authentication working

**Your NCD Management System is now running with SQL Server!**