"""
Endpoint Permission Mapping
============================
Maps each endpoint to required permission
VERY CAREFULLY DEFINED
"""

# Permission mapping for all endpoints
ENDPOINT_PERMISSIONS = {
    # User Management
    "get_users": "view_users",
    "get_user": "view_users",
    "create_user": "create_user",
    "update_user": "edit_user",
    "delete_user": "delete_user",
    
    # Role & Permissions
    "get_permissions": "view_permissions",
    "update_permissions": "edit_permissions",
    
    # NCD Series Management
    "get_all_series": "view_ncd_series",
    "get_series": "view_ncd_series",
    "create_series": "create_ncd_series",
    "update_series": "edit_ncd_series",
    "delete_series": "delete_ncd_series",
    "approve_series": "approve_ncd_series",
    "reject_series": "approve_ncd_series",  # Same permission as approve
    
    # Series Documents
    "upload_series_document": "create_ncd_series",  # Can upload if can create
    "get_series_documents": "view_ncd_series",
    "delete_series_document": "delete_ncd_series",
    
    # Dashboard
    "get_dashboard_metrics": "view_dashboard",
    
    # Compliance
    "get_compliance_series": "view_compliance",
    "get_compliance_details": "view_compliance",
    "get_compliance_items": "view_compliance",
    "get_timesheet": "view_compliance",
    "update_timesheet": "edit_compliance",
    "submit_compliance_item": "edit_compliance",
    "upload_compliance_document": "edit_compliance",
    "get_compliance_documents": "view_compliance",
    "delete_compliance_document": "edit_compliance",
    
    # Audit Logs
    "get_audit_logs": "view_audit_logs",
    "create_audit_log": "create_audit_log",
    
    # Interest Payouts
    "get_all_payouts": "view_payouts",
    "get_export_payouts": "view_payouts",
    "get_payout_summary": "view_payouts",
    "import_payouts": "manage_payouts",
    
    # Authentication (no permission required - public)
    "login": None,
    "get_current_user": None,  # Only requires authentication
}


def get_required_permission(endpoint_name: str) -> str:
    """
    Get required permission for an endpoint
    Returns None if no permission required (public endpoint)
    """
    return ENDPOINT_PERMISSIONS.get(endpoint_name)
