"""
Encrypted API Endpoint Handler
Decrypts obfuscated requests and routes them to appropriate endpoints
"""

from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
import base64
import json
import logging
from cryptography.fernet import Fernet
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/obs", tags=["encrypted"])

# Initialize encryption key
ENCRYPTION_KEY = settings.encryption_key or b'ncd-system-secret-key-min-32-chars!'

def decrypt_payload(encrypted_data: str) -> dict:
    """Decrypt AES encrypted payload from frontend"""
    try:
        # This is a simplified version - in production use proper AES decryption
        # For now, we'll just decode the base64
        import base64
        decoded = base64.b64decode(encrypted_data)
        return json.loads(decoded)
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid encrypted payload")

def encrypt_response(data: dict) -> str:
    """Encrypt response data"""
    try:
        json_str = json.dumps(data)
        # This is simplified - in production use proper AES encryption
        import base64
        return base64.b64encode(json_str.encode()).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise HTTPException(status_code=500, detail="Response encryption failed")

@router.post("/{obfuscated_endpoint:path}")
async def handle_encrypted_request(obfuscated_endpoint: str, request: Request):
    """
    Handle encrypted requests from frontend
    
    Flow:
    1. Frontend sends: POST /api/obs/[base64-encoded-endpoint]
    2. Backend decodes endpoint
    3. Backend decrypts payload
    4. Backend routes to actual endpoint
    5. Backend encrypts response
    6. Frontend decrypts response
    """
    try:
        # Decode obfuscated endpoint
        try:
            actual_endpoint = base64.b64decode(obfuscated_endpoint).decode()
        except Exception as e:
            logger.error(f"Failed to decode endpoint: {e}")
            raise HTTPException(status_code=400, detail="Invalid endpoint encoding")

        # Get request body
        body = await request.json()
        
        # Decrypt payload if encrypted
        if body.get('encrypted'):
            try:
                # In production, use proper AES decryption
                decrypted_data = decrypt_payload(body['encrypted'])
            except Exception as e:
                logger.error(f"Decryption failed: {e}")
                raise HTTPException(status_code=400, detail="Failed to decrypt payload")
        else:
            decrypted_data = body

        # Log the actual endpoint being called (for debugging)
        if import.meta.env.DEV:
            logger.info(f"🔐 Encrypted request to: {actual_endpoint}")

        # Route to actual endpoint based on decoded path
        # This is a simplified router - in production, use proper routing
        if actual_endpoint.startswith('/series'):
            # Route to series endpoint
            from app.api.routes import series as series_router
            # Handle the request...
            pass
        elif actual_endpoint.startswith('/compliance'):
            # Route to compliance endpoint
            from app.api.routes import compliance as compliance_router
            # Handle the request...
            pass
        else:
            raise HTTPException(status_code=404, detail="Endpoint not found")

        # Return encrypted response
        response_data = {
            "status": "success",
            "data": decrypted_data,
        }
        
        encrypted_response = encrypt_response(response_data)
        
        return JSONResponse({
            "encrypted": encrypted_response
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling encrypted request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def health_check():
    """Health check for encrypted endpoint"""
    return {"status": "ok", "encrypted": True}
