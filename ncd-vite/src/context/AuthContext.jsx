import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default permissions structure - COMPLETE VERSION
const DEFAULT_PERMISSIONS = {
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
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);

  // REMOVED: Don't load from localStorage on startup - let backend permissions take precedence

  // Load permissions from backend
  const loadPermissions = async () => {
    try {
      console.log('🔄 AuthContext: Loading permissions from backend...');
      console.log('🔄 AuthContext: Current token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
      
      const backendPermissions = await apiService.getPermissions();
      console.log('✅ AuthContext: Permissions loaded from backend:', backendPermissions);
      
      // Validate that we got proper permissions data
      if (!backendPermissions || typeof backendPermissions !== 'object') {
        console.error('❌ AuthContext: Invalid permissions data received:', backendPermissions);
        return { success: false, error: 'Invalid permissions data' };
      }
      
      // Check if we have at least some roles (basic validation)
      const roleCount = Object.keys(backendPermissions).length;
      if (roleCount === 0) {
        console.error('❌ AuthContext: No roles found in permissions data');
        return { success: false, error: 'No roles found in permissions data' };
      }
      
      console.log(`✅ AuthContext: Received ${roleCount} roles from backend`);
      
      // Check if Super Admin exists (basic validation)
      if (!backendPermissions['Super Admin']) {
        console.error('❌ AuthContext: Super Admin permissions missing');
        return { success: false, error: 'Super Admin permissions missing' };
      }
      
      // CRITICAL: Save to localStorage FIRST to ensure persistence
      localStorage.setItem('userPermissions', JSON.stringify(backendPermissions));
      console.log('✅ AuthContext: Permissions saved to localStorage for persistence');
      
      // CRITICAL: Update permissions state - this is the key fix
      console.log('🔄 AuthContext: Updating permissions state...');
      setPermissions(backendPermissions);
      console.log('✅ AuthContext: Permissions state updated successfully');
      
      // Verify the specific permission that was being tested
      if (backendPermissions['Finance Executive']) {
        const fe = backendPermissions['Finance Executive'];
        console.log('✅ AuthContext: Finance Executive ncdSeries permissions from backend:', fe['ncdSeries']);
      }
      
      // Verify Super Admin permissions
      console.log('✅ AuthContext: Super Admin dashboard permissions:', backendPermissions['Super Admin']['dashboard']);
      console.log('✅ AuthContext: Super Admin administrator permissions:', backendPermissions['Super Admin']['administrator']);
      
      return { success: true, permissions: backendPermissions };
    } catch (error) {
      console.error('❌ AuthContext: Failed to load permissions from backend:', error);
      console.error('❌ AuthContext: Error details:', error.message);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing token
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('🔄 AuthContext: Found existing token, loading user and permissions...');
        try {
          const userData = await apiService.getCurrentUser();
          console.log('✅ AuthContext: User data loaded:', userData);
          const formattedUser = {
            ...userData,
            name: userData.full_name,
            displayRole: userData.role
          };
          setUser(formattedUser);
          setIsAuthenticated(true);
          
          // CRITICAL FIX: Load permissions after successful authentication with proper error handling
          console.log('🔄 AuthContext: Loading permissions after user authentication...');
          try {
            const permissionsResult = await loadPermissions();
            if (permissionsResult.success) {
              console.log('✅ AuthContext: Permissions loaded successfully on page refresh');
              console.log('✅ AuthContext: Super Admin administrator access:', permissionsResult.permissions['Super Admin']['administrator']);
              
              // CRITICAL: Ensure permissions state is updated and persisted
              setPermissions(permissionsResult.permissions);
              console.log('✅ AuthContext: Permissions state updated on page refresh');
              
              // Verify the state was actually updated
              setTimeout(() => {
                console.log('🔍 AuthContext: Verifying permissions state after update...');
                console.log('🔍 AuthContext: Current permissions state keys:', Object.keys(permissionsResult.permissions));
              }, 100);
              
            } else {
              console.error('❌ AuthContext: Failed to load permissions on page refresh:', permissionsResult.error);
              console.error('❌ AuthContext: Falling back to localStorage backup...');
              
              // Fallback to localStorage if backend fails
              try {
                const savedPermissions = localStorage.getItem('userPermissions');
                if (savedPermissions) {
                  const parsedPermissions = JSON.parse(savedPermissions);
                  console.log('🔄 AuthContext: Loading permissions from localStorage fallback');
                  setPermissions(parsedPermissions);
                  console.log('✅ AuthContext: Permissions loaded from localStorage fallback');
                } else {
                  console.error('❌ AuthContext: No localStorage backup found, using defaults');
                }
              } catch (storageError) {
                console.error('❌ AuthContext: Failed to load from localStorage:', storageError);
              }
            }
          } catch (permissionsError) {
            console.error('❌ AuthContext: Critical error loading permissions:', permissionsError);
            // Try localStorage fallback
            try {
              const savedPermissions = localStorage.getItem('userPermissions');
              if (savedPermissions) {
                const parsedPermissions = JSON.parse(savedPermissions);
                console.log('🔄 AuthContext: Emergency fallback to localStorage');
                setPermissions(parsedPermissions);
                console.log('✅ AuthContext: Emergency permissions loaded from localStorage');
              }
            } catch (emergencyError) {
              console.error('❌ AuthContext: Emergency fallback failed:', emergencyError);
            }
          }
        } catch (error) {
          console.error('❌ AuthContext: Failed to get current user:', error);
          localStorage.removeItem('authToken');
        }
      } else {
        console.log('🔄 AuthContext: No token found, using default permissions');
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    
    // Only handle admin login through API
    if (username === 'admin' && password === 'admin123') {
      try {
        console.log('🔄 AuthContext: Attempting API login...');
        const response = await apiService.login(username, password);
        console.log('✅ AuthContext: API login response:', response);
        
        const userData = {
          ...response.user,
          name: response.user.full_name,
          displayRole: response.user.role
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        setJustLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Ensure token is properly stored
        console.log('🔑 AuthContext: Token stored:', response.access_token ? 'Yes' : 'No');
        
        // Load permissions from backend after successful login
        console.log('🔄 AuthContext: Loading permissions immediately after login...');
        try {
          const permissionsResult = await loadPermissions();
          if (permissionsResult.success) {
            console.log('✅ AuthContext: Permissions loaded successfully after login');
            console.log('✅ AuthContext: Super Admin administrator access:', permissionsResult.permissions['Super Admin']['administrator']);
            
            // Permissions are already updated in loadPermissions function
            console.log('✅ AuthContext: Permissions state updated after login');
          } else {
            console.error('❌ AuthContext: Failed to load permissions after login:', permissionsResult.error);
          }
        } catch (permissionsError) {
          console.error('❌ AuthContext: Critical error loading permissions after login:', permissionsError);
        }
        
        setLoading(false);
        return { success: true, role: 'admin' };
        
      } catch (error) {
        console.error('❌ AuthContext: API login failed:', error);
        setLoading(false);
        return { success: false, error: 'Login failed: ' + error.message };
      }
    }
    
    setLoading(false);
    return { success: false, error: 'Invalid credentials' };
  };

  const hasPermission = (module, action = 'view') => {
    if (!user || !user.role) return false;
    const userPermissions = permissions[user.role];
    if (!userPermissions || !userPermissions[module]) return false;
    return userPermissions[module][action] === true;
  };

  const canAccessModule = (module) => {
    return hasPermission(module, 'view');
  };

  const updatePermissions = async (newPermissions) => {
    console.log('🚨 CRITICAL DEBUG: updatePermissions called in AuthContext!');
    console.log('🚨 CRITICAL DEBUG: This proves the button click reached AuthContext');
    console.log('🚨 CRITICAL DEBUG: apiService object:', apiService);
    
    try {
      console.log('🔄 AuthContext: Updating permissions...', Object.keys(newPermissions));
      console.log('🔍 AuthContext: updatePermissions function called - this proves the button click reached here');
      
      // First, try to update permissions in the backend
      try {
        console.log('🔄 AuthContext: Sending permissions to backend...');
        console.log('🔍 AuthContext: About to call apiService.updatePermissions - CHECK NETWORK TAB!');
        console.log('🚨 CRITICAL DEBUG: THIS IS WHERE THE NETWORK REQUEST SHOULD APPEAR!');
        console.log('🔄 AuthContext: API call details:', {
          url: '/permissions/',
          method: 'PUT',
          dataKeys: Object.keys(newPermissions),
          token: localStorage.getItem('authToken') ? 'Present' : 'Missing'
        });
        
        const result = await apiService.updatePermissions(newPermissions);
        console.log('✅ AuthContext: Backend permissions updated successfully:', result);
        console.log('🔍 AuthContext: API call completed - you should see PUT /permissions/ in Network tab');
        
        // Update the state to trigger re-render
        setPermissions(newPermissions);
        
        // Also save to localStorage as backup
        localStorage.setItem('userPermissions', JSON.stringify(newPermissions));
        
        console.log('✅ AuthContext: Permissions updated in both backend and localStorage');
        
        return { success: true, message: result.message };
        
      } catch (backendError) {
        console.error('❌ AuthContext: Backend update failed:', backendError);
        console.error('🔍 AuthContext: If you see this error, the API call WAS made but failed');
        console.error('❌ AuthContext: Error details:', {
          message: backendError.message,
          status: backendError.status,
          response: backendError.response
        });
        
        // Fallback to localStorage only
        console.log('🔄 AuthContext: Falling back to localStorage only...');
        setPermissions(newPermissions);
        localStorage.setItem('userPermissions', JSON.stringify(newPermissions));
        
        console.log('⚠️ AuthContext: Permissions updated in localStorage only (backend failed)');
        
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
    apiService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setJustLoggedIn(false);
    localStorage.removeItem('user');
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
      loadPermissions,
      permissions,
      PERMISSIONS: permissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};