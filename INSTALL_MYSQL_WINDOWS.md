# MySQL Installation Guide for Windows

## Step 1: Install MySQL Server

### Option A: Download MySQL Installer (Recommended)
1. Go to: https://dev.mysql.com/downloads/installer/
2. Download "MySQL Installer for Windows" (mysql-installer-web-community-8.0.xx.x.msi)
3. Run the installer
4. Choose "Developer Default" setup type
5. Set root password as: `password` (or remember your password)
6. Complete the installation

### Option B: Using Chocolatey (if you have it)
```powershell
choco install mysql
```

### Option C: Using Winget
```powershell
winget install Oracle.MySQL
```

## Step 2: Verify MySQL Installation

Open Command Prompt as Administrator and run:
```cmd
mysql --version
```

If this doesn't work, add MySQL to your PATH:
1. Find MySQL installation directory (usually `C:\Program Files\MySQL\MySQL Server 8.0\bin`)
2. Add this path to your Windows PATH environment variable
3. Restart Command Prompt

## Step 3: Start MySQL Service

```cmd
net start mysql
```

## Step 4: Test MySQL Connection

```cmd
mysql -u root -p
```
Enter your password when prompted.

## Step 5: Create Database (Manual Method)

If the automated script doesn't work, you can create the database manually:

```sql
CREATE DATABASE NCDManagement;
USE NCDManagement;
```

Then run the SQL file:
```cmd
mysql -u root -p NCDManagement < mysql_setup.sql
```

## Step 6: Run the Setup Script

Once MySQL is installed and running:
```cmd
cd backend
python setup_mysql.py
```

## Troubleshooting

### MySQL Service Won't Start
```cmd
# Stop the service first
net stop mysql

# Start it again
net start mysql
```

### Can't Connect to MySQL
1. Check if MySQL service is running: `services.msc`
2. Look for "MySQL80" service and start it
3. Verify port 3306 is not blocked by firewall

### Password Issues
If you forgot the root password, you can reset it:
1. Stop MySQL service
2. Start MySQL with skip-grant-tables
3. Reset password
4. Restart MySQL normally

## Quick Test After Installation

Run this to verify everything works:
```cmd
cd backend
python test_mysql_api.py
```

This should show:
- ✅ Health Check: healthy - Database: connected
- ✅ Login Success: admin - super_admin
- ✅ Dashboard Metrics with data