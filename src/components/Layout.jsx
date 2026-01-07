import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import FloatingGreeting from './FloatingGreeting';
import './Layout.css';

const Layout = ({ children, isInvestor = false }) => {
  const { user, justLoggedIn, clearJustLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFloatingGreeting, setShowFloatingGreeting] = useState(false);

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

  return (
    <div className="layout">
      <Sidebar
        isInvestor={isInvestor}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        disabled={showFloatingGreeting}
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
                src="/logo_lf_ncd.png" 
                alt="NCD Platform Logo" 
              />
            )}
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
    </div>
  );
};

export default Layout;
