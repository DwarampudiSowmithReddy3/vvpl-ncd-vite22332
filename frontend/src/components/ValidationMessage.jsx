import React from 'react';
import './ValidationMessage.css';

const ValidationMessage = ({ message, type = 'error' }) => {
  if (!message) return null;
  
  return (
    <div className={`validation-message ${type}`}>
      <span className="validation-icon">
        {type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
      </span>
      <span className="validation-text">{message}</span>
    </div>
  );
};

export default ValidationMessage;