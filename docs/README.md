# NCD Management System

A comprehensive system for managing Non-Convertible Debentures (NCDs) with investor management, compliance tracking, and automated communications.

## Features

- **Investor Management**: Complete investor lifecycle management
- **NCD Series Management**: Create and manage NCD series
- **Compliance Tracking**: Automated compliance monitoring
- **Interest Payouts**: Track and manage interest payments
- **Communication System**: SMS and Email templates
- **Reports & Analytics**: Comprehensive reporting
- **Role-Based Access Control**: Multi-level user permissions

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite
- **Database**: MySQL
- **Migrations**: Pure SQL files

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ncd-vite
   ```

2. **Create MySQL database**
   ```sql
   CREATE DATABASE ncd_management;
   ```

3. **Configure environment**
   
   Edit `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ncd_management
   SECRET_KEY=your_secret_key
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

5. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

### Backend

```bash
START_BACKEND.bat
```

Or manually:
```bash
cd backend
python main.py
```

The backend will:
- Automatically run database migrations
- Create all required tables
- Seed default admin user and templates
- Start API server on http://localhost:8000

### Frontend

```bash
START_FRONTEND.bat
```

Or manually:
```bash
cd frontend
npm run dev
```

Frontend will start on http://localhost:5173

## Default Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **Change the password immediately after first login!**

## Database Migrations

The system uses pure SQL migration files for database schema changes.

### Running Migrations

```bash
cd backend
python run_migrations.py
```

### Creating New Migrations

1. Create a new `.sql` file in `backend/migrations/`
2. Use naming format: `YYYYMMDD_HHMMSS_description.sql`
3. Write your SQL statements
4. Run migrations

### Migration Files

```
backend/migrations/
├── 00000000_000000_create_migrations_table.sql
├── 20260101_000000_initial_database_schema.sql
└── 20260309_225006_add_template_id_to_communication_templates.sql
```

## Project Structure

```
ncd-vite/
├── backend/
│   ├── migrations/           # SQL migration files
│   ├── routes/               # API endpoints
│   ├── models.py             # Pydantic models
│   ├── models_sqlalchemy.py  # SQLAlchemy ORM models
│   ├── database.py           # Database connection
│   ├── main.py               # FastAPI application
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── utils/            # Utility functions
│   └── package.json          # Node dependencies
└── uploads/                  # File uploads directory
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Deployment

### For Production

1. Update environment variables in `backend/.env`
2. Set strong passwords and secret keys
3. Use HTTPS for secure communication
4. Configure proper CORS settings
5. Set up proper backup procedures

### Database Backup

```bash
mysqldump -u root -p ncd_management > backup.sql
```

### Database Restore

```bash
mysql -u root -p ncd_management < backup.sql
```

## Support

For issues or questions, please contact the development team.

## License

Proprietary - All rights reserved
