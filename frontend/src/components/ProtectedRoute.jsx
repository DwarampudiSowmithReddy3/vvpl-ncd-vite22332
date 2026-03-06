import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, module, requiredPermission = 'view' }) => {
  const { user, hasPermission } = useAuth();

  // CRITICAL DEBUG: Log every permission check
  if (import.meta.env.DEV) {
    console.log('🔒 ProtectedRoute Check:', {
      module,
      requiredPermission,
      userRole: user?.role,
      hasPermission: hasPermission(module, requiredPermission)
    });
  }

  // If no module specified, just check if user is authenticated
  if (!module) {
    if (import.meta.env.DEV) { console.log('⚠️ No module specified - allowing access'); }
    return children;
  }

  // Check if user has the required permission for the module
  const hasAccess = hasPermission(module, requiredPermission);
  
  // Log unauthorized access attempt to audit log
  useEffect(() => {
    if (!hasAccess && user) {
      const logUnauthorizedAccess = async () => {
        try {
          const moduleName = module === 'ncdSeries' ? 'NCD Series' :
                           module === 'interestPayout' ? 'Interest Payout' :
                           module === 'grievanceManagement' ? 'Grievance Management' :
                           module.charAt(0).toUpperCase() + module.slice(1);
          
          await apiService.createAuditLog({
            action: 'Unauthorized Access Attempt',
            admin_name: user.full_name || user.name || user.username,
            admin_role: user.role,
            details: `User "${user.username}" (${user.role}) attempted to access ${moduleName} page without ${requiredPermission} permission. Access was denied.`,
            entity_type: 'Security',
            entity_id: `${module}/${requiredPermission}`,
            changes: {
              attempted_module: module,
              required_permission: requiredPermission,
              user_role: user.role,
              username: user.username,
              access_denied: true,
              timestamp: new Date().toISOString(),
              page_url: window.location.pathname
            }
          });
          
          if (import.meta.env.DEV) { console.log('✅ Unauthorized access attempt logged to audit trail'); }
        } catch (error) {
          if (import.meta.env.DEV) { console.error('❌ Failed to log unauthorized access:', error); }
        }
      };
      
      logUnauthorizedAccess();
    }
  }, [hasAccess, user, module, requiredPermission]);
  
  if (!hasAccess) {
    if (import.meta.env.DEV) { console.error('🚨 ACCESS DENIED:', {
      module,
      requiredPermission,
      userRole: user?.role
    }); }
    
    return (
      <div className="access-denied-container">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ef4444"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" fill="#ef4444"/>
            </svg>
          </div>
          <h2 className="access-denied-title">Access Denied</h2>
          <p className="access-denied-message">
            Sorry, you are not authorized to access this page.
          </p>
          <div className="access-denied-details">
            <p><strong>Your Role:</strong> {user?.displayRole || user?.role || 'Unknown'}</p>
            <p><strong>Required Permission:</strong> {requiredPermission} access to {module}</p>
          </div>
          <div className="access-denied-actions">
            <button 
              className="back-button"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
            <button 
              className="dashboard-button"
              onClick={() => window.location.href = user?.role === 'Investor' ? '/investor/dashboard' : '/dashboard'}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (import.meta.env.DEV) { console.log('✅ ACCESS GRANTED:', {
    module,
    requiredPermission,
    userRole: user?.role
  }); }

  return children;
};

export default ProtectedRoute;