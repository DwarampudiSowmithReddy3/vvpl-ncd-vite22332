import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Permissions data structure
const PERMISSIONS = {
  'Finance Executive': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false }
  },
  'Finance Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: true, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false }
  },
  'Compliance Base': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: true, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false }
  },
  'Compliance Officer': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: true, edit: true, delete: false },
    investors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: true, edit: false, delete: false },
    compliance: { view: true, create: true, edit: true, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: true, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false }
  },
  'Compliance Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: true, edit: true, delete: false },
    investors: { view: true, create: false, edit: true, delete: false },
    reports: { view: true, create: true, edit: true, delete: false },
    compliance: { view: true, create: true, edit: true, delete: true },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: true, create: true, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: false, edit: false, delete: false }
  },
  'Investor Relationship Executive': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: false, create: false, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: true, create: true, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false }
  },
  'Investor Relationship Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: true, create: true, edit: true, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false }
  },
  'Board Member Base': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: false, edit: false, delete: false }
  },
  'Board Member Head': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: false, edit: false, delete: false },
    investors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    compliance: { view: true, create: false, edit: false, delete: false },
    interestPayout: { view: true, create: false, edit: false, delete: false },
    communication: { view: true, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: true, edit: true, delete: false }
  },
  'Admin': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: true, create: true, edit: true, delete: false },
    investors: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: true, edit: true, delete: false },
    compliance: { view: true, create: true, edit: true, delete: false },
    interestPayout: { view: true, create: true, edit: true, delete: false },
    communication: { view: true, create: true, edit: true, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: true, create: true, edit: true, delete: false }
  },
  'Super Admin': {
    dashboard: { view: true, create: true, edit: true, delete: true },
    ncdSeries: { view: true, create: true, edit: true, delete: true },
    investors: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    compliance: { view: true, create: true, edit: true, delete: true },
    interestPayout: { view: true, create: true, edit: true, delete: true },
    communication: { view: true, create: true, edit: true, delete: true },
    administrator: { view: true, create: true, edit: true, delete: true },
    approval: { view: true, create: true, edit: true, delete: true }
  },
  'Investor': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    ncdSeries: { view: false, create: false, edit: false, delete: false },
    investors: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
    compliance: { view: false, create: false, edit: false, delete: false },
    interestPayout: { view: false, create: false, edit: false, delete: false },
    communication: { view: false, create: false, edit: false, delete: false },
    administrator: { view: false, create: false, edit: false, delete: false },
    approval: { view: false, create: false, edit: false, delete: false }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (username, password) => {
    // Super Admin (existing)
    if (username === 'subbireddy' && password === 'subbireddy') {
      const userData = {
        username: 'subbireddy',
        role: 'Super Admin',
        name: 'Subbireddy',
        displayRole: 'Super Admin'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    } 
    // Demo Admin Account (new)
    else if (username === 'demo' && password === 'demo') {
      const userData = {
        username: 'demo',
        role: 'Admin',
        name: 'Demo Admin',
        displayRole: 'Admin'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    }
    // Finance Manager
    else if (username === 'Finance Manager' && password === 'Finance Manager') {
      const userData = {
        username: 'FM',
        role: 'Finance Manager',
        name: 'Finance Manager',
        displayRole: 'Finance Manager'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    }
    // Compliance Manager
    else if (username === 'finance_executive' && password === 'financeexecutive') {
      const userData = {
        username: 'finance_executive',
        role: 'Finance Executive',
        name: 'Finance Executive',
        displayRole: 'Finance Executive'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    }
    else if (username === 'compliance_manager' && password === 'compliancemanager') {
      const userData = {
        username: 'compliance_manager',
        role: 'Compliance Manager',
        name: 'Compliance Manager',
        displayRole: 'Compliance Manager'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    }
    // Board Member Base
    else if (username === 'board_member' && password === 'boardmember') {
      const userData = {
        username: 'board_member',
        role: 'Board Member Base',
        name: 'Board Member Base',
        displayRole: 'Board Member Base'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    }
    // Investor (existing)
    else if (username === 'sowmith' && password === 'sowmith') {
      // SECURITY CHECK: Verify investor account status
      const investorsData = JSON.parse(localStorage.getItem('investors') || '[]');
      const investorAccount = investorsData.find(inv => inv.investorId === 'ABCDE1234F');
      
      console.log('Login security check for investor:', investorAccount);
      
      // Block login for deleted or deactivated accounts
      if (investorAccount && (
        investorAccount.status === 'deleted' || 
        investorAccount.status === 'deactivated' || 
        investorAccount.active === false
      )) {
        console.log('Blocking login for inactive investor account');
        if (investorAccount.status === 'deleted') {
          return { success: false, error: 'Your account has been deleted. Please contact support.' };
        } else {
          return { success: false, error: 'Your account has been deactivated. Please contact support to reactivate your account.' };
        }
      }
      
      const userData = {
        username: 'sowmith',
        role: 'Investor',
        name: 'Sowmith',
        investorId: 'ABCDE1234F',
        displayRole: 'Investor'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'investor' };
    }
    // Check for any investor login (dynamic investor accounts)
    const investorsData = JSON.parse(localStorage.getItem('investors') || '[]');
    const matchingInvestor = investorsData.find(inv => 
      (inv.email === username || inv.investorId === username) && 
      (inv.password === password || inv.phone === password || inv.investorId === password)
    );
    
    if (matchingInvestor) {
      console.log('Found matching investor for login:', matchingInvestor);
      
      // ABSOLUTE BLOCK: Deleted accounts cannot login EVER
      if (matchingInvestor.status === 'deleted' || matchingInvestor.canLogin === false) {
        console.log('🚫 PERMANENT BLOCK: Deleted investor cannot login');
        return { 
          success: false, 
          error: 'Account has been permanently deleted. Access denied. Contact support if needed.' 
        };
      }
      
      // SECURITY CHECK: Block deactivated accounts
      if (matchingInvestor.status === 'deactivated' || matchingInvestor.active === false) {
        console.log('🚫 TEMPORARY BLOCK: Deactivated investor cannot login');
        return { 
          success: false, 
          error: 'Your account has been deactivated. Please contact support to reactivate your account.' 
        };
      }
      
      const userData = {
        username: matchingInvestor.investorId,
        role: 'Investor',
        name: matchingInvestor.name,
        investorId: matchingInvestor.investorId,
        displayRole: 'Investor'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'investor' };
    }
    
    return { success: false, error: 'Invalid credentials' };
  };

  // Check if user has permission for a specific module and action
  const hasPermission = (module, action = 'view') => {
    if (!user || !user.role) return false;
    
    const userPermissions = PERMISSIONS[user.role];
    if (!userPermissions || !userPermissions[module]) return false;
    
    return userPermissions[module][action] === true;
  };

  // Check if user can access a page/module
  const canAccessModule = (module) => {
    return hasPermission(module, 'view');
  };

  // Update permissions (for admin interface)
  const updatePermissions = (newPermissions) => {
    // In a real app, this would make an API call
    // For now, we'll just update the local PERMISSIONS object
    Object.assign(PERMISSIONS, newPermissions);
  };

  const clearJustLoggedIn = () => {
    setJustLoggedIn(false);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setJustLoggedIn(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading,
      justLoggedIn, 
      login, 
      logout, 
      clearJustLoggedIn,
      hasPermission,
      canAccessModule,
      updatePermissions,
      PERMISSIONS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

