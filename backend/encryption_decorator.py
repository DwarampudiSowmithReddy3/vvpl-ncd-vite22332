"""
Encryption Decorator for FastAPI Routes
Automatically encrypts route responses safely
"""
from functools import wraps
from fastapi import Response
from fastapi.responses import JSONResponse
from safe_encryption import safe_encryption
import logging
import json

logger = logging.getLogger(__name__)


def encrypt_response(func):
    """
    Decorator to automatically encrypt route responses
    
    Usage:
        @router.get("/investors")
        @encrypt_response
        async def get_investors():
            return {"investors": [...]}
    
    This is SAFE - if encryption fails, returns original response
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            # Call the original function
            result = await func(*args, **kwargs)
            
            # If result is already a Response object, return it as-is
            if isinstance(result, Response):
                # Try to extract and encrypt the content
                if isinstance(result, JSONResponse):
                    try:
                        # Get the response body
                        body = result.body
                        if body:
                            data = json.loads(body.decode('utf-8'))
                            encrypted_data = safe_encryption.encrypt_data(data)
                            return JSONResponse(
                                content=encrypted_data,
                                status_code=result.status_code,
                                headers=dict(result.headers)
                            )
                    except Exception as e:
                        logger.warning(f"⚠️ Could not encrypt JSONResponse: {e}")
                        return result
                return result
            
            # If result is dict/list/etc, encrypt it
            encrypted_data = safe_encryption.encrypt_data(result)
            return JSONResponse(content=encrypted_data)
            
        except Exception as e:
            logger.error(f"❌ Encryption decorator error: {e}")
            # SAFE FALLBACK - call original function and return unencrypted
            try:
                result = await func(*args, **kwargs)
                if isinstance(result, Response):
                    return result
                return JSONResponse(content={"encrypted": False, "data": result})
            except Exception as inner_e:
                logger.error(f"❌ Fallback also failed: {inner_e}")
                raise
    
    return wrapper
