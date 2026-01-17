import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './Administrator.css';
import { MdAdminPanelSettings, MdSearch, MdPersonAdd, MdClose, MdSecurity, MdOutlineFileDownload } from "react-icons/md";
import { FaEye, FaUser, FaUserShield, FaUserTie, FaUserCog, FaUsers } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";

const Administrator = () => {
  const navigate = useNavigate();
  const { PERMISSIONS, updatePermissions, hasPermission } = useAuth();
  const { auditLogs, addAuditLog } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

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
  
  // Mock users data - in real app this would come from context/API
  const [users, setUsers] = useState([
    {
      id: 1,
      userId: 'USR001',
      username: 'john_admin',
      fullName: 'John Smith',
      role: 'Admin',
      email: 'john@company.com',
      phone: '+91 9876543210',
      lastUsed: '2024-01-05 14:30',
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      userId: 'USR002',
      username: 'sarah_manager',
      fullName: 'Sarah Johnson',
      role: 'Finance Manager',
      email: 'sarah@company.com',
      phone: '+91 9876543211',
      lastUsed: '2024-01-05 12:15',
      createdAt: '2024-01-02'
    },
    {
      id: 3,
      userId: 'USR003',
      username: 'mike_exec',
      fullName: 'Mike Wilson',
      role: 'Investor Relationship Executive',
      email: 'mike@company.com',
      phone: '+91 9876543212',
      lastUsed: '2024-01-04 16:45',
      createdAt: '2024-01-03'
    }
  ]);

  // Mock user logs data - make it stateful so we can add new logs
  const [userLogs, setUserLogs] = useState([
    {
      id: 1,
      adminName: 'john_admin',
      username: 'sarah_manager',
      description: 'Role updated',
      pastValue: 'Investor Relationship Executive',
      updatedValue: 'Finance Manager',
      timestamp: '2024-01-05 14:30:25',
      date: '2024-01-05'
    },
    {
      id: 2,
      adminName: 'super_admin',
      username: 'mike_exec',
      description: 'Email updated',
      pastValue: 'mike.old@company.com',
      updatedValue: 'mike@company.com',
      timestamp: '2024-01-05 12:15:10',
      date: '2024-01-05'
    },
    {
      id: 3,
      adminName: 'john_admin',
      username: 'sarah_manager',
      description: 'Phone number updated',
      pastValue: '+91 9876543200',
      updatedValue: '+91 9876543211',
      timestamp: '2024-01-04 16:45:30',
      date: '2024-01-04'
    },
    {
      id: 4,
      adminName: 'super_admin',
      username: 'john_admin',
      description: 'Password updated',
      pastValue: '********',
      updatedValue: '********',
      timestamp: '2024-01-04 10:20:15',
      date: '2024-01-04'
    },
    {
      id: 5,
      adminName: 'john_admin',
      username: 'mike_exec',
      description: 'Full name updated',
      pastValue: 'Michael Wilson',
      updatedValue: 'Mike Wilson',
      timestamp: '2024-01-03 09:30:45',
      date: '2024-01-03'
    }
  ]);

  // Permissions data structure
  // Use permissions as state so we can modify them
  const [permissions, setPermissions] = useState(PERMISSIONS || {});

  const [formData, setFormData] = useState({
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
    if (!searchTerm.trim()) return users;
    
    const searchLower = searchTerm.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(searchLower) ||
      user.userId.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.fullName.toLowerCase().includes(searchLower) ||
      user.lastUsed.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm]);

  const filteredLogs = useMemo(() => {
    const filtered = auditLogs.filter(log => {
      // Only filter by date range
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const matchesDateRange = logDate >= fromDate && logDate <= toDate;
      
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
      return matchesDateRange;
    }).length;
  }, [auditLogs, fromDate, toDate]);

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
      if (!data.username.trim()) newErrors.username = 'Username is required';
      if (!data.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!data.password) newErrors.password = 'Password is required';
      if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (data.password !== data.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!data.email.trim()) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateUserId = () => {
    const lastUser = users[users.length - 1];
    const lastId = lastUser ? parseInt(lastUser.userId.replace('USR', '')) : 0;
    return `USR${String(lastId + 1).padStart(3, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    const newUser = {
      id: users.length + 1,
      userId: generateUserId(),
      username: formData.username,
      fullName: formData.fullName,
      role: formData.role,
      email: formData.email,
      phone: formData.phone,
      lastUsed: 'Never',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, newUser]);
    
    // Add to global audit log system
    addAuditLog({
      action: 'Created User',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Created new user "${formData.username}" with role "${formData.role}"`,
      entityType: 'User',
      entityId: formData.username,
      changes: {
        userId: newUser.userId,
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        action: 'user_created'
      }
    });
    
    setShowAddUserModal(false);
    setFormData({
      username: '',
      fullName: '',
      role: 'Executive',
      password: '',
      confirmPassword: '',
      email: '',
      phone: '+91 '
    });
    setErrors({});
    
    showSuccess(`User ${formData.username} created successfully`);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateForm(editFormData, true)) return;

    const updatedUser = { ...selectedUser };
    const changes = [];

    // Check what changed and create log entries
    const newLogEntries = [];
    const currentTimestamp = new Date().toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');

    if (editFormData.newPassword && editFormData.newPassword !== '') {
      changes.push('password');
      
      // Add to global audit log system
      addAuditLog({
        action: 'Updated User Password',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Changed password for user "${selectedUser.username}"`,
        entityType: 'User',
        entityId: selectedUser.username,
        changes: {
          field: 'password',
          oldValue: '********',
          newValue: '********',
          userId: selectedUser.userId,
          userFullName: selectedUser.fullName
        }
      });
      
      // Also add to local logs for backward compatibility
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: user ? user.name : 'current_admin',
        username: selectedUser.username,
        description: 'Password updated',
        pastValue: '********',
        updatedValue: '********',
        timestamp: currentTimestamp,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    if (editFormData.newEmail && editFormData.newEmail !== editFormData.oldEmail) {
      updatedUser.email = editFormData.newEmail;
      changes.push('email');
      
      // Add to global audit log system
      addAuditLog({
        action: 'Updated User Email',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Changed email from "${editFormData.oldEmail}" to "${editFormData.newEmail}" for user "${selectedUser.username}"`,
        entityType: 'User',
        entityId: selectedUser.username,
        changes: {
          field: 'email',
          oldValue: editFormData.oldEmail,
          newValue: editFormData.newEmail,
          userId: selectedUser.userId,
          userFullName: selectedUser.fullName
        }
      });
      
      // Also add to local logs for backward compatibility
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: user ? user.name : 'current_admin',
        username: selectedUser.username,
        description: 'Email updated',
        pastValue: editFormData.oldEmail,
        updatedValue: editFormData.newEmail,
        timestamp: currentTimestamp,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    if (editFormData.newPhone && editFormData.newPhone !== editFormData.oldPhone) {
      updatedUser.phone = editFormData.newPhone;
      changes.push('phone number');
      
      // Add to global audit log system
      addAuditLog({
        action: 'Updated User Phone',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Changed phone number from "${editFormData.oldPhone}" to "${editFormData.newPhone}" for user "${selectedUser.username}"`,
        entityType: 'User',
        entityId: selectedUser.username,
        changes: {
          field: 'phone',
          oldValue: editFormData.oldPhone,
          newValue: editFormData.newPhone,
          userId: selectedUser.userId,
          userFullName: selectedUser.fullName
        }
      });
      
      // Also add to local logs for backward compatibility
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: user ? user.name : 'current_admin',
        username: selectedUser.username,
        description: 'Phone number updated',
        pastValue: editFormData.oldPhone,
        updatedValue: editFormData.newPhone,
        timestamp: currentTimestamp,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    if (editFormData.role !== selectedUser.role) {
      updatedUser.role = editFormData.role;
      changes.push('role');
      
      // Add to global audit log system
      addAuditLog({
        action: 'Updated User Role',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Changed user role from "${selectedUser.role}" to "${editFormData.role}" for user "${selectedUser.username}"`,
        entityType: 'User',
        entityId: selectedUser.username,
        changes: {
          field: 'role',
          oldValue: selectedUser.role,
          newValue: editFormData.role,
          userId: selectedUser.userId,
          userFullName: selectedUser.fullName
        }
      });
      
      // Also add to local logs for backward compatibility
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: user ? user.name : 'current_admin',
        username: selectedUser.username,
        description: 'Role updated',
        pastValue: selectedUser.role,
        updatedValue: editFormData.role,
        timestamp: currentTimestamp,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    if (editFormData.fullName !== selectedUser.fullName) {
      updatedUser.fullName = editFormData.fullName;
      changes.push('full name');
      
      // Add to global audit log system
      addAuditLog({
        action: 'Updated User Full Name',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Changed full name from "${selectedUser.fullName}" to "${editFormData.fullName}" for user "${selectedUser.username}"`,
        entityType: 'User',
        entityId: selectedUser.username,
        changes: {
          field: 'fullName',
          oldValue: selectedUser.fullName,
          newValue: editFormData.fullName,
          userId: selectedUser.userId,
          userFullName: selectedUser.fullName
        }
      });
      
      // Also add to local logs for backward compatibility
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: user ? user.name : 'current_admin',
        username: selectedUser.username,
        description: 'Full name updated',
        pastValue: selectedUser.fullName,
        updatedValue: editFormData.fullName,
        timestamp: currentTimestamp,
        date: new Date().toISOString().split('T')[0]
      });
    }

    if (changes.length === 0) {
      setErrors({ general: 'No changes detected from previous data' });
      return;
    }

    // Update user in the list
    setUsers(users.map(user => user.id === selectedUser.id ? updatedUser : user));
    
    // Add new log entries to the logs
    setUserLogs(prevLogs => [...prevLogs, ...newLogEntries]);
    
    setShowEditUserModal(false);
    setSelectedUser(null);
    setErrors({});
    
    showSuccess(`${selectedUser.username}: ${changes.join(', ')} updated successfully`);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);
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
      fullName: user.fullName,
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

  // Permission toggle handler - Now actually updates permissions
  const handlePermissionToggle = (role, module, action) => {
    const oldValue = permissions[role][module][action];
    const newValue = !oldValue;
    
    const newPermissions = {
      ...permissions,
      [role]: {
        ...permissions[role],
        [module]: {
          ...permissions[role][module],
          [action]: newValue
        }
      }
    };
    
    setPermissions(newPermissions);
    updatePermissions(newPermissions);
    
    // Add to global audit log system
    addAuditLog({
      action: 'Updated Permissions',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `${newValue ? 'Granted' : 'Revoked'} ${action} permission for ${role} role in ${module} module`,
      entityType: 'Permission',
      entityId: `${role}-${module}-${action}`,
      changes: {
        role: role,
        module: module,
        permission: action,
        oldValue: oldValue,
        newValue: newValue,
        permissionPath: `${role}.${module}.${action}`
      }
    });
    
    // Show a success message
    showSuccess(`${role}: ${module} ${action} permission ${newValue ? 'granted' : 'revoked'}`);
  };

  return (
    <Layout>
      <div className="administrator-container">
        <div className="administrator-header">
          <div className="header-content">
            <h1>Administrator</h1>
            <p>Manage users and system permissions</p>
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
                            <button
                              className="view-button"
                              onClick={() => handleViewUser(user)}
                            >
                              <FaEye size={16} /> {hasPermission('administrator', 'edit') ? 'Edit' : 'View'}
                            </button>
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
                          <button
                            className="view-button"
                            onClick={() => handleViewUser(user)}
                          >
                            <FaEye size={16} /> {hasPermission('administrator', 'edit') ? 'Edit' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Mobile Cards for Recently Added Users */}
                <div className="mobile-users-list">
                  {users.map((user) => (
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
                  
                  <button onClick={handleExportAuditLog} className="export-button">
                    <MdOutlineFileDownload size={18} /> Export
                  </button>
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
      </div>
    </Layout>
  );
};

export default Administrator;