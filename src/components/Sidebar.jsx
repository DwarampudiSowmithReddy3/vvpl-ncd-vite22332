import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';
import {
  HiOutlineViewGrid,
  HiTrendingUp,
  HiUsers,
  HiOutlineDocumentText,
  HiUser, 
  HiX,
  HiOutlineLogout,
  HiOutlineMail
} from "react-icons/hi";
import { HiOutlineClipboardDocumentCheck } from "react-icons/hi2";
import { RiQuestionnaireLine } from "react-icons/ri";
import { IoChevronBackCircle } from "react-icons/io5";
import { MdPayment, MdSecurity, MdAdminPanelSettings } from "react-icons/md";

const Sidebar = ({ isInvestor = false, isOpen = true, onClose, mobileHeaderButtons }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, canAccessModule } = useAuth();

  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid />, module: 'dashboard' },
    { path: '/ncd-series', label: 'NCD Series', icon: <HiTrendingUp />, module: 'ncdSeries' },
    { path: '/investors', label: 'Investors', icon: <HiUsers />, module: 'investors' },
    { path: '/reports', label: 'Reports', icon: <HiOutlineDocumentText />, module: 'reports' },
    { path: '/interest-payout', label: 'Interest Payout', icon: <MdPayment />, module: 'interestPayout' },
    { path: '/communication', label: 'Communication', icon: <HiOutlineMail />, module: 'communication' },
    { path: '/compliance', label: 'Compliance', icon: <MdSecurity />, module: 'compliance' },
    { path: '/administrator', label: 'Administrator', icon: <MdAdminPanelSettings />, module: 'administrator' },
    { path: '/approval', label: 'Approval', icon: <HiOutlineClipboardDocumentCheck />, module: 'approval' },
    { path: '/grievance-management', label: 'Grievance Management', icon: <RiQuestionnaireLine />, module: 'grievanceManagement' }
  ];

  const investorNavItems = [
    { path: '/investor/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
    { path: '/investor/series', label: 'Series', icon: <HiTrendingUp /> },
    { path: '/investor/account', label: 'My Account', icon: <HiUser /> }
  ];

  // Filter admin nav items based on permissions
  const getFilteredNavItems = () => {
    if (isInvestor) {
      return investorNavItems;
    }
    
    return adminNavItems.filter(item => {
      if (!item.module) return true; // Always show items without module requirement
      return canAccessModule(item.module);
    });
  };

  const navItems = getFilteredNavItems();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img className="sidebar-title" src="/logo_lf_ncd.svg" alt="NCD Platform Logo" />
        <button className="sidebar-close" onClick={onClose}>
          <IoChevronBackCircle style={{color: '#1e40af', paddingLeft: '3px'}} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* Mobile Header Buttons - Only show on mobile */}
      {mobileHeaderButtons && (
        <div className="sidebar-mobile-buttons">
          {mobileHeaderButtons}
        </div>
      )}
      
      <div className="sidebar-footer">
        <button 
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span className="sidebar-icon"><HiOutlineLogout /></span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

