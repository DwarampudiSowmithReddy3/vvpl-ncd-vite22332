import React from 'react';
import './LogoLoadingAnimation.css';

const LogoLoadingAnimation = ({ onComplete }) => {
  // Auto complete after 3 seconds
  React.useEffect(() => {
    console.log('🎬 LogoLoadingAnimation mounted - animation starting');
    const timer = setTimeout(() => {
      console.log('✅ Animation complete - calling onComplete');
      if (onComplete) onComplete();
    }, 3000);
    return () => {
      console.log('🛑 LogoLoadingAnimation unmounting');
      clearTimeout(timer);
    };
  }, [onComplete]);

  console.log('🎨 Rendering LogoLoadingAnimation');

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
