import React, { useState, useEffect } from 'react';
import './FloatingGreeting.css';

const FloatingGreeting = ({ userName, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [progress, setProgress] = useState(100); // Start at 100% and reduce

  useEffect(() => {
    // Set initial time and update it
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Progress animation - reduce from 100% to 0%
    const duration = 3000; // 3 seconds
    const interval = 50; // Update every 50ms for smooth animation
    const decrement = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(progressTimer);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onComplete after fade out animation completes
      setTimeout(() => {
        onComplete();
      }, 500); // Match the CSS transition duration
    }, 3000); // Show for 3 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Background Blur Overlay */}
      <div className="greeting-backdrop" />
      
      {/* Greeting Card */}
      <div className={`floating-greeting ${!isVisible ? 'fade-out' : ''}`}>
        <div className="greeting-wrapper">
          <div className="greeting-time">
            {currentTime}
          </div>
          <div className="greeting-content">
            <div className="greeting-main">
              <span className="greeting-welcome">Welcome,</span>
              <span className="greeting-name">{userName} 👋</span>
            </div>
            <div className="greeting-subtitle">
              Have a great day
            </div>
          </div>
          
          {/* Progress Line */}
          <div className="greeting-progress-container">
            <div 
              className="greeting-progress-line" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingGreeting;