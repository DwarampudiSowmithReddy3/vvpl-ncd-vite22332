import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (username, password) => {
    // Dummy authentication
    if (username === 'subbireddy' && password === 'subbireddy') {
      const userData = {
        username: 'subbireddy',
        role: 'admin',
        name: 'Subbireddy'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    } else if (username === 'sowmith' && password === 'sowmith') {
      const userData = {
        username: 'sowmith',
        role: 'investor',
        name: 'Sowmith',
        investorId: 'ABCDE1234F'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setJustLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: 'investor' };
    }
    return { success: false, error: 'Invalid credentials' };
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
    <AuthContext.Provider value={{ user, isAuthenticated, justLoggedIn, login, logout, clearJustLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

