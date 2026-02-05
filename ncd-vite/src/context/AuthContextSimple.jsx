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

// Simple permissions for Super Admin
const PERMISSIONS = {
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
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('authToken');
    if (token) {
      apiService.getCurrentUser()
        .then(userData => {
          const formattedUser = {
            ...userData,
            name: userData.full_name,
            displayRole: userData.role
          };
          setUser(formattedUser);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
        });
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    
    // Only handle admin login through API
    if (username === 'admin' && password === 'admin123') {
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
        setLoading(false);
        return { success: true, role: 'admin' };
        
      } catch (error) {
        setLoading(false);
        return { success: false, error: 'Login failed: ' + error.message };
      }
    }
    
    setLoading(false);
    return { success: false, error: 'Invalid credentials' };
  };

  const hasPermission = (module, action = 'view') => {
    if (!user || !user.role) return false;
    const userPermissions = PERMISSIONS[user.role];
    if (!userPermissions || !userPermissions[module]) return false;
    return userPermissions[module][action] === true;
  };

  const canAccessModule = (module) => {
    return hasPermission(module, 'view');
  };

  const updatePermissions = (newPermissions) => {
    Object.assign(PERMISSIONS, newPermissions);
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
      PERMISSIONS
    }}>
      {children}
    </AuthContext.Provider>
  );
};