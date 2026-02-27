"""
SAFE Encryption Wrapper for API Responses
This is a safer approach than middleware - wraps responses manually
"""
from cryptography.fernet import Fernet
from fastapi.responses import JSONResponse
from typing import Any, Dict
import json
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class SafeEncryption:
    """Safe encryption service that won't crash the server"""
    
    def __init__(self):
        self.enabled = os.getenv('ENABLE_RESPONSE_ENCRYPTION', 'false').lower() == 'true'
        self.key = os.getenv('ENCRYPTION_KEY', '')
        
        if self.enabled and self.key:
            try:
                self.cipher = Fernet(self.key.encode())
                logger.info("✅ Safe encryption initialized")
            except Exception as e:
                logger.error(f"❌ Encryption init failed: {e}")
                self.enabled = False
                self.cipher = None
        else:
            self.cipher = None
            if self.enabled:
                logger.warning("⚠️ Encryption enabled but no key found - disabling")
                self.enabled = False
    
    def encrypt_data(self, data: Any) -> Dict[str, Any]:
        """
        Safely encrypt data
        Returns encrypted format or original data if encryption fails
        """
        if not self.enabled or not self.cipher:
            return {
                "encrypted": False,
                "data": data
            }
        
        try:
            # Convert to JSON string
            json_str = json.dumps(data, default=str)
            
            # Encrypt
            encrypted_bytes = self.cipher.encrypt(json_str.encode('utf-8'))
            
            # Convert to base64 string
            import base64
            encrypted_str = base64.b64encode(encrypted_bytes).decode('utf-8')
            
            return {
                "encrypted": True,
                "data": encrypted_str
            }
            
        except Exception as e:
            logger.error(f"❌ Encryption failed: {e}")
            # Return unencrypted if encryption fails - SAFE FALLBACK
            return {
                "encrypted": False,
                "data": data
            }
    
    def create_encrypted_response(self, data: Any, status_code: int = 200) -> JSONResponse:
        """
        Create a JSONResponse with encrypted data
        This is SAFE - if encryption fails, returns unencrypted data
        """
        try:
            encrypted_data = self.encrypt_data(data)
            return JSONResponse(
                content=encrypted_data,
                status_code=status_code
            )
        except Exception as e:
            logger.error(f"❌ Response creation failed: {e}")
            # SAFE FALLBACK - return unencrypted response
            return JSONResponse(
                content={"encrypted": False, "data": data},
                status_code=status_code
            )


# Global instance
safe_encryption = SafeEncryption()


def encrypted_response(data: Any, status_code: int = 200) -> JSONResponse:
    """
    Helper function to create encrypted response
    Use this in your route handlers instead of returning data directly
    
    Example:
        @router.get("/investors")
        async def get_investors():
            investors = get_investors_from_db()
            return encrypted_response(investors)
    """
    return safe_encryption.create_encrypted_response(data, status_code)
