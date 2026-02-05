import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import auditService from '../services/auditService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Permissions data structure - Production ready
const PERMISSIONS = {
  'Finance Executive': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false },
    grievanceManagement: { view: false, create: false, edit: false, delete: false }
  },
  'Finance Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: true, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false },
    grievanceManagement: { view: true, create: false, edit: false, delete: false }
  },
  'Compliance Base': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: true, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false },
    grievanceManagement: { view: true, create: false, edit: false, delete: false }
  },
  'Compliance Officer': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: true, edit: true, delete: false },
    investors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: true, edit: false, delete: false },
    compliance: { view: true, create: true, edit: true, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: true, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false },
    grievanceManagement: { view: true, create: true, edit: true, delete: false }
  },
  'Compliance Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: true, edit: true, delete: false },
    investors: { view: true, create: false, edit: true, delete: false },
    reports: { view: true, create: true, edit: true, delete: false },
    compliance: { view: true, create: true, edit: true, delete: true },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: true, create: true, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: false, edit: false, delete: false },
    grievanceManagement: { view: true, create: true, edit: true, delete: true }
  },
  'Investor Relationship Executive': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: false, create: false, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: true, create: true, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false },
    grievanceManagement: { view: true, create: true, edit: true, delete: false }
  },
  'Investor Relationship Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: true, create: true, edit: true, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false },
    grievanceManagement: { view: true, create: true, edit: true, delete: false }
  },
  'Board Member Base': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: false, edit: false, delete: false },
    grievanceManagement: { view: true, create: false, edit: false, delete: false }
  },
  'Board Member Head': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: true, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: true, edit: true, delete: false },
    grievanceManagement: { view: true, create: true, edit: true, delete: false }
  },
  'Admin': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: true, edit: true, delete: false },
    investors: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: true, edit: true, delete: false },
    compliance: { view: true, create: true, edit: true, delete: false },
    interestPayout: { view: true, create: true, edit: true, delete: false },
    communication: { view: true, create: true, edit: true, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: true, edit: true, delete: false },
    grievanceManagement: { view: true, create: true, edit: true, delete: false }
  },
  'Super Admin': {
    dashboard: { view: true, create: true, edit: true, delete: true },
    ncdSeries: { view: true, create: true, edit: true, delete: true },
    investors: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    compliance: { view: true, create: true, edit: true, delete: true },
    interestPayout: { view: true, create: true, edit: true, delete: true },
    communication: { view: true, create: true, edit: true, delete: true },
    administrator: { view: true, create: true, edit: true, delete: true },
    approval: { view: true, create: true, edit: true, delete: true },
    grievanceManagement: { view: true, create: true, edit: true, delete: true }
  },
  'Investor': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: false, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
    compliance: { view: false, create: false, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false },
    grievanceManagement: { view: false, create: false, edit: false, delete: false }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState(PERMISSIONS); // Add permissions state

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          const formattedUser = {
            ...userData,
            name: userData.full_name,
            displayRole: userData.role
          };
          setUser(formattedUser);
          setIsAuthenticated(true);
          
          // Load permissions from backend or use defaults
          try {
            const backendPermissions = await apiService.getPermissions();
            setPermissions(backendPermissions);
            console.log('✅ Loaded permissions from backend:', Object.keys(backendPermissions));
          } catch (permError) {
            console.warn('⚠️ Failed to load permissions from backend, using defaults:', permError.message);
            setPermissions(PERMISSIONS);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          apiService.logout();
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Production-ready login - ONLY uses backend API
  const login = async (username, password) => {
    setLoading(true);
    
    try {
      const response = await apiService.login(username, password);
      
      const userData = {
        ...response.user,
        name: response.user.full_name,
        displayRole: response.user.role
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Log successful login to audit trail
      try {
        await apiService.createAuditLog({
          action: 'User Login',
          admin_name: userData.name,
          admin_role: userData.role,
          details: `User ${username} logged in successfully`,
          entity_type: 'Authentication',
          entity_id: username,
          changes: {
            action: 'login',
            username: username,
            timestamp: new Date().toISOString(),
            ip_address: 'localhost', // Could be enhanced to get real IP
            user_agent: navigator.userAgent
          }
        });
        
        // Trigger audit log refresh in DataContext
        window.dispatchEvent(new CustomEvent('auditLogRefresh'));
        
      } catch (auditError) {
        console.error('Failed to log login audit:', auditError);
      }
      
      setLoading(false);
      
      return { 
        success: true, 
        role: response.user.role === 'Investor' ? 'investor' : 'admin' 
      };
      
    } catch (error) {
      console.error('Login failed:', error.message);
      
      // Log failed login attempt
      try {
        await apiService.createAuditLog({
          action: 'Failed Login Attempt',
          admin_name: username || 'Unknown',
          admin_role: 'Unknown',
          details: `Failed login attempt for username: ${username}`,
          entity_type: 'Authentication',
          entity_id: username || 'unknown',
          changes: {
            action: 'failed_login',
            username: username,
            error: error.message,
            timestamp: new Date().toISOString(),
            ip_address: 'localhost'
          }
        });
      } catch (auditError) {
        console.error('Failed to log failed login audit:', auditError);
      }
      
      setLoading(false);
      
      // Production error handling - no fallback accounts
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = 'Invalid username or password. Please try again.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Check if user has permission for a specific module and action
  const hasPermission = (module, action = 'view') => {
    if (!user || !user.role) return false;
    
    const userPermissions = PERMISSIONS[user.role];
    if (!userPermissions || !userPermissions[module]) return false;
    
    return userPermissions[module][action] === true;
  };

  // Check if user can access a page/module
  const canAccessModule = (module) => {
    return hasPermission(module, 'view');
  };

  // Update permissions (for admin interface) - FIXED VERSION WITH API CALLS
  const updatePermissions = async (newPermissions) => {
    console.log('🚨 CRITICAL DEBUG: updatePermissions called in AuthContext!');
    console.log('🚨 CRITICAL DEBUG: newPermissions keys:', Object.keys(newPermissions));
    
    try {
      console.log('🔄 AuthContext: Updating permissions...', Object.keys(newPermissions));
      
      // CRITICAL FIX: Merge the new permissions with existing permissions
      const mergedPermissions = {
        ...permissions,
        ...newPermissions
      };
      
      console.log('🔄 AuthContext: Merged permissions for roles:', Object.keys(mergedPermissions));
      
      // First, try to update permissions in the backend
      try {
        console.log('🔄 AuthContext: Sending ONLY changed permissions to backend...');
        console.log('🚨 CRITICAL DEBUG: About to call apiService.updatePermissions - CHECK NETWORK TAB!');
        
        // Send only the changed permissions to backend for precise audit logging
        const result = await apiService.updatePermissions(newPermissions);
        console.log('✅ AuthContext: Backend permissions updated successfully:', result);
        
        // Update the local permissions state with merged permissions
        setPermissions(mergedPermissions);
        
        // Also update the static PERMISSIONS object for backward compatibility
        Object.assign(PERMISSIONS, mergedPermissions);
        
        // Also save merged permissions to localStorage as backup
        localStorage.setItem('userPermissions', JSON.stringify(mergedPermissions));
        
        console.log('✅ AuthContext: Permissions updated successfully');
        
        return { success: true, message: result.message || 'Permissions updated successfully' };
        
      } catch (backendError) {
        console.error('❌ AuthContext: Backend update failed:', backendError);
        
        // Fallback to local state update only
        console.log('🔄 AuthContext: Falling back to local state update only...');
        setPermissions(mergedPermissions);
        Object.assign(PERMISSIONS, mergedPermissions);
        localStorage.setItem('userPermissions', JSON.stringify(mergedPermissions));
        
        return { 
          success: true, 
          message: 'Permissions updated locally (backend sync failed)',
          warning: backendError.message 
        };
      }
      
    } catch (error) {
      console.error('❌ AuthContext: Error updating permissions:', error);
      return { success: false, error: error.message };
    }
  };

  const clearJustLoggedIn = () => {
    setJustLoggedIn(false);
  };

  const logout = () => {
    // Log logout before clearing user data
    if (user) {
      try {
        apiService.createAuditLog({
          action: 'User Logout',
          admin_name: user.name,
          admin_role: user.role,
          details: `User ${user.username} logged out`,
          entity_type: 'Authentication',
          entity_id: user.username,
          changes: {
            action: 'logout',
            username: user.username,
            timestamp: new Date().toISOString(),
            session_duration: 'calculated' // Could calculate actual session time
          }
        });
      } catch (auditError) {
        console.error('Failed to log logout audit:', auditError);
      }
    }
    
    apiService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setJustLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading,
      loading,
      justLoggedIn, 
      login, 
      logout, 
      clearJustLoggedIn,
      hasPermission,
      canAccessModule,
      updatePermissions,
      permissions,
      PERMISSIONS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

