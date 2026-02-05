import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import TestApp from './TestApp';

function AppTest() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<TestApp />} />
            <Route path="/test" element={<TestApp />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default AppTest;