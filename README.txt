========================================
NCD MANAGEMENT SYSTEM
Vaibhav Vyapaar Private Limited
========================================

PROJECT STRUCTURE:
------------------

frontend/          - React Frontend Application
  ├── src/         - React source code
  ├── public/      - Static assets
  ├── dist/        - Production build
  └── node_modules/ - NPM dependencies

backend/           - Python FastAPI Backend
  ├── routes/      - API endpoints
  └── .env         - Backend configuration

uploads/           - File storage (documents, images)

.venv/             - Python virtual environment

========================================
QUICK START:
========================================

1. START BOTH SERVERS:
   Double-click: RESTART_EVERYTHING.bat

2. START FRONTEND ONLY:
   Double-click: START_FRONTEND.bat

3. START BACKEND ONLY:
   Double-click: START_BACKEND.bat

4. CLEAR CACHE & RESTART:
   Double-click: CLEAR_CACHE_AND_RESTART.bat

========================================
ACCESS URLS:
========================================

Frontend: http://localhost:5173
Backend:  http://localhost:8000
API Docs: http://localhost:8000/docs

========================================
CONFIGURATION:
========================================

Frontend Config: frontend/.env
Backend Config:  backend/.env
Root Config:     .env (shared settings)

========================================
DEPLOYMENT:
========================================

Docker:  docker-compose.yml
Nginx:   nginx.conf
Vercel:  frontend/vercel.json

========================================
