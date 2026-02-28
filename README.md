# NCD Management System

A comprehensive system for managing Non-Convertible Debentures (NCDs).

## Quick Start

1. **Install Dependencies**
   ```bash
   scripts\INSTALL_DEPENDENCIES.bat
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE ncd_management;
   ```

3. **Configure Environment**
   - Edit `backend\.env` with your database credentials

4. **Start Backend**
   ```bash
   scripts\START_BACKEND.bat
   ```

5. **Start Frontend**
   ```bash
   scripts\START_FRONTEND.bat
   ```

## Default Login

- Username: `admin`
- Password: `admin123`

⚠️ Change password after first login!

## Documentation

See `docs\README.md` for complete documentation.

## Project Structure

```
ncd-vite/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── scripts/          # Startup scripts
├── docs/             # Documentation
├── samples/          # Sample files
└── uploads/          # File uploads
```

## Tech Stack

- Backend: FastAPI + Python
- Frontend: React + Vite
- Database: MySQL + Alembic migrations
