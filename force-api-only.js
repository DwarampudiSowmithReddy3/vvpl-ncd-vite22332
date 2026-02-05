// Force API-Only Mode - Clear All LocalStorage Data
console.log('🧹 FORCING API-ONLY MODE - Clearing all localStorage data...');

// Show current localStorage contents
console.log('📋 Current localStorage contents:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`   ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
}

// Clear ALL localStorage data
localStorage.clear();
console.log('✅ ALL localStorage data cleared!');

// Verify it's empty
console.log('📋 localStorage after clearing:');
console.log('   Keys remaining:', localStorage.length);

// Force page reload to start fresh
console.log('🔄 Reloading page to start fresh with API-only data...');
setTimeout(() => {
    window.location.reload();
}, 1000);