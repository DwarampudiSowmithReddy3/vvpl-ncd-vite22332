import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const APIDebug = () => {
  const [status, setStatus] = useState('Checking...');
  const [logs, setLogs] = useState([]);
  const [token, setToken] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testBackendConnection = async () => {
    addLog('Testing backend connection...', 'info');
    try {
      const health = await apiService.healthCheck();
      addLog(`✅ Backend connected: ${health.status}`, 'success');
      setStatus('Backend Connected');
      return true;
    } catch (error) {
      addLog(`❌ Backend connection failed: ${error.message}`, 'error');
      setStatus('Backend Disconnected');
      return false;
    }
  };

  const testLogin = async () => {
    addLog('Testing login...', 'info');
    try {
      const response = await apiService.login('admin', 'admin123');
      addLog(`✅ Login successful: ${response.user.username}`, 'success');
      setToken(response.access_token);
      return true;
    } catch (error) {
      addLog(`❌ Login failed: ${error.message}`, 'error');
      return false;
    }
  };

  const testGetUsers = async () => {
    if (!token) {
      addLog('❌ No token available for users test', 'error');
      return;
    }
    
    addLog('Testing get users...', 'info');
    try {
      const users = await apiService.getUsers();
      addLog(`✅ Users loaded: ${users.length} users found`, 'success');
    } catch (error) {
      addLog(`❌ Get users failed: ${error.message}`, 'error');
    }
  };

  const runAllTests = async () => {
    setLogs([]);
    addLog('Starting API integration tests...', 'info');
    
    const backendOk = await testBackendConnection();
    if (backendOk) {
      const loginOk = await testLogin();
      if (loginOk) {
        await testGetUsers();
      }
    }
    
    addLog('Tests completed.', 'info');
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px', 
      background: 'white', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      padding: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
        🧪 API Debug Panel
      </h3>
      
      <div style={{ 
        padding: '8px', 
        background: status === 'Backend Connected' ? '#dcfce7' : '#fef2f2',
        color: status === 'Backend Connected' ? '#166534' : '#dc2626',
        borderRadius: '4px',
        fontSize: '12px',
        marginBottom: '10px'
      }}>
        Status: {status}
      </div>
      
      <button 
        onClick={runAllTests}
        style={{
          background: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        Run Tests Again
      </button>
      
      <div style={{ 
        maxHeight: '300px', 
        overflow: 'auto',
        fontSize: '11px',
        fontFamily: 'monospace'
      }}>
        {logs.map((log, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '2px 0',
              color: log.type === 'error' ? '#dc2626' : 
                     log.type === 'success' ? '#059669' : '#374151'
            }}
          >
            [{log.timestamp}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default APIDebug;