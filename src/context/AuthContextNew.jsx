import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      // Load REAL permissions from database
      loadUserPermissions();
    }
    setIsLoading(false);
  }, []);

  // Load REAL user permissions from database (NO HARDCODED)
  const loadUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found');
        return;
      }

      console.log('🔄 Loading REAL user permissions from database...');
      const response = await fetch('http://localhost:8003/api/v1/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ REAL permissions loaded from database:', data);
        setPermissions(data.permissions || {});
      } else {
        console.error('❌ Failed to load permissions:', response.status);
        setPermissions({});
      }
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      setPermissions({});
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8003/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
          user_type: 'admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const userData = {
          username: data.user_info.username,
          role: data.user_info.role,
          name: data.user_info.full_name,
          displayRole: data.user_info.role,
          email: data.user_info.email,
          id: data.user_info.id
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        setJustLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.access_token);
        
        // Load REAL permissions after login
        await loadUserPermissions();
        
        return { success: true, role: 'admin' };
      } else {
        const errorData = await response.json();
        console.log(`❌ Login failed: ${errorData.detail}`);
        return { success: false, error: errorData.detail || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Check if user has permission for a specific module and action (REAL CHECK)
  const hasPermission = (module, action = 'view') => {
    if (!user || !permissions) {
      return false;
    }
    
    // Check REAL permissions from database
    if (permissions[module] && typeof permissions[module][action] !== 'undefined') {
      return permissions[module][action] === true || permissions[module][action] === 1;
    }
    
    return false;
  };

  // Check if user can access a page/module (REAL CHECK)
  const canAccessModule = (module) => {
    return hasPermission(module, 'view');
  };

  // Update a single permission via API (REAL UPDATE)
  const updateSinglePermission = async (role, module, action, isGranted) => {
    try {
      if (!role || !module || !action || typeof isGranted !== 'boolean') {
        const error = `Invalid parameters: role=${role}, module=${module}, action=${action}, isGranted=${isGranted}`;
        console.error('❌ ' + error);
        return { success: false, error };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        return { success: false, error: 'Not authenticated' };
      }

      const requestData = {
        role_name: String(role),
        module_name: String(module),
        permission_type: String(action),
        is_granted: Boolean(isGranted)
      };

      console.log(`🔄 Updating permission in database: ${role} - ${module} - ${action} = ${isGranted}`);

      const response = await fetch('http://localhost:8003/api/v1/admin/permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Permission updated successfully in database`);
        
        // Reload permissions to get fresh data from database
        await loadAllPermissions();
        
        return { success: true, data: result };
      } else {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        }
        
        console.error(`❌ Failed to update permission: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = `Network error: ${error.message}`;
      console.error('❌ Error updating permission:', error);
      return { success: false, error: errorMessage };
    }
  };

  // Load all permissions for admin interface (REAL DATA)
  const loadAllPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return {};
      }

      console.log('🔄 Loading all permissions from database...');
      const response = await fetch('http://localhost:8003/api/v1/admin/all-permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const allPermissions = await response.json();
        console.log('✅ All permissions loaded from database');
        return allPermissions;
      } else {
        console.error('❌ Failed to load all permissions:', response.status);
        return {};
      }
    } catch (error) {
      console.error('❌ Error loading all permissions:', error);
      return {};
    }
  };

  const clearJustLoggedIn = () => {
    setJustLoggedIn(false);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setJustLoggedIn(false);
    setPermissions({});
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading,
      justLoggedIn, 
      login, 
      logout, 
      clearJustLoggedIn,
      hasPermission,
      canAccessModule,
      updateSinglePermission,
      loadUserPermissions,
      loadAllPermissions,
      permissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};