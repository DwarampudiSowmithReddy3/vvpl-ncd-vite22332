import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Import only essential components first
import Login from './pages/Login';

function AuthenticatedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role === 'Investor') {
    return <Navigate to="/investor/dashboard" replace />;
  }
  
  if (!requireAdmin && user?.role !== 'Investor') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Simple Dashboard for testing
const SimpleDashboard = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard - Debug Mode</h1>
      <p>✅ App is working! This is a simplified dashboard.</p>
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '1rem', 
        borderRadius: '4px',
        marginTop: '1rem'
      }}>
        <strong>Status:</strong> Application restored and working
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    console.log('🚀 App component mounted - Debug mode');
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <SimpleDashboard />
                </AuthenticatedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;