import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { initializeButtonClickHandler } from './utils/buttonClickHandler';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Investors from './pages/Investors';
import NCDSeries from './pages/NCDSeries';
import Reports from './pages/Reports';
import InterestPayout from './pages/InterestPayout';
import Communication from './pages/Communication';
import Compliance from './pages/Compliance';
import Administrator from './pages/Administrator';
import InvestorDashboard from './pages/InvestorDashboard';
import InvestorSeries from './pages/InvestorSeries';
import InvestorAccount from './pages/InvestorAccount';
import InvestorDetails from './pages/InvestorDetails';
import SeriesDetails from './pages/SeriesDetails';
import TestIcon from './TestIcon'; // <-- Added for testing react-icons

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/investor/dashboard" replace />;
  }
  
  if (!requireAdmin && user?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  useEffect(() => {
    // Initialize global button click handler
    const cleanup = initializeButtonClickHandler();
    
    // Cleanup on component unmount
    return cleanup;
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
                <ProtectedRoute requireAdmin={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/investors" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Investors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/investors/:id" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <InvestorDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ncd-series" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <NCDSeries />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ncd-series/:id" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <SeriesDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interest-payout" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <InterestPayout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communication" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Communication />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/compliance" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Compliance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/administrator" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Administrator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/investor/dashboard" 
              element={
                <ProtectedRoute requireAdmin={false}>
                  <InvestorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/investor/series" 
              element={
                <ProtectedRoute requireAdmin={false}>
                  <InvestorSeries />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/investor/account" 
              element={
                <ProtectedRoute requireAdmin={false}>
                  <InvestorAccount />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
