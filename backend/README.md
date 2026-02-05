# NCD Management System Backend

## Quick Start

### 1. Start the Backend Server
```bash
python start_server.py
```

### 2. Admin Login Credentials
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Super Admin

### 3. Access Points
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## Database Information

### MySQL Database
- **Database Name:** `ncd_management`
- **Host:** localhost
- **Port:** 3306
- **Username:** root
- **Password:** sowmith

### Tables Created
1. **users** - User management with authentication
2. **audit_logs** - System activity logging

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `POST /auth/verify-token` - Verify JWT token

### User Management
- `GET /users/` - Get all users
- `POST /users/` - Create new user
- `GET /users/{id}` - Get specific user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user (soft delete)

### Audit Logs
- `GET /audit/` - Get audit logs
- `POST /audit/` - Create audit log entry
- `GET /audit/count` - Get audit logs count

## Development

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Setup Admin User
```bash
python setup_admin_simple.py
```

### Start Development Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Security Features
- JWT token authentication
- SHA256 password hashing
- CORS configuration
- Input validation
- Soft delete for users

## Troubleshooting

### If Backend Won't Start
1. Check if Python is installed: `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check if MySQL is running
4. Verify database credentials in `.env` file

### If Database Connection Fails
1. Make sure MySQL is running
2. Check database credentials (username: root, password: sowmith)
3. Ensure database `ncd_management` exists
4. Run: `python setup_admin_simple.py` to recreate admin user

### If Frontend Can't Connect
1. Make sure backend is running on port 8000
2. Check CORS settings in `main.py`
3. Verify frontend is running on port 5173, 5174, or 5175