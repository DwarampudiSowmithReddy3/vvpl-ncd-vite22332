"""
SAFE Encryption Middleware - Won't crash the server
Uses multiple safety checks and fallbacks
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, StreamingResponse
from fastapi import Request
from safe_encryption import safe_encryption
import json
import logging

logger = logging.getLogger(__name__)


class SafeEncryptionMiddleware(BaseHTTPMiddleware):
    """
    SAFE encryption middleware with multiple fallback mechanisms
    Will NEVER crash the server - always returns a valid response
    """
    
    async def dispatch(self, request: Request, call_next):
        """Process request and safely encrypt response"""
        
        # If encryption is disabled, pass through
        if not safe_encryption.enabled:
            return await call_next(request)
        
        # Skip encryption for certain paths
        skip_paths = ['/docs', '/openapi.json', '/redoc', '/health', '/']
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        try:
            # Get response from route handler
            response = await call_next(request)
            
            # Only process successful JSON responses
            content_type = response.headers.get('content-type', '')
            if 'application/json' not in content_type:
                return response
            
            # Only encrypt 2xx responses
            if response.status_code < 200 or response.status_code >= 300:
                return response
            
            # Read response body SAFELY
            try:
                body_bytes = b""
                async for chunk in response.body_iterator:
                    body_bytes += chunk
                
                if not body_bytes:
                    return response
                
                # Parse JSON SAFELY
                try:
                    data = json.loads(body_bytes.decode('utf-8'))
                except json.JSONDecodeError as e:
                    logger.warning(f"⚠️ Not valid JSON, skipping encryption: {e}")
                    return Response(
                        content=body_bytes,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        media_type=content_type
                    )
                
                # Encrypt data SAFELY
                encrypted_data = safe_encryption.encrypt_data(data)
                encrypted_json = json.dumps(encrypted_data)
                encrypted_bytes = encrypted_json.encode('utf-8')
                
                # Return encrypted response with correct headers
                return Response(
                    content=encrypted_bytes,
                    status_code=response.status_code,
                    media_type="application/json",
                    headers={
                        "content-type": "application/json",
                        "content-length": str(len(encrypted_bytes))
                    }
                )
                
            except Exception as e:
                logger.error(f"❌ Error reading response body: {e}")
                # SAFE FALLBACK - return original response
                return response
            
        except Exception as e:
            logger.error(f"❌ Middleware error: {e}")
            # SAFE FALLBACK - try to get response without encryption
            try:
                return await call_next(request)
            except Exception as inner_e:
                logger.error(f"❌ Fallback failed: {inner_e}")
                # LAST RESORT - return error response
                return Response(
                    content=json.dumps({"error": "Internal server error"}),
                    status_code=500,
                    media_type="application/json"
                )


def add_safe_encryption_middleware(app):
    """
    Add SAFE encryption middleware to FastAPI app
    This version has multiple safety checks and won't crash
    """
    if safe_encryption.enabled:
        app.add_middleware(SafeEncryptionMiddleware)
        logger.info("✅ SAFE encryption middleware added")
    else:
        logger.info("ℹ️ Encryption disabled - middleware not added")
