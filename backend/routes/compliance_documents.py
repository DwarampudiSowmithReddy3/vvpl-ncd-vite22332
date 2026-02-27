"""
Compliance Documents API Routes
================================
Handles document upload to S3 and metadata storage in MySQL

IMPORTANT: Uses same S3 service as series documents
           All documents stored in S3 with metadata in MySQL
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
import logging
import json

from auth import get_current_user
from database import get_db
from models import (
    UserInDB,
    ComplianceDocumentCreate,
    ComplianceDocumentResponse,
    ComplianceDocumentCategory
)
from s3_service import s3_service
from permissions_checker import has_permission, log_unauthorized_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compliance/documents", tags=["Compliance Documents"])


def create_audit_log(db, action: str, admin_name: str, admin_role: str,
                     details: str, entity_type: str, entity_id: str,
                     changes: dict = None):
    """Helper function to create audit log entries"""
    try:
        changes_json = json.dumps(changes) if changes else None

        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details,
                               entity_type, entity_id, changes, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        db.execute_query(insert_query, (
            action,
            admin_name,
            admin_role,
            details,
            entity_type,
            entity_id,
            changes_json,
            datetime.now()
        ))

        logger.info(f"Audit log created: {action} by {admin_name}")

    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")


@router.post("/upload", response_model=ComplianceDocumentResponse)
async def upload_compliance_document(
    series_id: int = Form(...),
    document_title: str = Form(...),
    category: str = Form(...),
    compliance_item_id: Optional[int] = Form(None),
    legal_reference: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Upload compliance document to S3 and save metadata to MySQL
    ALL LOGIC IN BACKEND
    """
    try:
        logger.info(f"🔄 Uploading compliance document for series {series_id}")

        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_compliance", db):
            log_unauthorized_access(db, current_user, "upload_compliance_document", "edit_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to upload compliance documents"
            )

        # Verify series exists
        series_query = "SELECT id, name FROM ncd_series WHERE id = %s AND is_active = 1"
        series_result = db.execute_query(series_query, (series_id,))

        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")

        series_name = series_result[0]['name']

        # Read file content
        file_content = await file.read()
        file_size = len(file_content)

        # Validate file
        is_valid, error_msg = s3_service.validate_file(file.filename, file_size)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Generate S3 key based on category
        category_folder = category.replace('-', '_')
        file_ext = file.filename.split('.')[-1]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        s3_key = f"compliance_docs/{series_id}/{category_folder}/{timestamp}_{file.filename}"

        # Upload to S3
        logger.info(f"📤 Uploading to S3: {s3_key}")

        s3_service.s3_client.put_object(
            Bucket=s3_service.bucket_name,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type or 'application/pdf',
            ServerSideEncryption='AES256',
            Metadata={
                'series_id': str(series_id),
                'category': category,
                'document_title': document_title,
                'uploaded_by': current_user.username,
                'uploaded_at': datetime.utcnow().isoformat()
            }
        )

        # Generate signed URL
        s3_url = s3_service.generate_signed_url(s3_key)

        # Save metadata to database
        insert_query = """
        INSERT INTO compliance_documents (
            series_id, document_title, category, compliance_item_id,
            legal_reference, description, file_name, s3_url, s3_bucket,
            s3_key, file_size, content_type, uploaded_by, uploaded_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        db.execute_query(insert_query, (
            series_id,
            document_title,
            category,
            compliance_item_id,
            legal_reference,
            description,
            file.filename,
            s3_url,
            s3_service.bucket_name,
            s3_key,
            file_size,
            file.content_type or 'application/pdf',
            current_user.username,
            datetime.now()
        ))

        # Get the inserted document
        doc_id = db.cursor.lastrowid

        # Create audit log
        create_audit_log(
            db,
            "Uploaded Compliance Document",
            current_user.full_name,
            current_user.role,
            f"Uploaded {category} document '{document_title}' for series '{series_name}'",
            "compliance_document",
            str(doc_id),
            {
                "series_id": series_id,
                "document_title": document_title,
                "category": category,
                "file_name": file.filename,
                "file_size": file_size
            }
        )

        logger.info(f"✅ Document uploaded successfully: {doc_id}")

        # Return response
        return ComplianceDocumentResponse(
            id=doc_id,
            series_id=series_id,
            document_title=document_title,
            category=category,
            compliance_item_id=compliance_item_id,
            legal_reference=legal_reference,
            description=description,
            file_name=file.filename,
            s3_url=s3_url,
            s3_bucket=s3_service.bucket_name,
            s3_key=s3_key,
            file_size=file_size,
            content_type=file.content_type or 'application/pdf',
            uploaded_at=datetime.now(),
            uploaded_by=current_user.username,
            is_active=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading document: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )


@router.get("/{series_id}", response_model=List[ComplianceDocumentResponse])
async def get_compliance_documents(
    series_id: int,
    category: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all compliance documents for a series
    Optional filter by category
    """
    try:
        logger.info(f"🔄 Getting compliance documents for series {series_id}")

        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_compliance", db):
            log_unauthorized_access(db, current_user, "get_compliance_documents", "view_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view compliance documents"
            )

        # Build query
        if category:
            query = """
            SELECT * FROM compliance_documents
            WHERE series_id = %s AND category = %s AND is_active = 1
            ORDER BY uploaded_at DESC
            """
            result = db.execute_query(query, (series_id, category))
        else:
            query = """
            SELECT * FROM compliance_documents
            WHERE series_id = %s AND is_active = 1
            ORDER BY uploaded_at DESC
            """
            result = db.execute_query(query, (series_id,))

        # Convert to response models
        documents = []
        for doc in result:
            # Regenerate signed URL (in case old one expired)
            fresh_url = s3_service.generate_signed_url(doc['s3_key'])

            documents.append(ComplianceDocumentResponse(
                id=doc['id'],
                series_id=doc['series_id'],
                document_title=doc['document_title'],
                category=doc['category'],
                compliance_item_id=doc['compliance_item_id'],
                legal_reference=doc['legal_reference'],
                description=doc['description'],
                file_name=doc['file_name'],
                s3_url=fresh_url,
                s3_bucket=doc['s3_bucket'],
                s3_key=doc['s3_key'],
                file_size=doc['file_size'],
                content_type=doc['content_type'],
                uploaded_at=doc['uploaded_at'],
                uploaded_by=doc['uploaded_by'],
                is_active=bool(doc['is_active'])
            ))

        logger.info(f"✅ Found {len(documents)} documents")
        return documents

    except Exception as e:
        logger.error(f"❌ Error getting documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving documents: {str(e)}"
        )


@router.delete("/{document_id}")
async def delete_compliance_document(
    document_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Delete compliance document from S3 and database
    """
    try:
        logger.info(f"🔄 Deleting compliance document {document_id}")

        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_compliance", db):
            log_unauthorized_access(db, current_user, "delete_compliance_document", "edit_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to delete compliance documents"
            )

        # Get document info
        query = "SELECT * FROM compliance_documents WHERE id = %s AND is_active = 1"
        result = db.execute_query(query, (document_id,))

        if not result:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = result[0]

        # Delete from S3
        success, error_msg = s3_service.delete_file(doc['s3_key'])
        if not success:
            logger.warning(f"⚠️  Failed to delete from S3: {error_msg}")
            # Continue anyway - mark as inactive in database

        # Soft delete in database
        update_query = """
        UPDATE compliance_documents
        SET is_active = 0
        WHERE id = %s
        """
        db.execute_query(update_query, (document_id,))

        # Create audit log
        create_audit_log(
            db,
            "Deleted Compliance Document",
            current_user.full_name,
            current_user.role,
            f"Deleted document '{doc['document_title']}' (ID: {document_id})",
            "compliance_document",
            str(document_id),
            {
                "document_id": document_id,
                "document_title": doc['document_title'],
                "category": doc['category'],
                "file_name": doc['file_name']
            }
        )

        logger.info(f"✅ Document deleted successfully: {document_id}")

        return {"message": "Document deleted successfully", "success": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )
