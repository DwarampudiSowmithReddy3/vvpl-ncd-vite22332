"""
FastAPI Middleware for Automatic Response Encryption
Automatically encrypts all API responses
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response
import json
import logging
from encryption_service import encryption_service

logger = logging.getLogger(__name__)


class EncryptionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically encrypt all API responses
    Intercepts responses and encrypts the body before sending to client
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request and encrypt response
        """
        # Get the response from the route handler
        response = await call_next(request)
        
        # Only encrypt JSON responses
        if not encryption_service.is_enabled():
            return response
        
        # Check if response is JSON
        content_type = response.headers.get('content-type', '')
        if 'application/json' not in content_type:
            return response
        
        # Skip encryption for certain endpoints (like /docs, /openapi.json)
        skip_paths = ['/docs', '/openapi.json', '/redoc', '/health']
        if any(request.url.path.startswith(path) for path in skip_paths):
            return response
        
        try:
            # Read response body
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
            
            # Parse JSON
            if response_body:
                try:
                    original_data = json.loads(response_body.decode('utf-8'))
                    
                    # Encrypt the data
                    encrypted_response = encryption_service.encrypt_response(original_data)
                    
                    # Create new response with encrypted data and proper headers
                    encrypted_json = json.dumps(encrypted_response)
                    
                    return Response(
                        content=encrypted_json,
                        status_code=response.status_code,
                        media_type="application/json",
                        headers={
                            "content-type": "application/json",
                            "content-length": str(len(encrypted_json.encode('utf-8')))
                        }
                    )
                except json.JSONDecodeError:
                    # If not valid JSON, return as-is
                    logger.warning(f"⚠️ Could not parse response as JSON for {request.url.path}")
                    return Response(
                        content=response_body,
                        status_code=response.status_code,
                        media_type=content_type,
                        headers={
                            "content-type": content_type,
                            "content-length": str(len(response_body))
                        }
                    )
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Error in encryption middleware: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Return original response if encryption fails
            return response


def add_encryption_middleware(app):
    """
    Add encryption middleware to FastAPI app
    Call this in main.py after creating the app
    """
    if encryption_service.is_enabled():
        app.add_middleware(EncryptionMiddleware)
        logger.info("✅ Encryption middleware added to application")
    else:
        logger.info("ℹ️ Encryption middleware not added (encryption disabled)")
