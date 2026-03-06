import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import auditService from '../services/auditService';
import Sidebar from './Sidebar';
import FloatingGreeting from './FloatingGreeting';
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
  const { user, justLoggedIn, clearJustLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFloatingGreeting, setShowFloatingGreeting] = useState(false);
  const [showSopViewer, setShowSopViewer] = useState(false);
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

  // Show floating greeting only when user just logged in and is on dashboard
  useEffect(() => {
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/investor/dashboard';
    if (isDashboard && justLoggedIn && user?.name) {
      setShowFloatingGreeting(true);
    }
  }, [location.pathname, justLoggedIn, user?.name]);

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
      
      // TEMPORARILY DISABLED - audit logging was causing 422 errors and infinite loops
      // Log page access (but don't log login page to avoid spam)
      // if (location.pathname !== '/login' && location.pathname !== '/') {
      //   auditService.logPageAccess(user, pageName).catch(error => {
      //     if (import.meta.env.DEV) {
      //       console.error('Failed to log page access:', error);
      //     }
      //   });
      // }
    }
  }, [location.pathname, user]);

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
                src="/sop_ncd_vvpl_v1.0.pdf"
                className="sop-iframe"
              />
            </div>
            <div className="sop-modal-footer">
              <button
                className="sop-download"
                onClick={() => window.open("/sop_ncd_vvpl_v1.0.pdf", "_blank")}
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
    </div>
  );
};

export default Layout;
