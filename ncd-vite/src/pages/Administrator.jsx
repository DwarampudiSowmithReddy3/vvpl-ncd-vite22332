import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import Layout from '../components/Layout';
import './Administrator.css';
import { MdAdminPanelSettings, MdSearch, MdPersonAdd, MdClose, MdSecurity, MdOutlineFileDownload, MdDelete } from "react-icons/md";
import { FaEye, FaUser, FaUserShield, FaUserTie, FaUserCog, FaUsers } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";

const Administrator = () => {
  const navigate = useNavigate();
  const { permissions, updatePermissions, hasPermission, loadPermissions } = useAuth();
  const { auditLogs, addAuditLog } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // CRITICAL DEBUG: Test if updatePermissions function exists
  console.log('🚨 CRITICAL DEBUG: updatePermissions function type:', typeof updatePermissions);
  console.log('🚨 CRITICAL DEBUG: updatePermissions function:', updatePermissions);

  // CRITICAL TEST: Simple test function
  const testPermissionToggle = () => {
    console.log('🚨 TEST FUNCTION CALLED!');
    console.log('🚨 updatePermissions exists:', typeof updatePermissions);
    if (typeof updatePermissions === 'function') {
      console.log('🚨 Calling handlePermissionToggle...');
      handlePermissionToggle('Finance Executive', 'ncdSeries', 'view');
    } else {
      console.error('🚨 updatePermissions is not a function!');
    }
  };

  // CRITICAL DEBUG: Log function availability
  console.log('🚨 CRITICAL DEBUG: Administrator component loaded');
  console.log('🚨 CRITICAL DEBUG: updatePermissions function:', typeof updatePermissions);
  console.log('🚨 CRITICAL DEBUG: permissions object:', permissions);

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
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  
  // Users data - load from API
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Load users from API on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersData = await apiService.getUsers();
        // Transform API data to match existing format
        const transformedUsers = usersData.map(user => ({
          id: user.id,
          userId: user.user_id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
          email: user.email,
          phone: user.phone,
          lastUsed: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
          createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString() : new Date().toLocaleDateString()
        }));
        setUsers(transformedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Keep existing empty state if API fails
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  // Mock user logs data - make it stateful so we can add new logs
  const [userLogs, setUserLogs] = useState([]);

  // Load permissions on component mount
  useEffect(() => {
    const initializePermissions = async () => {
      if (user && user.role === 'Super Admin') {
        console.log('🔄 Administrator: Super Admin detected, permissions should already be loaded');
        console.log('🚨 CRITICAL DEBUG: Current permissions state:', permissions);
        console.log('🚨 CRITICAL DEBUG: Permissions keys:', Object.keys(permissions));
        console.log('🚨 CRITICAL DEBUG: Finance Executive exists:', !!permissions['Finance Executive']);
        
        // Only reload if permissions seem to be default/empty
        const superAdminPerms = permissions['Super Admin'];
        if (superAdminPerms && Object.keys(superAdminPerms).length >= 10) {
          console.log('✅ Administrator: Permissions already loaded, no need to reload');
        } else {
          console.log('🔄 Administrator: Permissions seem incomplete, reloading...');
          const result = await loadPermissions();
          if (result.success) {
            console.log('✅ Administrator: Permissions reloaded successfully');
          } else {
            console.error('❌ Administrator: Failed to reload permissions:', result.error);
          }
        }
      }
    };
    
    initializePermissions();
  }, [user]); // Remove loadPermissions from dependency to avoid infinite loops

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);
  };

  // Permission toggle handler - CRITICAL DEBUG VERSION
  const handlePermissionToggle = async (role, module, action) => {
    console.log(`🚨 CRITICAL DEBUG: Permission toggle clicked!`);
    console.log(`🚨 CRITICAL DEBUG: Parameters:`, { role, module, action });
    console.log(`🚨 CRITICAL DEBUG: updatePermissions function exists:`, typeof updatePermissions);
    console.log(`🚨 CRITICAL DEBUG: permissions object:`, permissions);
    
    // CRITICAL: Make function available globally for testing
    window.testPermissionToggle = handlePermissionToggle;
    
    const oldValue = permissions[role][module][action];
    const newValue = !oldValue;
    
    console.log(`🚨 CRITICAL DEBUG: Value change: ${oldValue} → ${newValue}`);
    
    try {
      // Create updated permissions object
      const updatedPermissions = {
        ...permissions,
        [role]: {
          ...permissions[role],
          [module]: {
            ...permissions[role][module],
            [action]: newValue
          }
        }
      };
      
      console.log('🚨 CRITICAL DEBUG: About to call updatePermissions...');
      console.log('🚨 CRITICAL DEBUG: Updated permissions object created');
      
      // CRITICAL: Add explicit check for updatePermissions function
      if (typeof updatePermissions !== 'function') {
        console.error('🚨 CRITICAL ERROR: updatePermissions is not a function!', typeof updatePermissions);
        showSuccess('Error: updatePermissions function not available');
        return;
      }
      
      console.log('🚨 CRITICAL DEBUG: Calling updatePermissions now...');
      console.log('🚨 CRITICAL DEBUG: THIS IS WHERE THE NETWORK REQUEST SHOULD HAPPEN!');
      
      // Use AuthContext updatePermissions method (this will save to backend and localStorage)
      const result = await updatePermissions(updatedPermissions);
      
      console.log('🚨 CRITICAL DEBUG: updatePermissions returned:', result);
      
      if (result && result.success) {
        console.log('✅ Administrator: Permissions updated successfully via AuthContext');
        showSuccess(`${role}: ${module} ${action} permission ${newValue ? 'granted' : 'revoked'}`);
        
        if (result.warning) {
          console.warn('⚠️ Administrator: Backend sync warning:', result.warning);
        }
      } else {
        console.error('❌ Administrator: Failed to update permissions:', result?.error);
        showSuccess(`Error: ${result?.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('🚨 CRITICAL ERROR: Permission toggle error:', error);
      console.error('🚨 CRITICAL ERROR: Error stack:', error.stack);
      showSuccess(`Error: ${error.message}`);
    }
  };

  // CRITICAL: Make function available globally for debugging
  window.debugPermissionToggle = handlePermissionToggle;

  return (
    <Layout>
      <div className="administrator-container">
        <div className="administrator-header">
          <div className="header-content">
            <h1 className="page-title">Administrator</h1>
          </div>
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
            <div className="users-table-section">
              <div className="table-header">
                <h3 className="section-title">Users</h3>
              </div>
              
              <div className="table-container">
                {users.length === 0 ? (
                  <div className="no-logs">
                    <p>No users found</p>
                  </div>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Last Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
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
                            <span className={`role-badge ${user.role.toLowerCase().replace(' ', '-')}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span className="last-used">{user.lastUsed}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
                
                {/* CRITICAL DEBUG: Test button to verify function works */}
                <button 
                  onClick={testPermissionToggle}
                  style={{
                    background: '#ff4444',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    margin: '10px 0',
                    cursor: 'pointer'
                  }}
                >
                  🚨 CRITICAL TEST: Click to Test Permission Toggle
                </button>
              </div>
              
              <div className="permissions-tables-container">
                {Object.entries(permissions).map(([role, rolePermissions]) => (
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
      </div>
    </Layout>
  );
};

export default Administrator;