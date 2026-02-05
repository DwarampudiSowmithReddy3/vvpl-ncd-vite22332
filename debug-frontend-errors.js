// Frontend Error Diagnostic Script
console.log('🔍 FRONTEND DIAGNOSTIC STARTING...');

// Check if we can access the application
try {
  console.log('📍 Current URL:', window.location.href);
  console.log('📍 Current pathname:', window.location.pathname);
  
  // Check for React errors
  console.log('⚛️ React version:', React?.version || 'Not found');
  
  // Check localStorage
  console.log('💾 localStorage contents:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`  ${key}:`, localStorage.getItem(key));
  }
  
  // Check for any global errors
  window.addEventListener('error', (e) => {
    console.error('🚨 GLOBAL ERROR:', e.error);
    console.error('🚨 ERROR MESSAGE:', e.message);
    console.error('🚨 ERROR SOURCE:', e.filename, 'Line:', e.lineno);
  });
  
  // Check for unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', e.reason);
  });
  
  console.log('✅ Diagnostic script loaded successfully');
  
} catch (error) {
  console.error('❌ Error in diagnostic script:', error);
}