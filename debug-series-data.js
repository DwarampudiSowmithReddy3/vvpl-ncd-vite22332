// Debug script to check series data
// Run this in browser console on the NCD Series page

console.log('🔍 DEBUGGING SERIES DATA');
console.log('========================');

// Check localStorage
const savedSeries = localStorage.getItem('series');
if (savedSeries) {
  const parsedSeries = JSON.parse(savedSeries);
  console.log('📦 localStorage series count:', parsedSeries.length);
  
  parsedSeries.forEach((s, index) => {
    console.log(`${index + 1}. ${s.name}:`);
    console.log(`   - seriesCode: "${s.seriesCode}"`);
    console.log(`   - debentureTrustee: "${s.debentureTrustee}"`);
  });
} else {
  console.log('❌ No series data in localStorage');
}

console.log('========================');
console.log('💡 If fields are missing, clear localStorage and refresh:');
console.log('   localStorage.clear(); window.location.reload();');