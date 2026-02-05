/**
 * API Integration Test Component
 * Tests the connection between frontend and backend
 */
import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ApiIntegrationTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState('pending');

  const tests = [
    { name: 'Health Check', key: 'health', test: () => apiService.healthCheck() },
    { name: 'Login Test', key: 'login', test: () => apiService.login('admin', 'admin123') },
    { name: 'Dashboard Metrics', key: 'dashboard', test: () => apiService.getDashboardMetrics() },
    { name: 'Series Data', key: 'series', test: () => apiService.getSeries() },
    { name: 'Investors Data', key: 'investors', test: () => apiService.getInvestors() },
    { name: 'Interest Payouts', key: 'payouts', test: () => apiService.getInterestPayouts() },
    { name: 'Grievances', key: 'grievances', test: () => apiService.getInvestorGrievances() },
    { name: 'Reports', key: 'reports', test: () => apiService.getReports() }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    const results = {};
    let passedCount = 0;
    
    for (const test of tests) {
      try {
        console.log(`🧪 Running test: ${test.name}`);
        const startTime = Date.now();
        const result = await test.test();
        const duration = Date.now() - startTime;
        
        results[test.key] = {
          status: 'pass',
          duration,
          data: result,
          message: `✅ ${test.name} passed (${duration}ms)`
        };
        passedCount++;
        
        // Store token if login test passed
        if (test.key === 'login' && result.access_token) {
          localStorage.setItem('access_token', result.access_token);
        }
        
      } catch (error) {
        results[test.key] = {
          status: 'fail',
          error: error.message,
          message: `❌ ${test.name} failed: ${error.message}`
        };
      }
      
      setTestResults({ ...results });
    }
    
    setOverallStatus(passedCount === tests.length ? 'pass' : 'fail');
    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'running': return '⏳';
      default: return '⏸️';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return '#10b981';
      case 'fail': return '#ef4444';
      case 'running': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>
          🔗 API Integration Test
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ 
            padding: '4px 12px', 
            borderRadius: '20px', 
            backgroundColor: getStatusColor(overallStatus),
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {overallStatus === 'pass' ? 'ALL TESTS PASSED' : 
             overallStatus === 'fail' ? 'SOME TESTS FAILED' : 'TESTING...'}
          </div>
          <button 
            onClick={runTests}
            disabled={isRunning}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.6 : 1
            }}
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {tests.map(test => {
          const result = testResults[test.key];
          const status = isRunning && !result ? 'running' : result?.status || 'pending';
          
          return (
            <div 
              key={test.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'white',
                border: `1px solid ${getStatusColor(status)}`,
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>
                  {getStatusIcon(status)}
                </span>
                <span style={{ fontWeight: 'bold' }}>
                  {test.name}
                </span>
              </div>
              
              <div style={{ textAlign: 'right', fontSize: '12px' }}>
                {result && (
                  <>
                    <div style={{ color: getStatusColor(status) }}>
                      {result.message}
                    </div>
                    {result.duration && (
                      <div style={{ color: '#6b7280' }}>
                        {result.duration}ms
                      </div>
                    )}
                    {result.data && typeof result.data === 'object' && (
                      <div style={{ color: '#6b7280' }}>
                        {Array.isArray(result.data) 
                          ? `${result.data.length} records`
                          : Object.keys(result.data).length + ' fields'
                        }
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {overallStatus === 'pass' && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#10b981',
          color: 'white',
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          🎉 Integration Successful! Your frontend is now connected to the SQL Server backend.
        </div>
      )}

      {overallStatus === 'fail' && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ef4444',
          color: 'white',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          ⚠️ Some tests failed. Check the SQL Server backend is running on http://localhost:8003
        </div>
      )}
    </div>
  );
};

export default ApiIntegrationTest;