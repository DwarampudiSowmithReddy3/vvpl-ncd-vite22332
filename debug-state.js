// Add this to browser console to debug the state issue
console.log('🔍 Starting state debugging...');

// Monitor authentication state changes
let authState = { isAuthenticated: false, user: null };
let dataState = { series: [], investors: [], loading: true };

// Check localStorage
console.log('💾 localStorage user:', localStorage.getItem('user'));

// Monitor React state changes (if you can access the React DevTools)
setInterval(() => {
  // This will help us see when the state changes
  const currentPath = window.location.pathname;
  console.log(`📍 Current path: ${currentPath}`);
  
  // Check if there are any React error boundaries triggered
  const reactErrors = document.querySelectorAll('[data-reactroot] *').length;
  if (reactErrors === 0) {
    console.log('⚠️ No React elements found - possible crash');
  }
}, 2000);

console.log('✅ Debug monitoring started. Watch the console for state changes.');