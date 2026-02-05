import React from 'react';
import Layout from '../components/Layout';

const TestDashboard = () => {
  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <h1>Test Dashboard</h1>
        <p>This is a simple test dashboard to verify the basic setup is working.</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#e3f2fd', 
            border: '1px solid #2196f3',
            borderRadius: '8px'
          }}>
            <h3>System Status</h3>
            <p>✅ Frontend: Working</p>
            <p>✅ Layout: Working</p>
            <p>✅ Routing: Working</p>
          </div>
          
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#e8f5e8', 
            border: '1px solid #4caf50',
            borderRadius: '8px'
          }}>
            <h3>Authentication</h3>
            <p>✅ Login: Successful</p>
            <p>✅ Permissions: Working</p>
            <p>✅ Navigation: Working</p>
          </div>
          
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fff3e0', 
            border: '1px solid #ff9800',
            borderRadius: '8px'
          }}>
            <h3>Next Steps</h3>
            <p>🔄 API Integration</p>
            <p>🔄 Data Loading</p>
            <p>🔄 Dashboard Components</p>
          </div>
        </div>
        
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Debug Information</h3>
          <p><strong>Current Time:</strong> {new Date().toLocaleString()}</p>
          <p><strong>Page:</strong> Test Dashboard</p>
          <p><strong>Status:</strong> Rendering Successfully</p>
        </div>
      </div>
    </Layout>
  );
};

export default TestDashboard;