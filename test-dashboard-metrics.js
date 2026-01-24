// Test script to verify Dashboard metrics update correctly
// Run this in browser console on Dashboard page

console.log('🧪 Testing Dashboard Metrics Update');

// Get current metrics
const getCurrentMetrics = () => {
  const retentionElement = document.querySelector('.retention-percentage');
  const churnElement = document.querySelector('.churn-number');
  const redemptionElement = document.querySelector('.redemption-number');
  
  return {
    retention: retentionElement ? retentionElement.textContent : 'Not found',
    churn: churnElement ? churnElement.textContent : 'Not found',
    redemption: redemptionElement ? redemptionElement.textContent : 'Not found'
  };
};

// Log initial metrics
console.log('📊 Initial metrics:', getCurrentMetrics());

// Simulate data change by dispatching refresh event
console.log('🔄 Dispatching refresh event...');
window.dispatchEvent(new CustomEvent('dashboardRefresh'));

// Check metrics after 1 second
setTimeout(() => {
  console.log('📊 Metrics after refresh:', getCurrentMetrics());
}, 1000);

// Test localStorage change detection
console.log('💾 Testing localStorage change detection...');
const currentInvestors = JSON.parse(localStorage.getItem('investors') || '[]');
localStorage.setItem('investors', JSON.stringify(currentInvestors));

setTimeout(() => {
  console.log('📊 Metrics after localStorage change:', getCurrentMetrics());
}, 1000);

console.log('✅ Test completed. Check console for results.');