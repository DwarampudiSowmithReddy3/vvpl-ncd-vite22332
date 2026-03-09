import React from 'react';
import LogoLoadingAnimation from './LogoLoadingAnimation';

const LoadingOverlay = ({ onAnimationComplete }) => {
  return <LogoLoadingAnimation onComplete={onAnimationComplete} />;
};

export default LoadingOverlay;
