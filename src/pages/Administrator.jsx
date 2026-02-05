import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import apiService from '../services/api';
import './Administrator.css';
import { MdAdminPanelSettings, MdSearch, MdPersonAdd, MdClose, MdSecurity, MdOutlineFileDownload, MdDelete } from "react-icons/md";
import { FaEye, FaUser, FaUserShield, FaUserTie, FaUserCog, FaUsers } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";

const Administrator = () => {
  const navigate = useNavigate();
  const { permissions, updatePermissions, hasPermission, PERMISSIONS } = useAuth();
  const { auditLogs, addAuditLog, loadAuditLogs } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // CRITICAL DEBUG: Check what we're getting from AuthContext
  console.log('🚨 CRITICAL DEBUG: Administrator component loaded');
  console.log('🚨 CRITICAL DEBUG: permissions from useAuth:', permissions);
  console.log('🚨 CRITICAL DEBUG: PERMISSIONS from useAuth:', PERMISSIONS);
  console.log('🚨 CRITICAL DEBUG: permissions type:', typeof permissions);
  console.log('🚨 CRITICAL DEBUG: permissions is null/undefined:', permissions == null);

  // Use permissions or fallback to PERMISSIONS or empty object
  const currentPermissions = permissions || PERMISSIONS || {};
  console.log('🚨 CRITICAL DEBUG: currentPermissions:', currentPermissions);
  console.log('🚨 CRITICAL DEBUG: currentPermissions keys:', Object.keys(currentPermissions));

  // Define all available roles
  const ALL_ROLES = [
    'Finance Executive',
    'Finance Manager', 
    'Compliance Base',
    'Compliance Officer',
    'Investor Relationship Executive',
    'Investor Relationship Manager',
    'Board Member Base',
    'Board Member Head',
    'Admin',
    'Super Admin',
    'Investor'
  ];
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  
  // Users data - loaded from API
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load users from API on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load audit logs when component mounts or when date filters change
  useEffect(() => {
    // FIXED: Only load audit logs once on mount, not on every render
    if (loadAuditLogs) {
      console.log('🔄 Administrator: Loading audit logs once on mount');
      loadAuditLogs();
    }
  }, []); // Empty dependency array - load only once on mount

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await apiService.getUsers();
      console.log('✅ Users loaded from API:', usersData);
      
      // Map API response to frontend format
      const mappedUsers = usersData.map(user => ({
        id: user.id,
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        lastUsed: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
        createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
        isActive: user.is_active
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      // Keep empty array if API fails
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // User logs data - starts empty for clean state
  const [userLogs, setUserLogs] = useState([]);

  // Remove local permissions state - use AuthContext permissions instead
  // const [permissions, setPermissions] = useState(PERMISSIONS || {});

  const [formData, setFormData] = useState({
    userId: '',
    username: '',
    fullName: '',
    role: 'Finance Executive',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '+91 '
  });

  const [editFormData, setEditFormData] = useState({
    username: '',
    fullName: '',
    role: 'Finance Executive',
    newPassword: '',
    confirmPassword: '',
    newEmail: '',
    oldEmail: '',
    newPhone: '+91 ',
    oldPhone: '+91 '
  });

  const [errors, setErrors] = useState({});

  const filteredUsers = useMemo(() => {
    // Only show active users
    const activeUsers = users.filter(user => user.isActive !== false);
    
    if (!searchTerm.trim()) return activeUsers;
    
    const searchLower = searchTerm.toLowerCase();
    return activeUsers.filter(user => 
      (user.username || '').toLowerCase().includes(searchLower) ||
      (user.userId || '').toLowerCase().includes(searchLower) ||
      (user.role || '').toLowerCase().includes(searchLower) ||
      (user.fullName || '').toLowerCase().includes(searchLower) ||
      (user.lastUsed || '').toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm]);

  // Get total count of active users (before limiting to 7)
  const totalActiveUsersCount = useMemo(() => {
    return users.filter(user => user.isActive !== false).length;
  }, [users]);

  const filteredLogs = useMemo(() => {
    const filtered = auditLogs.filter(log => {
      // Filter by date range
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const matchesDateRange = logDate >= fromDate && logDate <= toDate;
      
      // Show ALL audit logs - no exclusions
      return matchesDateRange;
    });
    
    // Return only latest 10 logs if not showing all
    if (!showAllLogs) {
      return filtered.slice(0, 10);
    }
    
    return filtered;
  }, [auditLogs, fromDate, toDate, showAllLogs]);

  // Get total count of filtered logs (before limiting to 10)
  const totalFilteredLogsCount = useMemo(() => {
    return auditLogs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const matchesDateRange = logDate >= fromDate && logDate <= toDate;
      
      // Show ALL audit logs - no exclusions
      return matchesDateRange;
    }).length;
  }, [auditLogs, fromDate, toDate]);

  // Filtered users for display (show only 7 by default, like audit logs show 10)
  const displayedUsers = useMemo(() => {
    // Only show active users
    const activeUsers = users.filter(user => user.isActive !== false);
    
    // Return only latest 7 users if not showing all
    if (!showAllUsers) {
      return activeUsers.slice(0, 7);
    }
    
    return activeUsers;
  }, [users, showAllUsers]);

  const validateForm = (data, isEdit = false) => {
    const newErrors = {};
    
    if (isEdit) {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (data.newPassword && data.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
    } else {
      if (!data.userId.trim()) newErrors.userId = 'User ID is required';
      if (!data.username.trim()) newErrors.username = 'Username is required';
      if (!data.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!data.password) newErrors.password = 'Password is required';
      if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (data.password !== data.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!data.email.trim()) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Email is invalid';
      
      // Check for duplicates
      const duplicateUserId = users.find(u => u.userId && u.userId.toLowerCase() === data.userId.toLowerCase());
      if (duplicateUserId) newErrors.userId = 'User ID already exists';
      
      const duplicateUsername = users.find(u => u.username && u.username.toLowerCase() === data.username.toLowerCase());
      if (duplicateUsername) newErrors.username = 'Username already exists';
      
      const duplicateEmail = users.find(u => u.email && u.email.toLowerCase() === data.email.toLowerCase());
      if (duplicateEmail) newErrors.email = 'Email already exists';
      
      const duplicatePhone = users.find(u => u.phone && u.phone === data.phone);
      if (duplicatePhone) newErrors.phone = 'Phone number already exists';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateUserId = () => {
    if (users.length === 0) return 'USR001';
    
    const lastUser = users[users.length - 1];
    const lastId = lastUser && lastUser.userId ? parseInt(lastUser.userId.replace(/[A-Z]/g, '')) : 0;
    return `USR${String(lastId + 1).padStart(3, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    try {
      setLoading(true);
      
      // Create user via API
      const userData = {
        user_id: formData.userId,
        username: formData.username,
        full_name: formData.fullName,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      };

      console.log('🔄 Creating user via API:', userData);
      const newUser = await apiService.createUser(userData);
      console.log('✅ User created successfully:', newUser);
      
      // Reload users from API to get updated list (audit log created automatically by backend)
      await loadUsers();
      
      setShowAddUserModal(false);
      setFormData({
        userId: '',
        username: '',
        fullName: '',
        role: 'Finance Executive',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '+91 '
      });
      setErrors({});
      
      showSuccess(`User ${formData.username} created successfully and saved to database`);
      
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      setErrors({ 
        general: error.message || 'Failed to create user. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(editFormData, true)) return;

    try {
      setLoading(true);
      
      // Prepare update data for API
      const updateData = {};
      const changes = [];

      if (editFormData.fullName !== (selectedUser.full_name || selectedUser.fullName)) {
        updateData.full_name = editFormData.fullName;
        changes.push('full name');
      }
      
      if (editFormData.newEmail && editFormData.newEmail !== editFormData.oldEmail) {
        updateData.email = editFormData.newEmail;
        changes.push('email');
      }
      
      if (editFormData.newPhone && editFormData.newPhone !== editFormData.oldPhone) {
        updateData.phone = editFormData.newPhone;
        changes.push('phone number');
      }
      
      if (editFormData.role !== selectedUser.role) {
        updateData.role = editFormData.role;
        changes.push('role');
      }
      
      if (editFormData.newPassword && editFormData.newPassword !== '') {
        updateData.password = editFormData.newPassword;
        changes.push('password');
      }

      if (changes.length === 0) {
        setErrors({ general: 'No changes detected from previous data' });
        setLoading(false);
        return;
      }

      console.log('🔄 Updating user via API:', { userId: selectedUser.id, updateData });
      
      // Update user via API
      const updatedUser = await apiService.updateUser(selectedUser.id, updateData);
      console.log('✅ User updated successfully:', updatedUser);
      
      // Reload users from API to get updated list (audit log created automatically by backend)
      await loadUsers();
      
      setShowEditUserModal(false);
      setSelectedUser(null);
      setErrors({});
      
      showSuccess(`${selectedUser.username}: ${changes.join(', ')} updated successfully`);
      
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      setErrors({ 
        general: error.message || 'Failed to update user. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        setLoading(true);
        
        console.log('🔄 Deleting user via API:', userToDelete.id);
        
        // Delete user via API
        const result = await apiService.deleteUser(userToDelete.id);
        console.log('✅ User deleted successfully:', result);
        
        // Reload users from API to get updated list (audit log created automatically by backend)
        await loadUsers();
        
        showSuccess(`User ${userToDelete.username} deleted successfully`);
        
      } catch (error) {
        console.error('❌ Failed to delete user:', error);
        showSuccess(`Failed to delete user: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };
  
  const handleExportAuditLog = () => {
    const headers = ['Date & Time', 'User Name', 'User Role', 'Action', 'Affected Account', 'Entity Type', 'Details'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('en-IN'),
      log.adminName,
      log.adminRole,
      log.action,
      log.entityId || 'N/A',
      log.entityType || 'N/A',
      log.details
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.download = fileName;
    a.click();
    
    // Add audit log for document download
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `Downloaded Audit Log (${filteredLogs.length} entries, CSV format)`,
      entityType: 'Audit Log',
      entityId: 'All Logs',
      changes: {
        documentType: 'Audit Log',
        fileName: fileName,
        format: 'CSV',
        recordCount: filteredLogs.length
      }
    });
  };
  
  const getActionColor = (action) => {
    if (action.includes('Created')) return 'green';
    if (action.includes('Edited')) return 'blue';
    if (action.includes('Deleted') || action.includes('Rejected')) return 'red';
    if (action.includes('Approved')) return 'purple';
    if (action.includes('Investment')) return 'orange';
    return 'gray';
  };

  const handleViewUser = (user) => {
    console.log('Opening edit modal for user:', user); // Debug log
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      fullName: user.full_name || user.fullName, // Handle both API and local format
      role: user.role,
      newPassword: '',
      confirmPassword: '',
      newEmail: user.email,
      oldEmail: user.email,
      newPhone: user.phone,
      oldPhone: user.phone
    });
    setShowEditUserModal(true);
    
    // Scroll to top when modal opens
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleAddUserClick = () => {
    setShowAddUserModal(true);
    // Scroll to top when modal opens
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Super Admin': return <FaUserShield className="role-icon super-admin" />;
      case 'Admin': return <FaUserCog className="role-icon admin" />;
      case 'Finance Manager': 
      case 'Investor Relationship Manager': 
      case 'Board Member Head': return <FaUserTie className="role-icon manager" />;
      case 'Finance Executive':
      case 'Compliance Base':
      case 'Compliance Officer':
      case 'Investor Relationship Executive':
      case 'Board Member Base': return <FaUser className="role-icon executive" />;
      case 'Investor': return <FaUsers className="role-icon investor" />;
      default: return <FaUser className="role-icon" />;
    }
  };

  // Permission toggle handler - FIXED TO SEND ONLY CHANGED ROLE
  const handlePermissionToggle = async (role, module, action) => {
    console.log('🚨 CRITICAL DEBUG: Permission toggle clicked!');
    console.log('🚨 CRITICAL DEBUG: Changing permission for role:', role, 'module:', module, 'action:', action);
    
    // CRITICAL FIX: Add safety check for permissions
    if (!currentPermissions || !currentPermissions[role] || !currentPermissions[role][module]) {
      console.error('❌ Permissions object is not available:', { currentPermissions, role, module, action });
      showSuccess('Error: Permissions not loaded');
      return;
    }
    
    // CRITICAL FIX: Check if updatePermissions is a function
    if (typeof updatePermissions !== 'function') {
      console.error('🚨 CRITICAL ERROR: updatePermissions is not a function!', typeof updatePermissions);
      showSuccess('Error: updatePermissions function not available');
      return;
    }
    
    const oldValue = currentPermissions[role][module][action];
    const newValue = !oldValue;
    
    // CRITICAL FIX: Only send the specific role that changed, not all roles
    const changedRolePermissions = {
      [role]: {
        ...currentPermissions[role],
        [module]: {
          ...currentPermissions[role][module],
          [action]: newValue
        }
      }
    };
    
    // Also update the full permissions object for local state
    const updatedPermissions = {
      ...currentPermissions,
      [role]: changedRolePermissions[role]
    };
    
    try {
      // CRITICAL FIX: Send only the changed role to backend for precise audit logging
      console.log('🚨 CRITICAL DEBUG: Sending only changed role to backend:', role);
      const result = await updatePermissions(changedRolePermissions);
      
      console.log('🚨 CRITICAL DEBUG: updatePermissions result:', result);
      
      if (result && result.success) {
        console.log('✅ Permission toggled successfully (API call succeeded):', `${role}.${module}.${action}`, oldValue, '→', newValue);
        showSuccess(`${role}: ${module} ${action} permission ${newValue ? 'granted' : 'revoked'}`);
        
        // CRITICAL FIX: Add audit logging for permission changes
        try {
          console.log('🔄 Adding audit log for permission change...');
          await addAuditLog({
            action: 'Permission Updated',
            adminName: user ? user.name : 'Unknown Admin',
            adminRole: user ? user.displayRole : 'Unknown Role',
            details: `${role}: ${module} ${action} permission ${newValue ? 'granted' : 'revoked'} (${oldValue ? 'true' : 'false'} → ${newValue ? 'true' : 'false'})`,
            entityType: 'Permission System',
            entityId: `${role}.${module}.${action}`,
            changes: {
              role: role,
              module: module,
              action: action,
              oldValue: oldValue,
              newValue: newValue,
              permissionPath: `${role}.${module}.${action}`,
              timestamp: new Date().toISOString()
            }
          });
          console.log('✅ Audit log created for permission change');
          
          // CRITICAL: Refresh audit logs to show the new entry immediately
          if (loadAuditLogs) {
            console.log('🔄 Refreshing audit logs after permission change...');
            setTimeout(() => {
              loadAuditLogs();
            }, 500); // Small delay to ensure backend audit log is created first
          }
          
        } catch (auditError) {
          console.error('❌ Failed to create audit log for permission change:', auditError);
          // Don't fail the permission update if audit logging fails
        }
        
        if (result.warning) {
          console.warn('⚠️ Backend sync warning:', result.warning);
        }
        
        // CRITICAL FIX: Refresh audit logs after permission change
        try {
          console.log('🔄 Refreshing audit logs after permission change...');
          if (loadAuditLogs) {
            await loadAuditLogs();
            console.log('✅ Audit logs refreshed successfully');
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh audit logs:', refreshError);
        }
      } else {
        console.error('❌ Permission toggle failed:', result?.error);
        showSuccess(`Error: ${result?.error || 'Failed to update permissions'}`);
      }
    } catch (error) {
      console.error('❌ Permission toggle error:', error);
      showSuccess(`Error: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div className="administrator-container">
        <div className="administrator-header">
          <div className="header-content">
            <h1 className="page-title">Administrator</h1>
          </div>
          {activeTab === 'users' && hasPermission('administrator', 'create') && (
            <button 
              className="add-user-button" 
              onClick={handleAddUserClick}
            >
              <MdPersonAdd size={20} /> Add User
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers size={18} />
            Users
          </button>
          {hasPermission('administrator', 'edit') && (
            <button 
              className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              <MdSecurity size={18} />
              Permissions
            </button>
          )}
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="tab-content">
            {/* Search Section */}
            <div className="search-section">
              <div className="search-container-main">
                <div className="search-input-wrapper">
                  <MdSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by username, user ID, role, or last used..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-main"
                  />
                </div>
              </div>
            </div>

            {/* Search Results Table (if searching) */}
            {searchTerm && (
              <div className="users-table-section">
                <div className="table-header">
                  <h3 className="section-title">Search Results ({filteredUsers.length} found)</h3>
                </div>
                
                <div className="table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Last Used</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="user-row">
                          <td>
                            <span className="user-id">{user.userId}</span>
                          </td>
                          <td>
                            <div className="user-info">
                              <span className="username">{user.username}</span>
                              <span className="full-name">{user.fullName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="role-cell">
                              {getRoleIcon(user.role)}
                              <span className={`role-badge ${user.role.toLowerCase().replace(' ', '-')}`}>
                                {user.role}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="last-used">{user.lastUsed}</span>
                          </td>
                          <td>
                            <div className="user-actions">
                              <button
                                className="view-button"
                                onClick={() => handleViewUser(user)}
                              >
                                <FaEye size={16} /> {hasPermission('administrator', 'edit') ? 'Edit' : 'View'}
                              </button>
                              {hasPermission('administrator', 'delete') && (
                                <button
                                  className="delete-button"
                                  onClick={() => handleDeleteUser(user)}
                                  title="Delete User"
                                >
                                  <MdDelete size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Mobile Cards for Search Results */}
                  <div className="mobile-users-list">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="mobile-user-card">
                        <div className="mobile-user-header">
                          <div className="mobile-user-info">
                            <h4>{user.username}</h4>
                            <span className="user-id">{user.userId}</span>
                          </div>
                          <span className={`role-badge ${user.role.toLowerCase().replace(' ', '-')}`}>
                            {user.role}
                          </span>
                        </div>
                        
                        <div className="mobile-user-details">
                          <div className="mobile-user-item">
                            <span className="mobile-user-label">Full Name</span>
                            <span className="mobile-user-value">{user.fullName}</span>
                          </div>
                          <div className="mobile-user-item">
                            <span className="mobile-user-label">Last Used</span>
                            <span className="mobile-user-value">{user.lastUsed}</span>
                          </div>
                        </div>
                        
                        <div className="mobile-user-footer">
                          <span className="mobile-user-meta">Role: {user.role}</span>
                          <button
                            className="mobile-view-button"
                            onClick={() => handleViewUser(user)}
                          >
                            <FaEye size={12} /> {hasPermission('administrator', 'edit') ? 'Edit' : 'View'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {filteredUsers.length === 0 && (
                    <div className="no-logs">
                      <p>No users found matching "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recently Added Users Table (always visible) */}
            <div className="users-table-section">
              <div className="table-header">
                <h3 className="section-title">Recently Added Users</h3>
              </div>
              
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Last Used</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUsers.map((user) => (
                      <tr key={user.id} className="user-row">
                        <td>
                          <span className="user-id">{user.userId}</span>
                        </td>
                        <td>
                          <div className="user-info">
                            <span className="username">{user.username}</span>
                            <span className="full-name">{user.fullName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="role-cell">
                            {getRoleIcon(user.role)}
                            <span className={`role-badge ${user.role.toLowerCase().replace(' ', '-')}`}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="last-used">{user.lastUsed}</span>
                        </td>
                        <td>
                          <div className="user-actions">
                            <button
                              className="view-button"
                              onClick={() => handleViewUser(user)}
                            >
                              <FaEye size={16} /> {hasPermission('administrator', 'edit') ? 'Edit' : 'View'}
                            </button>
                            {hasPermission('administrator', 'delete') && (
                              <button
                                className="delete-button"
                                onClick={() => handleDeleteUser(user)}
                                title="Delete User"
                              >
                                <MdDelete size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Mobile Cards for Recently Added Users */}
                <div className="mobile-users-list">
                  {displayedUsers.map((user) => (
                    <div key={user.id} className="mobile-user-card">
                      <div className="mobile-user-header">
                        <div className="mobile-user-info">
                          <h4>{user.username}</h4>
                          <span className="user-id">{user.userId}</span>
                        </div>
                        <span className={`role-badge ${user.role.toLowerCase().replace(' ', '-')}`}>
                          {user.role}
                        </span>
                      </div>
                      
                      <div className="mobile-user-details">
                        <div className="mobile-user-item">
                          <span className="mobile-user-label">Full Name</span>
                          <span className="mobile-user-value">{user.fullName}</span>
                        </div>
                        <div className="mobile-user-item">
                          <span className="mobile-user-label">Last Used</span>
                          <span className="mobile-user-value">{user.lastUsed}</span>
                        </div>
                      </div>
                      
                      <div className="mobile-user-footer">
                        <span className="mobile-user-meta">Role: {user.role}</span>
                        <button
                          className="mobile-view-button"
                          onClick={() => handleViewUser(user)}
                        >
                          <FaEye size={12} /> {hasPermission('administrator', 'edit') ? 'Edit' : 'View'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* See All Users Button */}
              {!showAllUsers && totalActiveUsersCount > 7 && (
                <div className="see-all-logs-container">
                  <button 
                    className="see-all-logs-button"
                    onClick={() => setShowAllUsers(true)}
                  >
                    See All Users ({totalActiveUsersCount} total)
                  </button>
                </div>
              )}
              
              {showAllUsers && totalActiveUsersCount > 7 && (
                <div className="see-all-logs-container">
                  <button 
                    className="see-all-logs-button"
                    onClick={() => setShowAllUsers(false)}
                  >
                    Show Less (Latest 7 only)
                  </button>
                </div>
              )}
            </div>

            {/* Audit Log Section */}
            <div className="logs-section">
              <div className="logs-header">
                <h3 className="section-title">Audit Log</h3>
                <div className="audit-log-actions">
                  <div className="date-range-selector">
                    <div className="date-input-group">
                      <label>From:</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                    <div className="date-input-group">
                      <label>To:</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                  </div>
                  
                  <div className="audit-log-buttons">
                    <button 
                      onClick={() => {
                        console.log('🔄 Manual audit log refresh clicked');
                        if (loadAuditLogs) {
                          loadAuditLogs();
                        }
                      }} 
                      className="refresh-button"
                      title="Refresh audit logs from database"
                    >
                      🔄 Refresh
                    </button>
                    <button onClick={handleExportAuditLog} className="export-button">
                      <MdOutlineFileDownload size={18} /> Export
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="table-container">
                {filteredLogs.length === 0 ? (
                  <div className="no-logs">
                    <HiOutlineDocumentText size={48} />
                    <h3>No audit logs found</h3>
                    <p>No changes have been recorded yet or your filters returned no results.</p>
                  </div>
                ) : (
                  <table className="logs-table audit-logs-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Affected Account</th>
                        <th>Entity</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div className="date-time-cell">
                              <div className="date">
                                {new Date(log.timestamp).toLocaleDateString('en-IN')}
                              </div>
                              <div className="time">
                                {new Date(log.timestamp).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="admin-cell">
                              <div className="admin-name">{log.adminName}</div>
                              <div className="admin-role">{log.adminRole}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`action-badge ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <div className="affected-account-cell">
                              {log.entityId ? (
                                <>
                                  <div className="affected-account-name">{log.entityId}</div>
                                  <div className="affected-account-type">{log.entityType || 'N/A'}</div>
                                </>
                              ) : (
                                <span className="no-account">N/A</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="entity-cell">
                              <div className="entity-type">{log.entityType || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="details-cell">
                            <div className="details-content">
                              {log.details}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {/* Mobile Cards for Audit Logs */}
                <div className="mobile-logs-list">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="mobile-log-card">
                      <div className="mobile-log-header">
                        <span className={`action-badge ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="mobile-log-time">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      
                      <div className="mobile-log-details">
                        <div className="mobile-log-item">
                          <span className="mobile-user-label">User</span>
                          <div>
                            <div className="mobile-log-admin">{log.adminName}</div>
                            <div className="mobile-log-role">{log.adminRole}</div>
                          </div>
                        </div>
                        <div className="mobile-log-item">
                          <span className="mobile-user-label">Affected Account</span>
                          <div>
                            {log.entityId ? (
                              <>
                                <div className="mobile-log-affected">{log.entityId}</div>
                                <div className="mobile-log-affected-type">{log.entityType || 'N/A'}</div>
                              </>
                            ) : (
                              <span className="no-account">N/A</span>
                            )}
                          </div>
                        </div>
                        <div className="mobile-log-item">
                          <span className="mobile-user-label">Entity</span>
                          <div>
                            <div className="mobile-log-entity">{log.entityType || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="mobile-log-item full-width">
                          <span className="mobile-user-label">Details</span>
                          <span className="mobile-log-details">{log.details}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* See All Logs Button */}
              {!showAllLogs && totalFilteredLogsCount > 10 && (
                <div className="see-all-logs-container">
                  <button 
                    className="see-all-logs-button"
                    onClick={() => setShowAllLogs(true)}
                  >
                    See All Logs ({totalFilteredLogsCount} total)
                  </button>
                </div>
              )}
              
              {showAllLogs && totalFilteredLogsCount > 10 && (
                <div className="see-all-logs-container">
                  <button 
                    className="see-all-logs-button"
                    onClick={() => setShowAllLogs(false)}
                  >
                    Show Less (Latest 10 only)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Permissions Tab Content */}
        {activeTab === 'permissions' && (
          <div className="tab-content">
            <div className="permissions-section">
              <div className="permissions-header">
                <h3 className="section-title">Access Permissions</h3>
                <p className="permissions-subtitle">Configure module access rights for each role</p>
              </div>
              
              <div className="permissions-tables-container">
                {!currentPermissions || Object.keys(currentPermissions).length === 0 ? (
                  <div style={{padding: '20px', textAlign: 'center'}}>
                    <p>Loading permissions...</p>
                    <p style={{fontSize: '12px', color: '#666'}}>
                      Debug: currentPermissions = {JSON.stringify(currentPermissions)}
                    </p>
                  </div>
                ) : Object.entries(currentPermissions).map(([role, rolePermissions]) => (
                  <div key={role} className="role-permissions-section">
                    <div className="role-section-header">
                      <span className={`role-label ${role.toLowerCase().replace(/\s+/g, '-')}`}>
                        {role}
                      </span>
                    </div>
                    
                    <div className="permissions-table-container">
                      <table className="permissions-table">
                        <thead>
                          <tr>
                            <th className="role-column">Module</th>
                            <th>View</th>
                            <th>Create</th>
                            <th>Edit</th>
                            <th>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(rolePermissions).map(([module, modulePermissions]) => (
                            <tr key={`${role}-${module}`} className="permission-row">
                              <td className="module-name">
                                {module === 'ncdSeries' ? 'NCD Series' :
                                 module === 'interestPayout' ? 'Interest Payout' :
                                 module === 'administrator' ? 'Administrator' :
                                 module === 'approval' ? 'Approval' :
                                 module.charAt(0).toUpperCase() + module.slice(1)}
                              </td>
                              <td>
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={modulePermissions.view}
                                    onChange={() => handlePermissionToggle(role, module, 'view')}
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                              <td>
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={modulePermissions.create}
                                    onChange={() => handlePermissionToggle(role, module, 'create')}
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                              <td>
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={modulePermissions.edit}
                                    onChange={() => handlePermissionToggle(role, module, 'edit')}
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                              <td>
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={modulePermissions.delete}
                                    onChange={() => handlePermissionToggle(role, module, 'delete')}
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-popup">
            <div className="success-content">
              <span className="success-message">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
            <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <HiOutlineDocumentText size={24} className="title-icon" />
                  <h2>Add New User</h2>
                </div>
                <button 
                  className="close-button"
                  onClick={() => setShowAddUserModal(false)}
                >
                  <MdClose size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="user-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>User ID*</label>
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      placeholder="Enter user ID (e.g., USR001, EMP123)"
                      className={errors.userId ? 'error' : ''}
                    />
                    {errors.userId && <span className="error-text">{errors.userId}</span>}
                  </div>
                  <div className="form-group">
                    <label>Username*</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      className={errors.username ? 'error' : ''}
                    />
                    {errors.username && <span className="error-text">{errors.username}</span>}
                  </div>
                  <div className="form-group">
                    <label>Full Name*</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter full name"
                      className={errors.fullName ? 'error' : ''}
                    />
                    {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Role*</label>
                    <select
                      key="add-role-dropdown"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {ALL_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Email*</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Password*</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <span className="error-text">{errors.password}</span>}
                  </div>
                  <div className="form-group">
                    <label>Confirm Password*</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number*</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (!value.startsWith('+91 ')) {
                          value = '+91 ' + value.replace(/^\+91\s*/, '');
                        }
                        setFormData({ ...formData, phone: value });
                      }}
                      placeholder="+91 Enter phone number"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="clear-button" onClick={() => {
                    setFormData({
                      userId: '',
                      username: '',
                      fullName: '',
                      role: 'Finance Executive',
                      password: '',
                      confirmPassword: '',
                      email: '',
                      phone: '+91 '
                    });
                    setErrors({});
                  }}>
                    Clear
                  </button>
                  <button type="submit" className="submit-button">
                    <MdPersonAdd size={18} /> Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
            <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <HiOutlineDocumentText size={24} className="title-icon" />
                  <h2>{hasPermission('administrator', 'edit') ? 'Edit' : 'View'} User - {selectedUser.username}</h2>
                </div>
                <button 
                  className="close-button"
                  onClick={() => setShowEditUserModal(false)}
                >
                  <MdClose size={20} />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="user-form">
                {errors.general && (
                  <div className="error-banner">
                    {errors.general}
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={editFormData.username}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editFormData.fullName}
                      onChange={hasPermission('administrator', 'edit') ? (e) => setEditFormData({ ...editFormData, fullName: e.target.value }) : undefined}
                      placeholder="Enter full name"
                      disabled={!hasPermission('administrator', 'edit')}
                      className={!hasPermission('administrator', 'edit') ? 'disabled-input' : ''}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      key="edit-role-dropdown" 
                      value={editFormData.role}
                      onChange={hasPermission('administrator', 'edit') ? (e) => setEditFormData({ ...editFormData, role: e.target.value }) : undefined}
                      disabled={!hasPermission('administrator', 'edit')}
                      className={!hasPermission('administrator', 'edit') ? 'disabled-input' : ''}
                    >
                      {ALL_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {hasPermission('administrator', 'edit') && (
                  <div className="form-section">
                    <h4>Change Password (Optional)</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          value={editFormData.newPassword}
                          onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          className={errors.newPassword ? 'error' : ''}
                        />
                        {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                      </div>
                      <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                          type="password"
                          value={editFormData.confirmPassword}
                          onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          className={errors.confirmPassword ? 'error' : ''}
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                      </div>
                    </div>
                  </div>
                )}
                
                {hasPermission('administrator', 'edit') ? (
                  <div className="form-section">
                    <h4>Change Email</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Old Email</label>
                        <input
                          type="email"
                          value={editFormData.oldEmail}
                          disabled
                          className="disabled-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>New Email</label>
                        <input
                          type="email"
                          value={editFormData.newEmail}
                          onChange={(e) => setEditFormData({ ...editFormData, newEmail: e.target.value })}
                          placeholder="Enter new email"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    <h4>Email</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={editFormData.newEmail}
                          disabled
                          className="disabled-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {hasPermission('administrator', 'edit') ? (
                  <div className="form-section">
                    <h4>Change Phone Number</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Old Phone Number</label>
                        <input
                          type="tel"
                          value={editFormData.oldPhone}
                          disabled
                          className="disabled-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>New Phone Number</label>
                        <input
                          type="tel"
                          value={editFormData.newPhone}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (!value.startsWith('+91 ')) {
                              value = '+91 ' + value.replace(/^\+91\s*/, '');
                            }
                            setEditFormData({ ...editFormData, newPhone: value });
                          }}
                          placeholder="+91 Enter new phone number"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    <h4>Phone Number</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={editFormData.newPhone}
                          disabled
                          className="disabled-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasPermission('administrator', 'edit') && (
                  <div className="form-actions">
                    <button type="button" className="clear-button" onClick={() => {
                      setEditFormData({
                        username: selectedUser.username,
                        fullName: selectedUser.fullName,
                        role: selectedUser.role,
                        newPassword: '',
                        confirmPassword: '',
                        newEmail: selectedUser.email,
                        oldEmail: selectedUser.email,
                        newPhone: selectedUser.phone,
                        oldPhone: selectedUser.phone
                      });
                      setErrors({});
                    }}>
                      Clear
                    </button>
                    <button type="submit" className="submit-button">
                      <FaEye size={18} /> Update User
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && userToDelete && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <MdDelete size={24} className="title-icon delete-icon" />
                  <h2>Delete User</h2>
                </div>
                <button 
                  className="close-button"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  <MdClose size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="delete-confirmation">
                  <p>Are you sure you want to delete this user?</p>
                  <div className="user-details">
                    <p><strong>User ID:</strong> {userToDelete.userId}</p>
                    <p><strong>Username:</strong> {userToDelete.username}</p>
                    <p><strong>Full Name:</strong> {userToDelete.fullName}</p>
                    <p><strong>Role:</strong> {userToDelete.role}</p>
                  </div>
                  <div className="warning-message">
                    <span>⚠️ This action will deactivate the user. They won't be able to access the system.</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-delete" 
                  onClick={confirmDeleteUser}
                >
                  <MdDelete size={16} />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Administrator;