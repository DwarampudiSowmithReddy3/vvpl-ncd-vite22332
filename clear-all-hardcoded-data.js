// Clear ALL hardcoded data from localStorage
console.log('🧹 Clearing ALL hardcoded data from localStorage...');

// Clear all data arrays
localStorage.removeItem('investors');
localStorage.removeItem('series');
localStorage.removeItem('complaints');
localStorage.removeItem('auditLogs');
localStorage.removeItem('satisfactionEvents');
localStorage.removeItem('complianceStatus');
localStorage.removeItem('payoutStatusUpdates');
localStorage.removeItem('payoutMetadata');
localStorage.removeItem('dataVersion');

// Clear user session (force re-login)
localStorage.removeItem('user');

console.log('✅ All hardcoded data cleared from localStorage');
console.log('✅ User session cleared - will need to re-login');
console.log('✅ Application is now ready for backend-only data');

// Reload the page to start fresh
window.location.reload();