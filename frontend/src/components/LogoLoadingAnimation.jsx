import React from 'react';
import './LogoLoadingAnimation.css';

const LogoLoadingAnimation = ({ onComplete }) => {
  // Auto complete after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="logo-loading-overlay">
      <div className="loading-content">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
};

export default LogoLoadingAnimation;

