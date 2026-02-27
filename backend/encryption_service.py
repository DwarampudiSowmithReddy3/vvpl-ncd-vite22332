"""
Encryption Service for API Response Encryption
Encrypts all API responses so data is not visible in browser Network tab
Uses AES-256 encryption with Fernet
"""
from cryptography.fernet import Fernet
from typing import Any, Dict
import base64
import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Handles encryption and decryption of API responses
    Uses AES-256 encryption with Fernet
    """
    
    def __init__(self):
        """Initialize encryption service with key"""
        self.encryption_enabled = os.getenv('ENABLE_RESPONSE_ENCRYPTION', 'true').lower() == 'true'
        
        if self.encryption_enabled:
            # Get encryption key from environment or generate one
            encryption_key = os.getenv('ENCRYPTION_KEY')
            
            if not encryption_key:
                # Generate a key if not provided
                logger.warning("⚠️ No ENCRYPTION_KEY found in environment. Generating a new key.")
                logger.warning("⚠️ Add this to your .env file: ENCRYPTION_KEY=" + Fernet.generate_key().decode())
                encryption_key = Fernet.generate_key().decode()
            
            # Convert string key to bytes if needed
            if isinstance(encryption_key, str):
                encryption_key = encryption_key.encode()
            
            # Initialize Fernet cipher
            try:
                self.cipher = Fernet(encryption_key)
                logger.info("✅ Encryption service initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize encryption: {e}")
                logger.warning("⚠️ Disabling encryption due to initialization error")
                self.encryption_enabled = False
                self.cipher = None
        else:
            logger.info("ℹ️ Response encryption is disabled")
            self.cipher = None
    
    def encrypt_response(self, data: Any) -> Dict[str, str]:
        """
        Encrypt API response data
        
        Args:
            data: Any JSON-serializable data (dict, list, string, etc.)
        
        Returns:
            Dict with encrypted data and metadata
        """
        if not self.encryption_enabled or not self.cipher:
            # Return data as-is if encryption is disabled
            return {
                "encrypted": False,
                "data": data
            }
        
        try:
            # Convert data to JSON string
            json_data = json.dumps(data, default=str)
            
            # Encrypt the JSON string
            encrypted_bytes = self.cipher.encrypt(json_data.encode('utf-8'))
            
            # Convert to base64 for safe transmission
            encrypted_base64 = base64.b64encode(encrypted_bytes).decode('utf-8')
            
            logger.debug(f"✅ Encrypted response data ({len(json_data)} bytes -> {len(encrypted_base64)} bytes)")
            
            return {
                "encrypted": True,
                "data": encrypted_base64,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Encryption failed: {e}")
            # Return unencrypted data if encryption fails
            return {
                "encrypted": False,
                "data": data,
                "error": "Encryption failed"
            }
    
    def decrypt_response(self, encrypted_data: str) -> Any:
        """
        Decrypt API response data
        
        Args:
            encrypted_data: Base64-encoded encrypted string
        
        Returns:
            Decrypted data (original format)
        """
        if not self.encryption_enabled or not self.cipher:
            raise ValueError("Encryption is not enabled")
        
        try:
            # Decode from base64
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            
            # Decrypt
            decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
            
            # Convert back to JSON
            json_data = decrypted_bytes.decode('utf-8')
            data = json.loads(json_data)
            
            logger.debug(f"✅ Decrypted response data")
            
            return data
            
        except Exception as e:
            logger.error(f"❌ Decryption failed: {e}")
            raise ValueError(f"Failed to decrypt data: {str(e)}")
    
    def is_enabled(self) -> bool:
        """Check if encryption is enabled"""
        return self.encryption_enabled and self.cipher is not None


# Global encryption service instance
encryption_service = EncryptionService()


def encrypt_api_response(data: Any) -> Dict[str, Any]:
    """
    Helper function to encrypt API response
    Use this in route handlers to encrypt responses
    """
    return encryption_service.encrypt_response(data)


def decrypt_api_response(encrypted_data: str) -> Any:
    """
    Helper function to decrypt API response
    Use this in frontend to decrypt responses
    """
    return encryption_service.decrypt_response(encrypted_data)
