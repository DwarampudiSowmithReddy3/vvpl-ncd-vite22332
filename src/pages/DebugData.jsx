import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const DebugData = () => {
  const { series, loading, forceRefresh } = useData();
  const { user, isAuthenticated } = useAuth();

  const handleForceRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await forceRefresh();
  };

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <h1>Debug Data Context</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Authentication Status</h3>
          <p>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p>User: {user ? `${user.name} (${user.role})` : 'None'}</p>
          <p>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Data Context Status</h3>
          <p>Loading: {loading ? '⏳ Yes' : '✅ No'}</p>
          <p>Series Count: {series ? series.length : 'undefined'}</p>
          <p>Series Array: {Array.isArray(series) ? '✅ Valid Array' : '❌ Not Array'}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={handleForceRefresh}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Force Refresh Data
          </button>
        </div>

        <div>
          <h3>Series Data</h3>
          {loading ? (
            <p>Loading...</p>
          ) : series && series.length > 0 ? (
            <div>
              <p>Found {series.length} series:</p>
              {series.map((s, index) => (
                <div key={s.id || index} style={{
                  border: '1px solid #ccc',
                  margin: '10px 0',
                  padding: '10px',
                  borderRadius: '5px'
                }}>
                  <h4>{s.name || 'Unknown Name'}</h4>
                  <p>Code: {s.seriesCode || 'Unknown'}</p>
                  <p>Status: {s.status || 'Unknown'}</p>
                  <p>Interest Rate: {s.interestRate || 0}%</p>
                  <p>Target: ₹{s.targetAmount?.toLocaleString() || 0}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No series data available</p>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Console Logs</h3>
          <p>Check browser console for detailed DataContext logs</p>
        </div>
      </div>
    </Layout>
  );
};

export default DebugData;