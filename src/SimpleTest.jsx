import React from 'react';

function SimpleTest() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ React is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '1rem', 
        borderRadius: '4px',
        marginTop: '1rem'
      }}>
        <strong>Success:</strong> No white page error!
      </div>
    </div>
  );
}

export default SimpleTest;