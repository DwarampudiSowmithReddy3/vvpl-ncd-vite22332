import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiService from '../services/api';
import auditService from '../services/auditService';
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
  
  // Refs to prevent multiple calls
  const loadingAuditLogsRef = useRef(false);
  const loadingUsersRef = useRef(false);
  const initializedRef = useRef(false);
  
  // State for all data
  const [investors, setInvestors] = useState([]);
  const [series, setSeries] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load audit logs from API
  const loadAuditLogs = async () => {
    if (!isAuthenticated || loadingAuditLogs || loadingAuditLogsRef.current) return; // Prevent multiple calls
    
    try {
      loadingAuditLogsRef.current = true;
      setLoadingAuditLogs(true);
      console.log('🔄 DataContext: Loading audit logs...');
      const backendLogs = await apiService.getAuditLogs({ limit: 100 }); // Increased limit
      
      console.log('🔍 DataContext: Raw backend logs:', backendLogs);
      
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
      
      console.log('🔍 DataContext: Transformed logs:', transformedLogs);
      setAuditLogs(transformedLogs);
      console.log('✅ DataContext: Audit logs loaded:', transformedLogs.length);
    } catch (error) {
      console.error('❌ DataContext: Failed to load audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoadingAuditLogs(false);
      loadingAuditLogsRef.current = false;
    }
  };

  // Load users from API
  const loadUsers = async () => {
    if (!isAuthenticated || loadingUsers || loadingUsersRef.current) return; // Prevent multiple calls
    
    try {
      loadingUsersRef.current = true;
      setLoadingUsers(true);
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
    } finally {
      setLoadingUsers(false);
      loadingUsersRef.current = false;
    }
  };

  // Load data when authenticated - FIXED to prevent infinite loop
  useEffect(() => {
    if (isAuthenticated && user && !initializedRef.current) {
      console.log('🔄 DataContext: User authenticated, loading data once...');
      initializedRef.current = true;
      
      // Load users and audit logs
      loadUsers();
      loadAuditLogs();
    } else if (!isAuthenticated) {
      console.log('🔄 DataContext: User not authenticated, clearing data...');
      initializedRef.current = false;
      setAuditLogs([]);
      setUsers([]);
    }
  }, [isAuthenticated, user?.id]); // Use user.id instead of user object to prevent infinite re-renders

  // Add audit log
  const addAuditLog = async (logData) => {
    // TEMPORARILY DISABLED - was causing infinite loop
    console.log('🔄 DataContext: Audit log creation temporarily disabled to prevent infinite loop');
    return;
    
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
      
      console.log('🔄 DataContext: Sending audit data to API:', apiLogData);
      const result = await apiService.createAuditLog(apiLogData);
      console.log('✅ DataContext: Audit log created successfully:', result);
      
      // Add the new log to the existing state instead of reloading all logs
      const newLog = {
        id: result.id,
        timestamp: result.timestamp,
        action: result.action,
        adminName: result.admin_name,
        adminRole: result.admin_role,
        details: result.details,
        entityType: result.entity_type,
        entityId: result.entity_id,
        changes: result.changes
      };
      
      setAuditLogs(prevLogs => [newLog, ...prevLogs]);
      console.log('✅ DataContext: Audit log added to state');
    } catch (error) {
      console.error('❌ DataContext: Failed to add audit log:', error);
      console.error('❌ DataContext: Error details:', error.message);
      // Don't throw error - audit logging should not break user operations
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
    loadAuditLogs,
    
    // Global audit service for all pages
    auditService,
    
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