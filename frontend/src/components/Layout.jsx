import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import auditService from '../services/auditService';
import apiService from '../services/api';
import Sidebar from './Sidebar';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { 
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
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSopViewer, setShowSopViewer] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [sopUrl, setSopUrl] = useState(null);
  const [sopExists, setSopExists] = useState(false);
  const [sopLoading, setSopLoading] = useState(false);
  const [sopUploading, setSopUploading] = useState(false);
  const [sopDeleting, setSopDeleting] = useState(false);
  const [sopError, setSopError] = useState(null);
  const sopFileInputRef = useRef(null);

  const canManageSop = hasPermission('dashboard', 'edit') || user?.role === 'Super Admin';

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


  // Log page access for audit trail
  useEffect(() => {
    if (user && location.pathname) {
      const getPageName = (pathname) => {
        const pathMap = {
          '/dashboard': 'Dashboard',
          '/ncd-series': 'NCD Series',
          '/investors': 'Investors',
          '/reports': 'Reports',
          '/compliance': 'Compliance',
          '/interest-payout': 'Interest Payout',
          '/communication': 'Communication',
          '/administrator': 'Administrator',
          '/approval': 'Approval',
          '/grievance-management': 'Grievance Management',
          '/audit-log': 'Audit Log',
          '/investor/dashboard': 'Investor Dashboard',
          '/investor/account': 'Investor Account',
          '/investor/series': 'Investor Series'
        };
        return pathMap[pathname] || pathname.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      const pageName = getPageName(location.pathname);
      
    }
  }, [location.pathname, user]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };


  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openSopViewer = async () => {
    setSopError(null);
    setSopLoading(true);
    setShowSopViewer(true);
    try {
      const result = await apiService.getSopDocument();
      setSopExists(result.exists);
      setSopUrl(result.exists ? result.url : null);
    } catch (err) {
      setSopError('Failed to load SOP document.');
      setSopExists(false);
      setSopUrl(null);
    } finally {
      setSopLoading(false);
    }
  };

  const handleSopUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSopUploading(true);
    setSopError(null);
    try {
      const result = await apiService.uploadSopDocument(file);
      setSopExists(true);
      setSopUrl(result.url);
    } catch (err) {
      setSopError(err.message || 'Failed to upload SOP document.');
    } finally {
      setSopUploading(false);
      if (sopFileInputRef.current) sopFileInputRef.current.value = '';
    }
  };

  const handleSopDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the SOP document? This cannot be undone.')) return;
    setSopDeleting(true);
    setSopError(null);
    try {
      await apiService.deleteSopDocument();
      setSopExists(false);
      setSopUrl(null);
    } catch (err) {
      setSopError(err.message || 'Failed to delete SOP document.');
    } finally {
      setSopDeleting(false);
    }
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
        mobileHeaderButtons={
          <div className="mobile-header-buttons-container">
            <button 
              className="sop-document-button"
              onClick={openSopViewer}
              title="View SOP Document"
            >
              <HiOutlineDocumentText size={18} />
              SOP
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
            >
              â˜°
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
                onClick={openSopViewer}
                title="View SOP Document"
              >
                <HiOutlineDocumentText size={20} />
                SOP
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
                        Logout
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
          <p className="footer-text">© 2026 VAIBHAV VYAPAAR | All Rights Reserved.</p>
        </footer>
      </div>

      {showSopViewer && (
        <div className="sop-modal-overlay" onClick={() => setShowSopViewer(false)}>
          <div className="sop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sop-modal-header">
              <h3>SOP - NCD - VVPL</h3>
              <button className="sop-close" onClick={() => setShowSopViewer(false)}>×</button>
            </div>
            <div className="sop-modal-body">
              {sopLoading ? (
                <div className="sop-loading">Loading SOP document...</div>
              ) : sopError ? (
                <div className="sop-error">{sopError}</div>
              ) : sopExists && sopUrl ? (
                <iframe
                  title="SOP - NCD - VVPL"
                  src={sopUrl}
                  className="sop-iframe"
                />
              ) : (
                <div className="sop-not-found">
                  No SOP document uploaded yet.
                  {canManageSop && ' Use the Upload button below to add one.'}
                </div>
              )}
            </div>
            <div className="sop-modal-footer">
              {sopExists && sopUrl && (
                <button
                  className="sop-download"
                  onClick={async () => {
                    try {
                      await apiService.createAuditLog({
                        action: 'Document Downloaded',
                        admin_name: user?.full_name || user?.name || user?.username || 'Unknown User',
                        admin_role: user?.role || user?.displayRole || 'Unknown Role',
                        details: `User downloaded SOP - NCD - VVPL document`,
                        entity_type: 'Document',
                        entity_id: 'sop_ncd_vvpl',
                        changes: {
                          document_name: 'SOP - NCD - VVPL',
                          document_type: 'SOP',
                          action: 'document_download',
                          timestamp: new Date().toISOString(),
                          username: user?.username,
                          user_role: user?.role || user?.displayRole
                        }
                      });
                    } catch (error) {
                      // Don't prevent download if logging fails
                    }
                    window.open(sopUrl, '_blank');
                  }}
                >
                  Download
                </button>
              )}
              {canManageSop && (
                <>
                  <input
                    ref={sopFileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleSopUpload}
                  />
                  <button
                    className="sop-upload"
                    onClick={() => sopFileInputRef.current?.click()}
                    disabled={sopUploading}
                  >
                    {sopUploading ? 'Uploading...' : sopExists ? 'Replace' : 'Upload'}
                  </button>
                  {sopExists && (
                    <button
                      className="sop-delete"
                      onClick={handleSopDelete}
                      disabled={sopDeleting}
                    >
                      {sopDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </>
              )}
              <button className="sop-close-footer" onClick={() => setShowSopViewer(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

