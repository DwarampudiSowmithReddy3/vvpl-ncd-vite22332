import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load users from API
  const loadUsers = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 DataContext: Loading users from API...');
      
      const apiUsers = await apiService.getUsers();
      console.log('✅ DataContext: Users loaded from API:', apiUsers);
      
      // Transform API users to match frontend format
      const transformedUsers = apiUsers.map(apiUser => ({
        id: apiUser.id,
        userId: apiUser.user_id,
        username: apiUser.username,
        fullName: apiUser.full_name,
        role: apiUser.role,
        email: apiUser.email,
        phone: apiUser.phone,
        lastUsed: apiUser.last_login ? new Date(apiUser.last_login).toLocaleDateString() : 'Never',
        createdAt: apiUser.created_at,
        isActive: apiUser.is_active
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('❌ DataContext: Failed to load users:', error);
      setError(error.message);
      // Fallback to empty array
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load audit logs from API
  const loadAuditLogs = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔄 DataContext: Loading audit logs from API...');
      
      const apiLogs = await apiService.getAuditLogs({ limit: 50 });
      console.log('✅ DataContext: Audit logs loaded from API:', apiLogs);
      
      // Transform API logs to match frontend format
      const transformedLogs = apiLogs.map(apiLog => ({
        id: apiLog.id,
        action: apiLog.action,
        adminName: apiLog.admin_name,
        adminRole: apiLog.admin_role,
        details: apiLog.details,
        entityType: apiLog.entity_type,
        entityId: apiLog.entity_id,
        changes: apiLog.changes,
        timestamp: apiLog.timestamp
      }));
      
      setAuditLogs(transformedLogs);
    } catch (error) {
      console.error('❌ DataContext: Failed to load audit logs:', error);
      // Fallback to empty array
      setAuditLogs([]);
    }
  };

  // Load data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 DataContext: User authenticated, loading data...');
      loadUsers();
      loadAuditLogs();
    } else {
      console.log('🔄 DataContext: User not authenticated, clearing data...');
      setUsers([]);
      setAuditLogs([]);
    }
  }, [isAuthenticated, user]);

  // Add user via API
  const addUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 DataContext: Adding user via API:', userData);
      
      // Transform frontend format to API format
      const apiUserData = {
        user_id: userData.userId,
        username: userData.username,
        full_name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role
      };
      
      const newUser = await apiService.createUser(apiUserData);
      console.log('✅ DataContext: User created via API:', newUser);
      
      // Reload users to get updated list
      await loadUsers();
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ DataContext: Failed to add user:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user via API
  const updateUser = async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 DataContext: Updating user via API:', userId, userData);
      
      // Transform frontend format to API format
      const apiUserData = {};
      if (userData.fullName !== undefined) apiUserData.full_name = userData.fullName;
      if (userData.email !== undefined) apiUserData.email = userData.email;
      if (userData.phone !== undefined) apiUserData.phone = userData.phone;
      if (userData.role !== undefined) apiUserData.role = userData.role;
      if (userData.password !== undefined) apiUserData.password = userData.password;
      
      const updatedUser = await apiService.updateUser(userId, apiUserData);
      console.log('✅ DataContext: User updated via API:', updatedUser);
      
      // Reload users to get updated list
      await loadUsers();
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('❌ DataContext: Failed to update user:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete user via API
  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 DataContext: Deleting user via API:', userId);
      
      await apiService.deleteUser(userId);
      console.log('✅ DataContext: User deleted via API');
      
      // Reload users to get updated list
      await loadUsers();
      
      return { success: true };
    } catch (error) {
      console.error('❌ DataContext: Failed to delete user:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Add audit log via API
  const addAuditLog = async (logData) => {
    try {
      console.log('🔄 DataContext: Adding audit log via API:', logData);
      
      const apiLogData = {
        action: logData.action,
        admin_name: logData.adminName,
        admin_role: logData.adminRole,
        details: logData.details,
        entity_type: logData.entityType,
        entity_id: logData.entityId,
        changes: logData.changes
      };
      
      await apiService.createAuditLog(apiLogData);
      console.log('✅ DataContext: Audit log created via API');
      
      // Reload audit logs to get updated list
      await loadAuditLogs();
    } catch (error) {
      console.error('❌ DataContext: Failed to add audit log:', error);
      // Don't throw error for audit logs - they're not critical
    }
  };

  const value = {
    // Users
    users,
    addUser,
    updateUser,
    deleteUser,
    
    // Audit Logs
    auditLogs,
    addAuditLog,
    
    // State
    loading,
    error,
    
    // Utility functions
    refreshData: () => {
      loadUsers();
      loadAuditLogs();
    }
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};