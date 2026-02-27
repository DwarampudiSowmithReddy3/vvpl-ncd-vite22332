from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from models import UserInDB
from auth import get_current_user
from database import get_db
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/permissions", tags=["Permissions"])

@router.get("/")
async def get_all_permissions(current_user: UserInDB = Depends(get_current_user)):
    """Get all permissions organized by role and module"""
    try:
        db = get_db()
        
        # Get all permissions from role_permissions table
        query = """
        SELECT role, permissions
        FROM role_permissions 
        ORDER BY role
        """
        
        result = db.execute_query(query)
        
        # Convert backend format to frontend format
        def convert_to_frontend_format(backend_perms):
            """Convert backend array to frontend object format"""
            frontend_perms = {
                'dashboard': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': False, 'create': False, 'edit': False, 'delete': False}
            }
            
            # Map backend permission names to frontend format
            permission_map = {
                'view_dashboard': ('dashboard', 'view'),
                'view_ncd_series': ('ncdSeries', 'view'),
                'create_ncd_series': ('ncdSeries', 'create'),
                'edit_ncd_series': ('ncdSeries', 'edit'),
                'delete_ncd_series': ('ncdSeries', 'delete'),
                'approve_ncd_series': ('approval', 'create'),
                'view_investors': ('investors', 'view'),
                'create_investor': ('investors', 'create'),
                'edit_investor': ('investors', 'edit'),
                'delete_investor': ('investors', 'delete'),
                'view_reports': ('reports', 'view'),
                'create_report': ('reports', 'create'),
                'edit_report': ('reports', 'edit'),
                'delete_report': ('reports', 'delete'),
                'view_compliance': ('compliance', 'view'),
                'edit_compliance': ('compliance', 'edit'),
                'view_users': ('administrator', 'view'),
                'create_user': ('administrator', 'create'),
                'edit_user': ('administrator', 'edit'),
                'delete_user': ('administrator', 'delete'),
                'view_permissions': ('administrator', 'view'),
                'edit_permissions': ('administrator', 'edit'),
                'view_audit_logs': ('administrator', 'view'),
                'view_communication': ('communication', 'view'),
                'create_communication': ('communication', 'create'),
                'edit_communication': ('communication', 'edit'),
                'view_interest_payout': ('interestPayout', 'view'),
                'create_interest_payout': ('interestPayout', 'create'),
                'edit_interest_payout': ('interestPayout', 'edit'),
                'view_grievance': ('grievanceManagement', 'view'),
                'create_grievance': ('grievanceManagement', 'create'),
                'edit_grievance': ('grievanceManagement', 'edit'),
                'delete_grievance': ('grievanceManagement', 'delete')
            }
            
            # Convert each backend permission to frontend format
            for perm in backend_perms:
                if perm in permission_map:
                    module, action = permission_map[perm]
                    frontend_perms[module][action] = True
            
            return frontend_perms
        
        # Organize permissions by role
        permissions = {}
        for row in result:
            role = row['role']
            backend_perms = json.loads(row['permissions'])
            
            # Check if permissions are already in object format (dict)
            if isinstance(backend_perms, dict):
                # Already in correct format, use as-is
                permissions[role] = backend_perms
            elif isinstance(backend_perms, list):
                # Convert from array format to object format
                permissions[role] = convert_to_frontend_format(backend_perms)
            else:
                # Unknown format, skip
                logger.warning(f"Unknown permissions format for role {role}: {type(backend_perms)}")
                continue
        
        logger.info(f"✅ Returning permissions for {len(permissions)} roles")
        return permissions
        
    except Exception as e:
        logger.error(f"Error getting permissions: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving permissions"
        )

@router.put("/")
async def update_permissions(
    permissions_data: Dict[str, Any],
    current_user: UserInDB = Depends(get_current_user)
):
    """Update permissions (Admin or Super Admin only)"""
    try:
        # Check if user is Admin or Super Admin
        if current_user.role not in ["Admin", "Super Admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admin or Super Admin can update permissions"
            )
        
        # Convert frontend format to backend format
        def convert_to_backend_format(frontend_perms):
            """Convert frontend object to backend array format"""
            backend_perms = []
            
            # Map frontend format to backend permission names
            permission_map = {
                ('dashboard', 'view'): 'view_dashboard',
                ('ncdSeries', 'view'): 'view_ncd_series',
                ('ncdSeries', 'create'): 'create_ncd_series',
                ('ncdSeries', 'edit'): 'edit_ncd_series',
                ('ncdSeries', 'delete'): 'delete_ncd_series',
                ('approval', 'create'): 'approve_ncd_series',
                ('investors', 'view'): 'view_investors',
                ('investors', 'create'): 'create_investor',
                ('investors', 'edit'): 'edit_investor',
                ('investors', 'delete'): 'delete_investor',
                ('reports', 'view'): 'view_reports',
                ('reports', 'create'): 'create_report',
                ('reports', 'edit'): 'edit_report',
                ('reports', 'delete'): 'delete_report',
                ('compliance', 'view'): 'view_compliance',
                ('compliance', 'edit'): 'edit_compliance',
                ('administrator', 'view'): 'view_users',
                ('administrator', 'create'): 'create_user',
                ('administrator', 'edit'): 'edit_user',
                ('administrator', 'delete'): 'delete_user',
                ('communication', 'view'): 'view_communication',
                ('communication', 'create'): 'create_communication',
                ('communication', 'edit'): 'edit_communication',
                ('interestPayout', 'view'): 'view_interest_payout',
                ('interestPayout', 'create'): 'create_interest_payout',
                ('interestPayout', 'edit'): 'edit_interest_payout',
                ('grievanceManagement', 'view'): 'view_grievance',
                ('grievanceManagement', 'create'): 'create_grievance',
                ('grievanceManagement', 'edit'): 'edit_grievance',
                ('grievanceManagement', 'delete'): 'delete_grievance'
            }
            
            # Convert each frontend permission to backend format
            for module, actions in frontend_perms.items():
                for action, value in actions.items():
                    if value and (module, action) in permission_map:
                        backend_perms.append(permission_map[(module, action)])
            
            return backend_perms
        
        db = get_db()
        updated_count = 0
        audit_details = []
        
        # Update each role's permissions in the database
        for role_name, role_permissions in permissions_data.items():
            
            # Get current permissions for comparison (for audit trail)
            current_permissions_query = """
            SELECT permissions FROM role_permissions WHERE role = %s
            """
            current_result = db.execute_query(current_permissions_query, (role_name,))
            current_permissions = {}
            if current_result:
                current_permissions = json.loads(current_result[0]['permissions'])
            
            # Store permissions in object format (same as frontend)
            # NO CONVERSION NEEDED - frontend and database use same format
            permissions_json = json.dumps(role_permissions)
            
            logger.info(f"Storing permissions for {role_name} in object format")
            
            # Update the role_permissions table
            update_query = """
            UPDATE role_permissions 
            SET permissions = %s, updated_by = %s, updated_at = %s
            WHERE role = %s
            """
            
            rows_affected = db.execute_query(update_query, (
                permissions_json,
                current_user.username,
                datetime.now(),
                role_name
            ))
            
            if rows_affected > 0:
                updated_count += 1
                logger.info(f"Updated permissions for role: {role_name}")
                
                # Track changes for audit log
                changes = []
                for module, module_perms in role_permissions.items():
                    for action, value in module_perms.items():
                        old_value = current_permissions.get(module, {}).get(action, False)
                        if old_value != value:
                            changes.append(f"{module}.{action}: {old_value} → {value}")
                
                if changes:
                    audit_details.append(f"{role_name}: {', '.join(changes)}")
                
            else:
                # If role doesn't exist, create it
                insert_query = """
                INSERT INTO role_permissions 
                (role, permissions, updated_by, updated_at)
                VALUES (%s, %s, %s, %s)
                """
                
                db.execute_query(insert_query, (
                    role_name,
                    permissions_json,
                    current_user.username,
                    datetime.now()
                ))
                updated_count += 1
                logger.info(f"Created permissions for new role: {role_name}")
                audit_details.append(f"{role_name}: Created new role permissions")
        
        # CREATE AUDIT LOG ENTRY - CRITICAL FOR SECURITY
        if audit_details:  # Only log if there were actual changes
            audit_insert_query = """
            INSERT INTO audit_logs 
            (action, admin_name, admin_role, details, entity_type, entity_id, changes, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            # Extract only the roles that actually changed
            changed_roles = []
            for detail in audit_details:
                role_name = detail.split(':')[0]
                if role_name not in changed_roles:
                    changed_roles.append(role_name)
            
            audit_changes = {
                "changed_roles": changed_roles,  # Only roles that actually changed
                "total_roles_sent": list(permissions_data.keys()),  # All roles sent (for debugging)
                "actual_changes_count": len(audit_details),
                "changes_summary": audit_details,
                "timestamp": datetime.now().isoformat()
            }
            
            # Create more accurate audit log message
            if len(changed_roles) == 1:
                entity_id = f"Role: {changed_roles[0]}"
                summary = f"Updated permissions for role: {changed_roles[0]}"
            else:
                entity_id = f"Roles: {', '.join(changed_roles)}"
                summary = f"Updated permissions for {len(changed_roles)} roles: {', '.join(changed_roles)}"
            
            db.execute_query(audit_insert_query, (
                "Updated Permissions",
                current_user.full_name or current_user.username,
                current_user.role,
                f"{summary}. Changes: {'; '.join(audit_details)}",
                "Permissions",
                entity_id,
                json.dumps(audit_changes),
                datetime.now()
            ))
            
            logger.info(f"AUDIT LOG CREATED: Permission update by {current_user.username} for {len(changed_roles)} roles: {', '.join(changed_roles)}")
        else:
            logger.info(f"No permission changes detected - no audit log created")
        
        logger.info(f"Processed {updated_count} role permissions by user {current_user.username}")
        
        return {
            "success": True,
            "message": f"Successfully processed {updated_count} role permissions",
            "updated_count": updated_count,
            "changes_detected": len(audit_details) > 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating permissions"
        )

@router.get("/{role_name}")
async def get_role_permissions(
    role_name: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get permissions for a specific role"""
    try:
        db = get_db()
        
        query = """
        SELECT permissions
        FROM role_permissions 
        WHERE role = %s
        """
        
        result = db.execute_query(query, (role_name,))
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_name}' not found"
            )
        
        # Parse JSON permissions
        permissions = json.loads(result[0]['permissions'])
        
        return {
            "role": role_name,
            "permissions": permissions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting role permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving role permissions"
        )

@router.post("/sync")
async def sync_permissions_from_frontend(
    permissions_data: Dict[str, Any],
    current_user: UserInDB = Depends(get_current_user)
):
    """Sync permissions from frontend to database (one-time setup)"""
    try:
        # Check if user is Super Admin
        if current_user.role != "Super Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Super Admin can sync permissions"
            )
        
        db = get_db()
        
        # Clear existing permissions
        db.execute_query("DELETE FROM role_permissions")
        
        inserted_count = 0
        
        # Insert all permissions from frontend
        for role_name, role_permissions in permissions_data.items():
            
            permissions_json = json.dumps(role_permissions)
            
            insert_query = """
            INSERT INTO role_permissions 
            (role, permissions, updated_by, updated_at)
            VALUES (%s, %s, %s, %s)
            """
            
            db.execute_query(insert_query, (
                role_name,
                permissions_json,
                current_user.username,
                datetime.now()
            ))
            inserted_count += 1
        
        logger.info(f"Synced {inserted_count} role permissions to database by user {current_user.username}")
        
        return {
            "success": True,
            "message": f"Successfully synced {inserted_count} role permissions to database",
            "inserted_count": inserted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error syncing permissions"
        )