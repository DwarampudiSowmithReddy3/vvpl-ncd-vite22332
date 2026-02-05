import React from 'react';

const TestApp = () => {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ React App Working</h1>
      <p>This is a minimal test component to verify React is working.</p>
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '1rem', 
        borderRadius: '4px',
        border: '1px solid #c3e6cb',
        marginTop: '1rem'
      }}>
        <h3 style={{ color: '#155724', margin: '0 0 0.5rem 0' }}>Status:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#155724' }}>
          <li>React is rendering</li>
          <li>JavaScript is working</li>
          <li>CSS styles are applied</li>
          <li>No white page error</li>
        </ul>
      </div>
      
      <button 
        onClick={() => alert('Button click works!')}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Test Button
      </button>
    </div>
  );
};

export default TestApp;