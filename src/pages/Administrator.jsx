import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import './Administrator.css';
import { MdAdminPanelSettings, MdSearch, MdPersonAdd, MdClose } from "react-icons/md";
import { FaEye, FaUser, FaUserShield, FaUserTie, FaUserCog } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";

const Administrator = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
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
      role: 'Manager',
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
      role: 'Executive',
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
      pastValue: 'Executive',
      updatedValue: 'Manager',
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

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: 'Executive',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '+91 '
  });

  const [editFormData, setEditFormData] = useState({
    username: '',
    fullName: '',
    role: 'Executive',
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
    return userLogs.filter(log => log.date === selectedDate);
  }, [userLogs, selectedDate]);

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
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: 'current_admin', // In real app, this would be the logged-in admin
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
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: 'current_admin',
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
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: 'current_admin',
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
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: 'current_admin',
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
      newLogEntries.push({
        id: userLogs.length + newLogEntries.length + 1,
        adminName: 'current_admin',
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

  const handleViewUser = (user) => {
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
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Super Admin': return <FaUserShield className="role-icon super-admin" />;
      case 'Admin': return <FaUserCog className="role-icon admin" />;
      case 'Manager': return <FaUserTie className="role-icon manager" />;
      case 'Executive': return <FaUser className="role-icon executive" />;
      default: return <FaUser className="role-icon" />;
    }
  };

  return (
    <Layout>
      <div className="administrator-container">
        <div className="administrator-header">
          <div className="header-content">
            <h1>Administrator Panel</h1>
            <p>Manage users and monitor system activities</p>
          </div>
          <button 
            className="add-user-button" 
            onClick={() => setShowAddUserModal(true)}
          >
            <MdPersonAdd size={20} /> Add User
          </button>
        </div>

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
                          <FaEye size={16} /> View
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
                        <FaEye size={12} /> View
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
                        <FaEye size={16} /> View
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
                      <FaEye size={12} /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Logs Section */}
        <div className="logs-section">
          <div className="logs-header">
            <h3 className="section-title">User Activity Logs</h3>
            <div className="date-selector">
              <label>Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
          
          <div className="table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Admin Name</th>
                  <th>Username</th>
                  <th>Description</th>
                  <th>Past Value</th>
                  <th>Updated Value</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="admin-name">{log.adminName}</span>
                    </td>
                    <td>
                      <span className="affected-username">{log.username}</span>
                    </td>
                    <td>
                      <span className="log-description">{log.description}</span>
                    </td>
                    <td>
                      <span className="past-value">{log.pastValue}</span>
                    </td>
                    <td>
                      <span className="updated-value">{log.updatedValue}</span>
                    </td>
                    <td>
                      <span className="timestamp">{log.timestamp}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Mobile Cards for Logs */}
            <div className="mobile-logs-list">
              {filteredLogs.map((log) => (
                <div key={log.id} className="mobile-log-card">
                  <div className="mobile-log-header">
                    <span className="mobile-log-admin">{log.adminName}</span>
                    <span className="mobile-log-time">{log.timestamp}</span>
                  </div>
                  
                  <div className="mobile-log-details">
                    <div className="mobile-log-item">
                      <span className="mobile-user-label">User</span>
                      <span className="mobile-log-username">{log.username}</span>
                    </div>
                    <div className="mobile-log-item">
                      <span className="mobile-user-label">Action</span>
                      <span className="mobile-log-description">{log.description}</span>
                    </div>
                    <div className="mobile-log-item">
                      <span className="mobile-user-label">Past Value</span>
                      <span className="mobile-log-past">{log.pastValue}</span>
                    </div>
                    <div className="mobile-log-item">
                      <span className="mobile-user-label">Updated Value</span>
                      <span className="mobile-log-updated">{log.updatedValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredLogs.length === 0 && (
              <div className="no-logs">
                <p>No activity logs found for {selectedDate}</p>
              </div>
            )}
          </div>
        </div>

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
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="Executive">Executive</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
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
                      role: 'Executive',
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
                  <h2>Edit User - {selectedUser.username}</h2>
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
                      onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    >
                      <option value="Executive">Executive</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                </div>
                
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
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Administrator;