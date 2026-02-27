"""
AWS S3 Service for NCD Document Management
==========================================
Handles file uploads, downloads, and signed URL generation

SECURITY:
- Uses signed URLs (time-limited, secure)
- No public access to files
- Validates file types and sizes
- Organized folder structure
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
from dotenv import load_dotenv
import logging
from typing import Optional, Tuple
from datetime import datetime
import mimetypes

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')
AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET')
S3_SIGNED_URL_EXPIRY = int(os.getenv('S3_SIGNED_URL_EXPIRY', 3600))  # Default 1 hour

# Allowed file types (only PDFs for now)
ALLOWED_EXTENSIONS = {'.pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

class S3Service:
    """AWS S3 Service for document management"""
    
    def __init__(self):
        """Initialize S3 client"""
        try:
            # Validate configuration
            if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET]):
                raise ValueError(
                    "Missing AWS configuration. Please set AWS_ACCESS_KEY_ID, "
                    "AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in .env file"
                )
            
            # Create S3 client
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            )
            
            self.bucket_name = AWS_S3_BUCKET
            self.region = AWS_REGION
            
            logger.info(f"✅ S3 Service initialized - Bucket: {self.bucket_name}, Region: {self.region}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize S3 Service: {e}")
            raise
    
    def validate_file(self, file_name: str, file_size: int) -> Tuple[bool, str]:
        """
        Validate file type and size
        
        Args:
            file_name: Name of the file
            file_size: Size of file in bytes
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file extension
        file_ext = os.path.splitext(file_name)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            return False, f"Invalid file type. Only PDF files are allowed. Got: {file_ext}"
        
        # Check file size
        if file_size > MAX_FILE_SIZE:
            max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
            actual_size_mb = file_size / (1024 * 1024)
            return False, f"File too large. Max: {max_size_mb}MB, Got: {actual_size_mb:.2f}MB"
        
        return True, ""
    
    def upload_series_document(
        self,
        series_id: int,
        document_type: str,
        file_content: bytes,
        file_name: str
    ) -> Tuple[bool, Optional[dict], Optional[str]]:
        """
        Upload series document to S3
        
        Args:
            series_id: ID of the series
            document_type: Type of document (term_sheet, offer_document, board_resolution)
            file_content: File content as bytes
            file_name: Original file name
            
        Returns:
            Tuple of (success, document_info, error_message)
            document_info contains: s3_url, s3_key, s3_bucket, file_size, content_type
        """
        try:
            # Validate file
            file_size = len(file_content)
            is_valid, error_msg = self.validate_file(file_name, file_size)
            if not is_valid:
                logger.error(f"❌ File validation failed: {error_msg}")
                return False, None, error_msg
            
            # Generate S3 key (path)
            file_ext = os.path.splitext(file_name)[1]
            s3_key = f"series_docs/{series_id}/{document_type}{file_ext}"
            
            # Get content type
            content_type = mimetypes.guess_type(file_name)[0] or 'application/pdf'
            
            # Upload to S3
            logger.info(f"📤 Uploading to S3: {s3_key}")
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                ServerSideEncryption='AES256',  # Enable encryption
                Metadata={
                    'series_id': str(series_id),
                    'document_type': document_type,
                    'original_filename': file_name,
                    'uploaded_at': datetime.utcnow().isoformat()
                }
            )
            
            # Generate signed URL (valid for configured time)
            s3_url = self.generate_signed_url(s3_key)
            
            document_info = {
                's3_url': s3_url,
                's3_key': s3_key,
                's3_bucket': self.bucket_name,
                'file_size': file_size,
                'content_type': content_type,
                'file_name': file_name
            }
            
            logger.info(f"✅ Successfully uploaded: {s3_key}")
            return True, document_info, None
            
        except NoCredentialsError:
            error_msg = "AWS credentials not found or invalid"
            logger.error(f"❌ {error_msg}")
            return False, None, error_msg
            
        except ClientError as e:
            error_msg = f"AWS S3 error: {e.response['Error']['Message']}"
            logger.error(f"❌ {error_msg}")
            return False, None, error_msg
            
        except Exception as e:
            error_msg = f"Unexpected error during upload: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return False, None, error_msg
    
    def upload_investor_document(
        self,
        investor_id: int,
        series_id: int,
        document_type: str,
        file_content: bytes,
        file_name: str
    ) -> Tuple[bool, Optional[dict], Optional[str]]:
        """
        Upload investor document to S3
        
        Args:
            investor_id: ID of the investor
            series_id: ID of the series
            document_type: Type of document (form_15g, form_15h, bond_paper)
            file_content: File content as bytes
            file_name: Original file name
            
        Returns:
            Tuple of (success, document_info, error_message)
        """
        try:
            # Validate file
            file_size = len(file_content)
            is_valid, error_msg = self.validate_file(file_name, file_size)
            if not is_valid:
                logger.error(f"❌ File validation failed: {error_msg}")
                return False, None, error_msg
            
            # Generate S3 key (path)
            file_ext = os.path.splitext(file_name)[1]
            s3_key = f"investor_docs/{investor_id}/{series_id}/{document_type}{file_ext}"
            
            # Get content type
            content_type = mimetypes.guess_type(file_name)[0] or 'application/pdf'
            
            # Upload to S3
            logger.info(f"📤 Uploading to S3: {s3_key}")
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                ServerSideEncryption='AES256',
                Metadata={
                    'investor_id': str(investor_id),
                    'series_id': str(series_id),
                    'document_type': document_type,
                    'original_filename': file_name,
                    'uploaded_at': datetime.utcnow().isoformat()
                }
            )
            
            # Generate signed URL
            s3_url = self.generate_signed_url(s3_key)
            
            document_info = {
                's3_url': s3_url,
                's3_key': s3_key,
                's3_bucket': self.bucket_name,
                'file_size': file_size,
                'content_type': content_type,
                'file_name': file_name
            }
            
            logger.info(f"✅ Successfully uploaded: {s3_key}")
            return True, document_info, None
            
        except NoCredentialsError:
            error_msg = "AWS credentials not found or invalid"
            logger.error(f"❌ {error_msg}")
            return False, None, error_msg
            
        except ClientError as e:
            error_msg = f"AWS S3 error: {e.response['Error']['Message']}"
            logger.error(f"❌ {error_msg}")
            return False, None, error_msg
            
        except Exception as e:
            error_msg = f"Unexpected error during upload: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return False, None, error_msg
    
    def generate_signed_url(self, s3_key: str, expiry: Optional[int] = None) -> str:
        """
        Generate signed URL for secure file access
        
        Args:
            s3_key: S3 object key
            expiry: URL expiry time in seconds (default from config)
            
        Returns:
            Signed URL string
        """
        try:
            expiry_time = expiry or S3_SIGNED_URL_EXPIRY
            
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiry_time
            )
            
            logger.info(f"🔗 Generated signed URL for: {s3_key} (expires in {expiry_time}s)")
            return url
            
        except Exception as e:
            logger.error(f"❌ Failed to generate signed URL: {e}")
            # Return a fallback URL (won't work but prevents crashes)
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
    
    def delete_file(self, s3_key: str) -> Tuple[bool, Optional[str]]:
        """
        Delete file from S3
        
        Args:
            s3_key: S3 object key
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            logger.info(f"🗑️  Deleting from S3: {s3_key}")
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"✅ Successfully deleted: {s3_key}")
            return True, None
            
        except ClientError as e:
            error_msg = f"AWS S3 error: {e.response['Error']['Message']}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
            
        except Exception as e:
            error_msg = f"Unexpected error during deletion: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
    
    def check_file_exists(self, s3_key: str) -> bool:
        """
        Check if file exists in S3
        
        Args:
            s3_key: S3 object key
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError:
            return False
    
    def get_file_metadata(self, s3_key: str) -> Optional[dict]:
        """
        Get file metadata from S3
        
        Args:
            s3_key: S3 object key
            
        Returns:
            Dictionary with file metadata or None
        """
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return {
                'content_length': response.get('ContentLength'),
                'content_type': response.get('ContentType'),
                'last_modified': response.get('LastModified'),
                'metadata': response.get('Metadata', {})
            }
            
        except ClientError as e:
            logger.error(f"❌ Failed to get metadata: {e}")
            return None

# Create singleton instance
try:
    s3_service = S3Service()
    logger.info("✅ S3 Service singleton created")
except Exception as e:
    logger.error(f"❌ Failed to create S3 Service: {e}")
    s3_service = None

# Export functions for easy import
def upload_series_document(series_id: int, document_type: str, file_content: bytes, file_name: str):
    """Upload series document"""
    if not s3_service:
        return False, None, "S3 Service not initialized"
    return s3_service.upload_series_document(series_id, document_type, file_content, file_name)

def upload_investor_document(investor_id: int, series_id: int, document_type: str, file_content: bytes, file_name: str):
    """Upload investor document"""
    if not s3_service:
        return False, None, "S3 Service not initialized"
    return s3_service.upload_investor_document(investor_id, series_id, document_type, file_content, file_name)

def generate_signed_url(s3_key: str, expiry: Optional[int] = None):
    """Generate signed URL"""
    if not s3_service:
        return None
    return s3_service.generate_signed_url(s3_key, expiry)

def delete_file(s3_key: str):
    """Delete file from S3"""
    if not s3_service:
        return False, "S3 Service not initialized"
    return s3_service.delete_file(s3_key)

def upload_file_to_s3(file_content: bytes, s3_key: str, content_type: str = 'application/pdf') -> str:
    """
    Generic file upload to S3
    
    Args:
        file_content: File content as bytes
        s3_key: S3 object key (path)
        content_type: MIME type of the file
        
    Returns:
        S3 URL (signed URL)
    """
    if not s3_service:
        raise ValueError("S3 Service not initialized")
    
    try:
        # Upload to S3
        logger.info(f"📤 Uploading to S3: {s3_key}")
        
        s3_service.s3_client.put_object(
            Bucket=s3_service.bucket_name,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )
        
        # Generate signed URL
        s3_url = s3_service.generate_signed_url(s3_key)
        
        logger.info(f"✅ Successfully uploaded: {s3_key}")
        return s3_url
        
    except Exception as e:
        logger.error(f"❌ Failed to upload file: {e}")
        raise
