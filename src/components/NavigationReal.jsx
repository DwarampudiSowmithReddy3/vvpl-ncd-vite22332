import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextNew';
import { 
  FaTachometerAlt, FaUsers, FaChartLine, FaFileAlt, 
  FaShieldAlt, FaDollarSign, FaComments, FaCog, 
  FaCheckCircle, FaExclamationTriangle 
} from 'react-icons/fa';

const NavigationReal = () => {
  const { hasPermission, canAccessModule } = useAuth();
  const location = useLocation();

  // Navigation items with REAL permission checks
  const navigationItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: FaTachometerAlt,
      module: 'dashboard'
    },
    {
      path: '/ncd-series',
      name: 'NCD Series',
      icon: FaChartLine,
      module: 'ncdSeries'
    },
    {
      path: '/investors',
      name: 'Investors',
      icon: FaUsers,
      module: 'investors'
    },
    {
      path: '/reports',
      name: 'Reports',
      icon: FaFileAlt,
      module: 'reports'
    },
    {
      path: '/compliance',
      name: 'Compliance',
      icon: FaShieldAlt,
      module: 'compliance'
    },
    {
      path: '/interest-payout',
      name: 'Interest Payout',
      icon: FaDollarSign,
      module: 'interestPayout'
    },
    {
      path: '/communication',
      name: 'Communication',
      icon: FaComments,
      module: 'communication'
    },
    {
      path: '/administrator',
      name: 'Administrator',
      icon: FaCog,
      module: 'administrator'
    },
    {
      path: '/approval',
      name: 'Approval',
      icon: FaCheckCircle,
      module: 'approval'
    },
    {
      path: '/grievance',
      name: 'Grievance Management',
      icon: FaExclamationTriangle,
      module: 'grievanceManagement'
    }
  ];

  // Filter navigation items based on REAL permissions
  const visibleItems = navigationItems.filter(item => 
    canAccessModule(item.module)
  );

  return (
    <nav className="navigation-real">
      <div className="nav-header">
        <h2>NCD Management</h2>
        <p>Real Permission System</p>
      </div>
      
      <ul className="nav-items">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <li key={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Link to={item.path} className="nav-link">
                <Icon className="nav-icon" />
                <span className="nav-text">{item.name}</span>
                {hasPermission(item.module, 'view') && (
                  <span className="permission-indicator view">V</span>
                )}
                {hasPermission(item.module, 'create') && (
                  <span className="permission-indicator create">C</span>
                )}
                {hasPermission(item.module, 'edit') && (
                  <span className="permission-indicator edit">E</span>
                )}
                {hasPermission(item.module, 'delete') && (
                  <span className="permission-indicator delete">D</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      
      {visibleItems.length === 0 && (
        <div className="no-access">
          <p>No modules accessible with current permissions</p>
        </div>
      )}
    </nav>
  );
};

export default NavigationReal;