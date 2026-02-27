from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes import auth, users, audit, permissions, series, compliance, dashboard, investors, communication, grievances, payouts, reports
from database import get_db
from run_migrations import run_migrations
from seed_default_data import seed_default_data
import uvicorn
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="NCD Management System API",
    description="Backend API for NCD Management System",
    version="1.0.0"
)


# Startup event - Run Alembic migrations
@app.on_event("startup")
async def startup_event():
    """
    Run on application startup
    Automatically runs Alembic database migrations and seeds default data
    """
    logger.info("=" * 70)
    logger.info("🚀 NCD MANAGEMENT SYSTEM - STARTING UP")
    logger.info("=" * 70)
    logger.info("")
    
    # Run Alembic migrations
    logger.info("📊 Running database migrations with Alembic...")
    logger.info("")
    
    migration_success = run_migrations()
    
    if not migration_success:
        logger.error("=" * 70)
        logger.error("❌ APPLICATION STARTUP FAILED")
        logger.error("=" * 70)
        logger.error("")
        logger.error("Database migrations failed.")
        logger.error("The application cannot start without successful migrations.")
        logger.error("")
        logger.error("Please check:")
        logger.error("1. Database connection settings in backend/.env")
        logger.error("2. MySQL server is running")
        logger.error("3. Database 'ncd_management' exists")
        logger.error("")
        logger.error("Exiting application...")
        logger.error("=" * 70)
        # Exit the application
        sys.exit(1)
    
    # Seed default data (admin user + templates)
    logger.info("")
    logger.info("📝 Seeding default data...")
    seed_success = seed_default_data()
    
    if seed_success:
        logger.info("✅ Default data seeded successfully")
    else:
        logger.warning("⚠️  Failed to seed default data (may already exist)")
    
    logger.info("")
    logger.info("=" * 70)
    logger.info("✅ APPLICATION STARTUP COMPLETE")
    logger.info("🌐 API IS READY TO ACCEPT REQUESTS")
    logger.info("=" * 70)
    logger.info("")

# Log all requests middleware
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests for debugging"""
    logger.info(f"📥 Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"📤 Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"❌ Request failed: {e}")
        logger.exception(e)
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "success": False}
        )

# CORS Configuration - Allow frontend to connect (MUST BE FIRST)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:3000"],  # All possible Vite dev server ports
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ENCRYPTION DISABLED - The middleware approach has technical issues
# For production, use HTTPS instead which encrypts the entire connection
logger.info("ℹ️ Response encryption is DISABLED")
logger.info("ℹ️ For production: Use HTTPS to encrypt all traffic")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(audit.router)
app.include_router(permissions.router)
app.include_router(series.router)
app.include_router(compliance.router)
app.include_router(dashboard.router)
app.include_router(investors.router)
app.include_router(communication.router)
app.include_router(grievances.router)
app.include_router(payouts.router)
app.include_router(reports.router)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "NCD Management System API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    try:
        # Test database connection
        db = get_db()
        db.execute_query("SELECT 1")
        return {
            "status": "healthy", 
            "message": "API is working properly",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": "Database connection failed",
            "database": "disconnected"
        }

# Test endpoint for RBI compliance (no auth required)
@app.get("/test-rbi")
async def test_rbi_endpoint():
    """Test RBI compliance endpoint without authentication"""
    try:
        from database import get_db
        db = get_db()
        
        # Test the summary query
        summary_query = """
        SELECT 
            COALESCE(SUM(inv.amount), 0) as total_aum,
            COUNT(DISTINCT i.id) as total_investors,
            SUM(CASE WHEN i.kyc_status = 'Pending' THEN 1 ELSE 0 END) as kyc_pending
        FROM ncd_series s
        LEFT JOIN investments inv ON s.id = inv.series_id AND inv.status = 'confirmed'
        LEFT JOIN investors i ON inv.investor_id = i.id
        WHERE s.is_active = 1
        """
        
        result = db.execute_query(summary_query)
        summary_data = result[0] if result else {}
        
        return {
            "status": "success",
            "message": "RBI endpoint logic is working",
            "data": {
                "total_aum": float(summary_data.get('total_aum', 0)),
                "total_investors": summary_data.get('total_investors', 0),
                "kyc_pending": summary_data.get('kyc_pending', 0)
            }
        }
    except Exception as e:
        logger.error(f"Test RBI endpoint failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "success": False}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)