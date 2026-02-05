# 🏢 Enterprise Deployment Guide - NCD Management System

## 🎯 **Architecture Overview**

```
Central SQL Server (192.168.1.100)
    ↑
    ├── Employee 1 Workstation → Frontend + FastAPI → Central DB
    ├── Employee 2 Workstation → Frontend + FastAPI → Central DB  
    ├── Employee 3 Workstation → Frontend + FastAPI → Central DB
    └── Employee N Workstation → Frontend + FastAPI → Central DB
```

**Key Benefits:**
- ✅ **Centralized Data**: All employees share the same database
- ✅ **Real-time Updates**: Changes are instantly visible to all users
- ✅ **Data Consistency**: Single source of truth
- ✅ **Audit Trail**: Track who made what changes
- ✅ **Scalable**: Add new employees easily

## 🗄️ **Step 1: Central SQL Server Setup**

### **On the Database Server Machine:**

1. **Install SQL Server 2019/2022**
   - Download from Microsoft
   - Choose "Mixed Mode Authentication"
   - Set strong SA password

2. **Run the Enterprise Setup Script**
   ```sql
   -- Open SQL Server Management Studio (SSMS)
   -- Connect to your SQL Server
   -- Open and execute: backend/enterprise_sql_setup.sql
   ```

3. **Configure Network Access**
   ```cmd
   -- Enable TCP/IP Protocol
   -- Open SQL Server Configuration Manager
   -- SQL Server Network Configuration > Protocols > TCP/IP = Enabled
   -- Restart SQL Server Service
   
   -- Configure Firewall
   netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433
   ```

4. **Test Connection**
   ```cmd
   -- From another machine, test connection:
   telnet 192.168.1.100 1433
   ```

## 💻 **Step 2: Employee Workstation Setup**

### **On Each Employee's Computer:**

1. **Install Prerequisites**
   ```bash
   # Install Node.js (for frontend)
   # Download from: https://nodejs.org/
   
   # Install Python 3.9+ (for backend)
   # Download from: https://python.org/
   
   # Install ODBC Driver 17 for SQL Server
   # Download from: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   ```

2. **Clone/Copy the Application**
   ```bash
   # Copy the entire project folder to each workstation
   # Or use Git if you have a repository
   git clone your-repo-url
   cd ncd-management-system
   ```

3. **Configure Database Connection**
   ```bash
   # Update backend/.env with central server details
   cd backend
   cp .env.example .env
   ```
   
   **Edit `backend/.env`:**
   ```env
   SQL_SERVER=192.168.1.100
   SQL_DATABASE=NCDManagement
   SQL_USERNAME=ncd_user
   SQL_PASSWORD=NCD@Enterprise2024!
   ```

4. **Install Dependencies**
   ```bash
   # Backend dependencies
   cd backend
   pip install -r requirements_sqlserver.txt
   
   # Frontend dependencies
   cd ../
   npm install
   ```

5. **Test Database Connection**
   ```bash
   cd backend
   python -c "
   import pyodbc
   try:
       conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=192.168.1.100;DATABASE=NCDManagement;UID=ncd_user;PWD=NCD@Enterprise2024!')
       print('✅ Connection successful!')
       conn.close()
   except Exception as e:
       print(f'❌ Connection failed: {e}')
   "
   ```

## 🚀 **Step 3: Running the Application**

### **On Each Employee Workstation:**

1. **Start Backend Server**
   ```bash
   cd backend
   python enterprise_server.py
   ```
   - Backend runs on: http://localhost:8001
   - API Docs: http://localhost:8001/docs

2. **Start Frontend (in new terminal)**
   ```bash
   npm run dev
   ```
   - Frontend runs on: http://localhost:3000

3. **Login**
   - Username: `admin`
   - Password: `admin123`

## 👥 **Step 4: User Management**

### **Create Employee Accounts**

1. **Login as admin**
2. **Go to Administration > Users**
3. **Add new users for each employee:**
   ```
   Employee 1: john.doe / password123
   Employee 2: jane.smith / password123
   Employee 3: mike.wilson / password123
   ```

### **Role-Based Access**
- **Super Admin**: Full access (admin user)
- **Admin**: Most features, limited user management
- **User**: Read-only access to most features
- **Viewer**: Dashboard and reports only

## 🔒 **Step 5: Security Configuration**

### **Network Security**
```bash
# On SQL Server machine, restrict access to specific IPs
netsh advfirewall firewall set rule name="SQL Server" new remoteip=192.168.1.0/24
```

### **Database Security**
```sql
-- Create role-based access
USE NCDManagement;
GO

-- Create roles
CREATE ROLE ncd_readonly;
CREATE ROLE ncd_dataentry;
CREATE ROLE ncd_manager;

-- Grant permissions
GRANT SELECT ON SCHEMA::dbo TO ncd_readonly;
GRANT SELECT, INSERT, UPDATE ON SCHEMA::dbo TO ncd_dataentry;
GRANT ALL ON SCHEMA::dbo TO ncd_manager;
```

### **Application Security**
- Change default passwords
- Use strong JWT secret keys
- Enable HTTPS in production
- Regular security updates

## 📊 **Step 6: Monitoring & Maintenance**

### **Database Monitoring**
```sql
-- Monitor active connections
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    login_time,
    last_request_start_time
FROM sys.dm_exec_sessions 
WHERE database_id = DB_ID('NCDManagement');
```

### **Application Monitoring**
- Check server logs: `backend/logs/`
- Monitor API health: `http://localhost:8001/health`
- Database connection test: `http://localhost:8001/api/v1/test-connection`

### **Backup Strategy**
```sql
-- Daily backup script
BACKUP DATABASE NCDManagement 
TO DISK = 'C:\Backups\NCDManagement_' + FORMAT(GETDATE(), 'yyyyMMdd') + '.bak'
WITH COMPRESSION, CHECKSUM;
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Cannot connect to SQL Server"**
   - Check SQL Server is running
   - Verify TCP/IP is enabled
   - Check firewall settings
   - Test with `telnet server-ip 1433`

2. **"Login failed for user"**
   - Verify username/password
   - Check user exists in SQL Server
   - Ensure Mixed Mode Authentication is enabled

3. **"ODBC Driver not found"**
   - Install ODBC Driver 17 for SQL Server
   - Restart application after installation

4. **"CORS Error"**
   - Update CORS_ORIGINS in backend/.env
   - Include all employee workstation IPs

### **Network Troubleshooting**
```bash
# Test network connectivity
ping 192.168.1.100

# Test SQL Server port
telnet 192.168.1.100 1433

# Check DNS resolution
nslookup your-sql-server-name
```

## 📋 **Deployment Checklist**

### **Database Server:**
- [ ] SQL Server installed and configured
- [ ] Mixed Mode Authentication enabled
- [ ] TCP/IP protocol enabled
- [ ] Firewall configured (port 1433)
- [ ] Enterprise setup script executed
- [ ] Database user created
- [ ] Backup strategy implemented

### **Each Employee Workstation:**
- [ ] Prerequisites installed (Node.js, Python, ODBC Driver)
- [ ] Application files copied
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database connection configured
- [ ] Connection tested successfully
- [ ] Application starts without errors

### **Security:**
- [ ] Default passwords changed
- [ ] Strong JWT secret configured
- [ ] Network access restricted
- [ ] User accounts created
- [ ] Role-based permissions set

### **Testing:**
- [ ] Login functionality works
- [ ] Data is shared between workstations
- [ ] Real-time updates visible
- [ ] All features accessible
- [ ] Performance is acceptable

## 🎯 **Production Considerations**

1. **Performance Optimization**
   - Configure SQL Server memory settings
   - Set up proper indexes
   - Monitor query performance

2. **High Availability**
   - Consider SQL Server clustering
   - Implement failover strategies
   - Regular backup testing

3. **Scalability**
   - Monitor concurrent connections
   - Consider connection pooling
   - Plan for growth

4. **Compliance**
   - Enable audit logging
   - Regular security reviews
   - Data retention policies

## ✅ **Success Verification**

Your enterprise deployment is successful when:
- ✅ All employees can login from their workstations
- ✅ Data changes are visible to all users immediately
- ✅ No connection errors in logs
- ✅ Performance is acceptable for all users
- ✅ Backup and monitoring systems are working

**Your NCD Management System is now ready for enterprise use!**

## 📞 **Support**

For technical support:
1. Check application logs
2. Verify database connectivity
3. Review this deployment guide
4. Contact your system administrator

**Enterprise deployment completed successfully! 🎉**