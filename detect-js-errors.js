// Run this in browser console to detect JavaScript errors
console.log('🔍 JavaScript Error Detection Started');

// Capture all errors
window.addEventListener('error', (e) => {
  console.error('🚨 JAVASCRIPT ERROR DETECTED:');
  console.error('Message:', e.message);
  console.error('File:', e.filename);
  console.error('Line:', e.lineno);
  console.error('Column:', e.colno);
  console.error('Error object:', e.error);
  console.error('Stack trace:', e.error?.stack);
});

// Capture unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION:');
  console.error('Reason:', e.reason);
  console.error('Promise:', e.promise);
});

// Check React errors
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('React')) {
    console.error('🚨 REACT ERROR DETECTED:', ...args);
  }
  originalConsoleError.apply(console, args);
};

console.log('✅ Error detection setup complete. Now navigate to the problematic pages.');