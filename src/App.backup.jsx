import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { initializeButtonClickHandler } from './utils/buttonClickHandler';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Investors from './pages/Investors';
import NCDSeries from './pages/NCDSeries';
import Reports from './pages/Reports';
import InterestPayout from './pages/InterestPayout';
import Communication from './pages/Communication';
import Compliance from './pages/Compliance';
import Administrator from './pages/Administrator';
import Approval from './pages/Approval';
import GrievanceManagement from './pages/GrievanceManagement';
import InvestorDashboard from './pages/InvestorDashboard';
import InvestorSeries from './pages/InvestorSeries';
import InvestorAccount from './pages/InvestorAccount';
import InvestorDetails from './pages/InvestorDetails';
import SeriesDetails from './pages/SeriesDetails';
import TestIcon from './TestIcon'; // <-- Added for testing react-icons
import './responsive-utilities.css'; // Import responsive utilities

function AuthenticatedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Wait for auth state to load from localStorage
  if (isLoading) {
    return null; // or a loading spinner
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
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes with Permission Protection */}
            <Route 
              path="/dashboard" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/grievance-management" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="grievanceManagement">
                    <GrievanceManagement />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/investors" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="investors">
                    <Investors />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/investors/:id" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="investors">
                    <InvestorDetails />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/ncd-series" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="ncdSeries">
                    <NCDSeries />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/ncd-series/:id" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="ncdSeries">
                    <SeriesDetails />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="reports">
                    <Reports />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/interest-payout" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="interestPayout">
                    <InterestPayout />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/communication" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="communication">
                    <Communication />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/compliance" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="compliance">
                    <Compliance />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/administrator" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="administrator">
                    <Administrator />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/approval" 
              element={
                <AuthenticatedRoute requireAdmin={true}>
                  <ProtectedRoute module="approval">
                    <Approval />
                  </ProtectedRoute>
                </AuthenticatedRoute>
              } 
            />
            
            {/* Investor Routes */}
            <Route 
              path="/investor/dashboard" 
              element={
                <AuthenticatedRoute requireAdmin={false}>
                  <InvestorDashboard />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/investor/series" 
              element={
                <AuthenticatedRoute requireAdmin={false}>
                  <InvestorSeries />
                </AuthenticatedRoute>
              } 
            />
            <Route 
              path="/investor/account" 
              element={
                <AuthenticatedRoute requireAdmin={false}>
                  <InvestorAccount />
                </AuthenticatedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
