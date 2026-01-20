// Clear localStorage and force data reset
// Run this in browser console: copy and paste this entire script

console.log('🔄 Clearing localStorage and forcing data reset...');

// Clear all localStorage data
localStorage.clear();

// Set new data version to force reset
localStorage.setItem('dataVersion', '1.2.0');

console.log('✅ localStorage cleared! Refresh the page to see updated data with series codes and trustee names.');
console.log('📋 Expected data:');
console.log('- Series A: NCD-A-2023, IDBI Trusteeship Services Ltd');
console.log('- Series B: NCD-B-2023, Catalyst Trusteeship Ltd');
console.log('- Series C: NCD-C-2024, Axis Trustee Services Ltd');
console.log('- Series D: NCD-D-2024, SBICAP Trustee Company Ltd');
console.log('- Series E: NCD-E-2024, Vistra ITCL (India) Ltd');
console.log('- Series AB: NCD-AB-2024, IDBI Trusteeship Services Ltd');

// Refresh the page
window.location.reload();