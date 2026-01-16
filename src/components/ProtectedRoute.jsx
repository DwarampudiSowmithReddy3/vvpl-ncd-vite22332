import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, module, requiredPermission = 'view' }) => {
  const { user, hasPermission } = useAuth();

  // If no module specified, just check if user is authenticated
  if (!module) {
    return children;
  }

  // Check if user has the required permission for the module
  if (!hasPermission(module, requiredPermission)) {
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

  return children;
};

export default ProtectedRoute;