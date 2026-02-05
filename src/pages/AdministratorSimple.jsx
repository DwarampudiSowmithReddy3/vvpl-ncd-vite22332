import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const AdministratorSimple = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simple test without backend
    setTimeout(() => {
      setUsers([
        { id: 1, username: 'test_user', fullName: 'Test User', role: 'Admin' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Administrator</h1>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Administrator</h1>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <h1>Administrator (Simple Test)</h1>
        <p>This is a simplified version to test if the component renders.</p>
        
        <h2>Users ({users.length})</h2>
        {users.map(user => (
          <div key={user.id} style={{ padding: '0.5rem', border: '1px solid #ccc', margin: '0.5rem 0' }}>
            <strong>{user.username}</strong> - {user.fullName} ({user.role})
          </div>
        ))}
        
        <button onClick={() => alert('Button works!')}>
          Test Button
        </button>
      </div>
    </Layout>
  );
};

export default AdministratorSimple;