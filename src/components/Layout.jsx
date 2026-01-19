import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Sidebar from './Sidebar';
import FloatingGreeting from './FloatingGreeting';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { 
  MdReportProblem,
  MdAdd,
  MdEdit,
  MdClose,
  MdCalendarToday,
  MdFilterList,
  MdAccountCircle,
  MdPerson,
  MdEmail,
  MdBadge,
  MdAccessTime,
  MdVpnKey,
  MdSettings,
  MdExitToApp
} from "react-icons/md";
import './Layout.css';

const Layout = ({ children, isInvestor = false }) => {
  const { user, justLoggedIn, clearJustLoggedIn, logout } = useAuth();
  const { 
    complaints, 
    addComplaint, 
    updateComplaint, 
    updateComplaintStatus, 
    getPendingComplaints,
    getComplaintsByDateRange,
    addAuditLog
  } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFloatingGreeting, setShowFloatingGreeting] = useState(false);
  const [showSopViewer, setShowSopViewer] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    fromDate: '',
    toDate: ''
  });
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({
    investorId: '',
    issue: '',
    remarks: ''
  });
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [resolutionComments, setResolutionComments] = useState({}); // Store resolution comments for each complaint
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAccountMenu && !event.target.closest('.account-menu-container')) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountMenu]);

  // Initialize filtered complaints with pending complaints by default
  useEffect(() => {
    setFilteredComplaints(getPendingComplaints());
  }, [complaints, getPendingComplaints]);

  // Handle date filtering
  useEffect(() => {
    if (dateFilter.fromDate || dateFilter.toDate) {
      const dateFiltered = getComplaintsByDateRange(dateFilter.fromDate, dateFilter.toDate);
      // Show only pending complaints from the date range
      setFilteredComplaints(dateFiltered.filter(c => c.status === 'pending'));
    } else {
      // Show only pending complaints by default
      setFilteredComplaints(getPendingComplaints());
    }
  }, [dateFilter, complaints, getPendingComplaints, getComplaintsByDateRange]);

  // Show floating greeting only when user just logged in and is on dashboard
  useEffect(() => {
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/investor/dashboard';
    if (isDashboard && justLoggedIn && user?.name) {
      setShowFloatingGreeting(true);
    }
  }, [location.pathname, justLoggedIn, user?.name]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleGreetingComplete = () => {
    setShowFloatingGreeting(false);
    clearJustLoggedIn(); // Clear the just logged in flag
  };

  // Grievance handlers
  const handleAddComplaint = () => {
    if (!newComplaint.investorId || !newComplaint.issue || !newComplaint.remarks) {
      alert('Please fill all fields');
      return;
    }

    const complaint = addComplaint(newComplaint);
    
    // Add audit log for complaint creation
    addAuditLog({
      action: 'Created Grievance',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `Created new grievance for investor "${newComplaint.investorId}": ${newComplaint.issue}`,
      entityType: 'Grievance',
      entityId: newComplaint.investorId,
      changes: {
        investorId: newComplaint.investorId,
        issue: newComplaint.issue,
        remarks: newComplaint.remarks,
        status: 'pending'
      }
    });
    
    setNewComplaint({ investorId: '', issue: '', remarks: '' });
  };

  const handleEditComplaint = (complaint) => {
    setEditingComplaint({ ...complaint });
  };

  const handleSaveEdit = () => {
    const oldComplaint = complaints.find(c => c.id === editingComplaint.id);
    
    updateComplaint(editingComplaint.id, {
      issue: editingComplaint.issue,
      remarks: editingComplaint.remarks
    });
    
    // Add audit log for complaint edit
    addAuditLog({
      action: 'Edited Grievance',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `Updated grievance for investor "${editingComplaint.investorId}"`,
      entityType: 'Grievance',
      entityId: editingComplaint.investorId,
      changes: {
        grievanceId: editingComplaint.id,
        oldIssue: oldComplaint?.issue,
        newIssue: editingComplaint.issue,
        oldRemarks: oldComplaint?.remarks,
        newRemarks: editingComplaint.remarks
      }
    });
    
    setEditingComplaint(null);
  };

  const handleComplaintStatusChange = (id, isCompleted) => {
    const complaint = complaints.find(c => c.id === id);
    
    updateComplaintStatus(id, isCompleted, isCompleted ? resolutionComments[id] : null);
    
    // Add audit log for complaint status change
    addAuditLog({
      action: isCompleted ? 'Resolved Grievance' : 'Reopened Grievance',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `${isCompleted ? 'Resolved' : 'Reopened'} grievance for investor "${complaint?.investorId}": ${complaint?.issue}${isCompleted && resolutionComments[id] ? `. Resolution: ${resolutionComments[id]}` : ''}`,
      entityType: 'Grievance',
      entityId: complaint?.investorId || 'Unknown',
      changes: {
        grievanceId: id,
        oldStatus: isCompleted ? 'pending' : 'resolved',
        newStatus: isCompleted ? 'resolved' : 'pending',
        issue: complaint?.issue,
        resolutionComment: isCompleted ? resolutionComments[id] : null
      }
    });

    // Clear resolution comment after resolving
    if (isCompleted) {
      setResolutionComments(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const handleResolutionCommentChange = (id, comment) => {
    setResolutionComments(prev => ({
      ...prev,
      [id]: comment
    }));
  };

  const handleDateFilterChange = (field, value) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearDateFilter = () => {
    setDateFilter({ fromDate: '', toDate: '' });
    setShowDateFilter(false);
  };

  const toggleShowAllComplaints = () => {
    if (filteredComplaints.length === getPendingComplaints().length) {
      // Currently showing pending, switch to all
      if (dateFilter.fromDate || dateFilter.toDate) {
        setFilteredComplaints(getComplaintsByDateRange(dateFilter.fromDate, dateFilter.toDate));
      } else {
        setFilteredComplaints(complaints);
      }
    } else {
      // Currently showing all, switch to pending only
      if (dateFilter.fromDate || dateFilter.toDate) {
        const dateFiltered = getComplaintsByDateRange(dateFilter.fromDate, dateFilter.toDate);
        setFilteredComplaints(dateFiltered.filter(c => c.status === 'pending'));
      } else {
        setFilteredComplaints(getPendingComplaints());
      }
    }
  };

  // Account menu handlers
  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatLastLogin = () => {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="layout">
      <Sidebar
        isInvestor={isInvestor}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        disabled={showFloatingGreeting}
        mobileHeaderButtons={
          <div className="mobile-header-buttons-container">
            <button 
              className="sop-document-button"
              onClick={() => setShowSopViewer(true)}
              title="View SOP Document"
            >
              <HiOutlineDocumentText size={18} />
              SOP
            </button>
            <button 
              className="grievance-button"
              onClick={() => setShowGrievanceModal(true)}
              title="Grievances"
            >
              <MdReportProblem size={18} />
              Grievances
            </button>
            
            {/* Account Menu */}
            <div className="account-menu-container" style={{backgroundColor:"transparent"}}>
              <button 
                className="account-button"
                onClick={toggleAccountMenu}
                title="Account"
                style={{backgroundColor:"transparent"}}
              >
                <div className="account-avatar" style={{backgroundColor:"transparent"}}>
                  {getInitials(user?.name)}
                </div>
                <span>Account</span>
              </button>
              
              {showAccountMenu && (
                <div className="account-dropdown">
                  <div className="account-dropdown-header">
                    <div className="account-avatar-large">
                      {getInitials(user?.name)}
                    </div>
                    <div className="account-info">
                      <div className="account-name">{user?.name || 'User'}</div>
                      <div className="account-email">{user?.email || 'user@example.com'}</div>
                    </div>
                  </div>
                  
                  <div className="account-dropdown-divider"></div>
                  
                  <div className="account-dropdown-section">
                    <div className="account-detail-item">
                      <MdBadge className="account-icon" />
                      <div className="account-detail-content">
                        <div className="account-detail-label">User ID</div>
                        <div className="account-detail-value">{user?.userId || 'USR001'}</div>
                      </div>
                    </div>
                    
                    <div className="account-detail-item">
                      <MdPerson className="account-icon" />
                      <div className="account-detail-content">
                        <div className="account-detail-label">Role</div>
                        <div className="account-detail-value">{user?.displayRole || user?.role || 'User'}</div>
                      </div>
                    </div>
                    
                    <div className="account-detail-item">
                      <MdAccessTime className="account-icon" />
                      <div className="account-detail-content">
                        <div className="account-detail-label">Last Login</div>
                        <div className="account-detail-value">{formatLastLogin()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="account-dropdown-divider"></div>
                  
                  <div className="account-dropdown-actions">
                    <button className="account-action-button logout-button" onClick={handleLogout}>
                      <MdExitToApp className="action-icon" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <div className="layout-content">
        <header className="layout-header">
          <div className="header-info">
            <button 
              className="menu-toggle" 
              onClick={toggleSidebar}
              disabled={showFloatingGreeting}
              style={{ 
                opacity: showFloatingGreeting ? 0.5 : 1,
                cursor: showFloatingGreeting ? 'not-allowed' : 'pointer'
              }}
            >
              ☰
            </button>
            {/* Show logo in header center when sidebar is closed on mobile */}
            {!sidebarOpen && (
              <img 
                className="header-logo" 
                src="/logo_lf_ncd.svg" 
                alt="NCD Platform Logo" 
              />
            )}
            <div className="header-buttons">
              <button 
                className="sop-document-button"
                onClick={() => setShowSopViewer(true)}
                title="View SOP Document"
              >
                <HiOutlineDocumentText size={20} />
                SOP
              </button>
              <button 
                className="grievance-button"
                onClick={() => setShowGrievanceModal(true)}
                title="Grievances"
              >
                <MdReportProblem size={20} />
                Grievances
              </button>
              
              {/* Account Menu */}
              <div className="account-menu-container">
                <button 
                  className="account-button"
                  onClick={toggleAccountMenu}
                  title="Account"
                >
                  <div className="account-avatar">
                    {getInitials(user?.name)}
                  </div>
                </button>
                
                {showAccountMenu && (
                  <div className="account-dropdown">
                    <div className="account-dropdown-header">
                      <div className="account-avatar-large">
                        {getInitials(user?.name)}
                      </div>
                      <div className="account-info">
                        <div className="account-name">{user?.name || 'User'}</div>
                        <div className="account-email">{user?.email || 'user@example.com'}</div>
                      </div>
                    </div>
                    
                    <div className="account-dropdown-divider"></div>
                    
                    <div className="account-dropdown-section">
                      <div className="account-detail-item">
                        <MdBadge className="account-icon" />
                        <div className="account-detail-content">
                          <div className="account-detail-label">User ID</div>
                          <div className="account-detail-value">{user?.userId || 'USR001'}</div>
                        </div>
                      </div>
                      
                      <div className="account-detail-item">
                        <MdPerson className="account-icon" />
                        <div className="account-detail-content">
                          <div className="account-detail-label">Role</div>
                          <div className="account-detail-value">{user?.displayRole || user?.role || 'User'}</div>
                        </div>
                      </div>
                      
                      <div className="account-detail-item">
                        <MdAccessTime className="account-icon" />
                        <div className="account-detail-content">
                          <div className="account-detail-label">Last Login</div>
                          <div className="account-detail-value">{formatLastLogin()}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="account-dropdown-divider"></div>
                    
                    <div className="account-dropdown-actions">
                      <button className="account-action-button logout-button" onClick={handleLogout}>
                        <MdExitToApp className="action-icon" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="layout-main">
          {children}
        </main>
        <footer className="layout-footer">
          <p className="footer-text">© 2026 LOANFRONT | All Rights Reserved.</p>
        </footer>
      </div>

      {showFloatingGreeting && (
        <FloatingGreeting 
          userName={user?.name} 
          onComplete={handleGreetingComplete}
        />
      )}

      {showSopViewer && (
        <div className="sop-modal-overlay" onClick={() => setShowSopViewer(false)}>
          <div className="sop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sop-modal-header">
              <h3>SOP - NCD - VVPL</h3>
              <button className="sop-close" onClick={() => setShowSopViewer(false)}>×</button>
            </div>
            <div className="sop-modal-body">
              <iframe
                title="SOP - NCD -VVPL_v1.0"
                src="/SOP%20-%20NCD%20-VVPL_v1.0.pdf"
                className="sop-iframe"
              />
            </div>
            <div className="sop-modal-footer">
              <button
                className="sop-download"
                onClick={() => window.open('/SOP%20-%20NCD%20-VVPL_v1.0.pdf', '_blank')}
              >
                Download
              </button>
              <button className="sop-close-footer" onClick={() => setShowSopViewer(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grievance Modal */}
      {showGrievanceModal && (
        <div className="modal-overlay" onClick={() => setShowGrievanceModal(false)}>
          <div className="modal-content grievance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Grievance Management</h2>
              <button className="close-button" onClick={() => setShowGrievanceModal(false)}>
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Add New Complaint Form */}
              <div className="complaint-form-section">
                <h3>Add New Complaint</h3>
                <div className="complaint-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Investor ID*</label>
                      <input
                        type="text"
                        value={newComplaint.investorId}
                        onChange={(e) => setNewComplaint({...newComplaint, investorId: e.target.value})}
                        placeholder="Enter investor ID"
                      />
                    </div>
                    <div className="form-group">
                      <label>Issue*</label>
                      <input
                        type="text"
                        value={newComplaint.issue}
                        onChange={(e) => setNewComplaint({...newComplaint, issue: e.target.value})}
                        placeholder="Brief description of the issue"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Remarks*</label>
                    <textarea
                      value={newComplaint.remarks}
                      onChange={(e) => setNewComplaint({...newComplaint, remarks: e.target.value})}
                      placeholder="Detailed description of the complaint"
                      rows="4"
                      className="elastic-textarea"
                    />
                  </div>
                  <button className="add-complaint-button" onClick={handleAddComplaint}>
                    <MdAdd size={18} />
                    Add New Complaint
                  </button>
                </div>
              </div>

              {/* Complaints Table */}
              <div className="complaints-table-section">
                <div className="complaints-header">
                  <h3>All Complaints</h3>
                  <div className="complaints-filters">
                    <button 
                      className="filter-toggle-button"
                      onClick={toggleShowAllComplaints}
                    >
                      <MdFilterList size={18} />
                      {filteredComplaints.length === getPendingComplaints().length ? 'Show All' : 'Show Pending Only'}
                    </button>
                    <button 
                      className="date-filter-button"
                      onClick={() => setShowDateFilter(!showDateFilter)}
                    >
                      <MdCalendarToday size={18} />
                      Date Filter
                    </button>
                  </div>
                </div>

                {/* Date Filter Section */}
                {showDateFilter && (
                  <div className="date-filter-section">
                    <div className="date-filter-inputs">
                      <div className="date-input-group">
                        <label>From Date:</label>
                        <input
                          type="date"
                          value={dateFilter.fromDate}
                          onChange={(e) => handleDateFilterChange('fromDate', e.target.value)}
                          className="date-input"
                        />
                      </div>
                      <div className="date-input-group">
                        <label>To Date:</label>
                        <input
                          type="date"
                          value={dateFilter.toDate}
                          onChange={(e) => handleDateFilterChange('toDate', e.target.value)}
                          className="date-input"
                        />
                      </div>
                      <button className="clear-filter-button" onClick={clearDateFilter}>
                        Clear Filter
                      </button>
                    </div>
                  </div>
                )}

                <div className="complaints-table-container">
                  <table className="complaints-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Investor ID</th>
                        <th>Issue</th>
                        <th>Remarks</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Resolution</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((complaint, index) => (
                        <tr key={complaint.id} className={complaint.status === 'resolved' ? 'resolved-row' : 'pending-row'}>
                          <td>{index + 1}</td>
                          <td>{complaint.investorId}</td>
                          <td>
                            {editingComplaint && editingComplaint.id === complaint.id ? (
                              <input
                                type="text"
                                value={editingComplaint.issue}
                                onChange={(e) => setEditingComplaint({...editingComplaint, issue: e.target.value})}
                              />
                            ) : (
                              complaint.issue
                            )}
                          </td>
                          <td>
                            {editingComplaint && editingComplaint.id === complaint.id ? (
                              <textarea
                                value={editingComplaint.remarks}
                                onChange={(e) => setEditingComplaint({...editingComplaint, remarks: e.target.value})}
                                rows="2"
                                className="elastic-textarea"
                              />
                            ) : (
                              <div className="remarks-cell">{complaint.remarks}</div>
                            )}
                          </td>
                          <td>{complaint.timestamp}</td>
                          <td>
                            <div className="status-cell">
                              <span className={`status-badge ${complaint.status}`}>
                                {complaint.status === 'resolved' ? 'Resolved' : 'Pending'}
                              </span>
                              <div className="checkbox-container">
                                <input
                                  type="checkbox"
                                  checked={complaint.isCompleted}
                                  onChange={(e) => handleComplaintStatusChange(complaint.id, e.target.checked)}
                                  className="status-checkbox"
                                  disabled={complaint.status === 'pending' && (!resolutionComments[complaint.id] || !resolutionComments[complaint.id].trim())}
                                />
                                <label className={complaint.status === 'pending' && (!resolutionComments[complaint.id] || !resolutionComments[complaint.id].trim()) ? 'disabled-label' : ''}>
                                  Mark as resolved
                                </label>
                              </div>
                              {/* Resolution Comment Field - Show when complaint is pending */}
                              {complaint.status === 'pending' && (
                                <div className="resolution-comment-section">
                                  <label className="resolution-comment-label">Resolution Comment:</label>
                                  <textarea
                                    placeholder="Enter resolution details to communicate with the complainant..."
                                    value={resolutionComments[complaint.id] || ''}
                                    onChange={(e) => handleResolutionCommentChange(complaint.id, e.target.value)}
                                    className="resolution-comment-textarea"
                                    rows="2"
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="resolution-cell">
                              {complaint.status === 'resolved' && complaint.resolutionComment ? (
                                <div className="resolution-display">
                                  <div className="resolution-comment">{complaint.resolutionComment}</div>
                                  {complaint.resolvedAt && (
                                    <div className="resolved-timestamp">Resolved: {complaint.resolvedAt}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="no-resolution">-</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {editingComplaint && editingComplaint.id === complaint.id ? (
                                <>
                                  <button className="save-button" onClick={handleSaveEdit}>
                                    Save
                                  </button>
                                  <button className="cancel-button" onClick={() => setEditingComplaint(null)}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button className="edit-button" onClick={() => handleEditComplaint(complaint)}>
                                  <MdEdit size={16} />
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
