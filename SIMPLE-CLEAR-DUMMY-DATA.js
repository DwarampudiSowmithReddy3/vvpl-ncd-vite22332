// SIMPLE SCRIPT TO CLEAR DUMMY DATA - Copy and paste in browser console

console.log('🧹 CLEARING DUMMY DATA...');

// Step 1: Clear all localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Step 2: Set empty data
localStorage.setItem('series', JSON.stringify([]));
localStorage.setItem('investors', JSON.stringify([]));
localStorage.setItem('complaints', JSON.stringify([]));
localStorage.setItem('dataVersion', '6.0.0-clean');

console.log('✅ Empty data set');
console.log('🔄 Refreshing page...');

// Step 3: Refresh page
setTimeout(() => {
    window.location.reload();
}, 1000);