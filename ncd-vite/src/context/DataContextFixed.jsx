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
  const { isAuthenticated, user } = useAuth();
  
  // State for all data
  const [investors, setInvestors] = useState([]);
  const [series, setSeries] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load audit logs from API
  const loadAuditLogs = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔄 DataContext: Loading audit logs...');
      const backendLogs = await apiService.getAuditLogs({ limit: 50 });
      
      const transformedLogs = backendLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        adminName: log.admin_name,
        adminRole: log.admin_role,
        details: log.details,
        entityType: log.entity_type,
        entityId: log.entity_id,
        changes: log.changes
      }));
      
      setAuditLogs(transformedLogs);
      console.log('✅ DataContext: Audit logs loaded:', transformedLogs.length);
    } catch (error) {
      console.error('❌ DataContext: Failed to load audit logs:', error);
      setAuditLogs([]);
    }
  };

  // Load users from API
  const loadUsers = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔄 DataContext: Loading users...');
      const apiUsers = await apiService.getUsers();
      
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
      console.log('✅ DataContext: Users loaded:', transformedUsers.length);
    } catch (error) {
      console.error('❌ DataContext: Failed to load users:', error);
      setUsers([]);
    }
  };

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAuditLogs();
      loadUsers();
    } else {
      setAuditLogs([]);
      setUsers([]);
    }
  }, [isAuthenticated, user]);

  // Add audit log
  const addAuditLog = async (logData) => {
    try {
      console.log('🔄 DataContext: Adding audit log:', logData);
      
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
      console.log('✅ DataContext: Audit log created');
      
      // Reload audit logs
      await loadAuditLogs();
    } catch (error) {
      console.error('❌ DataContext: Failed to add audit log:', error);
    }
  };

  // Add user
  const addUser = async (userData) => {
    try {
      setLoading(true);
      console.log('🔄 DataContext: Adding user:', userData);
      
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
      console.log('✅ DataContext: User created:', newUser);
      
      // Reload users
      await loadUsers();
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ DataContext: Failed to add user:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (userId, userData) => {
    try {
      setLoading(true);
      console.log('🔄 DataContext: Updating user:', userId, userData);
      
      const apiUserData = {};
      if (userData.fullName !== undefined) apiUserData.full_name = userData.fullName;
      if (userData.email !== undefined) apiUserData.email = userData.email;
      if (userData.phone !== undefined) apiUserData.phone = userData.phone;
      if (userData.role !== undefined) apiUserData.role = userData.role;
      if (userData.password !== undefined) apiUserData.password = userData.password;
      
      const updatedUser = await apiService.updateUser(userId, apiUserData);
      console.log('✅ DataContext: User updated:', updatedUser);
      
      // Reload users
      await loadUsers();
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('❌ DataContext: Failed to update user:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      console.log('🔄 DataContext: Deleting user:', userId);
      
      await apiService.deleteUser(userId);
      console.log('✅ DataContext: User deleted');
      
      // Reload users
      await loadUsers();
      
      return { success: true };
    } catch (error) {
      console.error('❌ DataContext: Failed to delete user:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Legacy data (empty for now)
    investors,
    series,
    complaints,
    
    // API-integrated data
    users,
    auditLogs,
    loading,
    
    // User management functions
    addUser,
    updateUser,
    deleteUser,
    
    // Audit log functions
    addAuditLog,
    
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