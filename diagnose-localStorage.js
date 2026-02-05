// DIAGNOSE LOCALSTORAGE - Run this in browser console
console.log('🔍 DIAGNOSING LOCALSTORAGE DATA...');

// Check what's currently stored
const investors = JSON.parse(localStorage.getItem('investors') || '[]');
const series = JSON.parse(localStorage.getItem('series') || '[]');
const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
const dataVersion = localStorage.getItem('dataVersion');

console.log('\n📊 CURRENT LOCALSTORAGE DATA:');
console.log('─'.repeat(50));
console.log(`Data Version: ${dataVersion}`);
console.log(`Investors: ${investors.length} found`);
console.log(`Series: ${series.length} found`);
console.log(`Complaints: ${complaints.length} found`);

console.log('\n👥 INVESTORS DETAILS:');
console.log('─'.repeat(30));
investors.forEach((inv, index) => {
    console.log(`${index + 1}. ${inv.name} (${inv.investorId})`);
    console.log(`   Email: ${inv.email}`);
    console.log(`   Series: ${inv.series ? inv.series.join(', ') : 'None'}`);
    console.log(`   Investment: ₹${inv.investment?.toLocaleString() || 0}`);
    console.log('');
});

console.log('\n📈 SERIES DETAILS:');
console.log('─'.repeat(30));
series.forEach((s, index) => {
    console.log(`${index + 1}. ${s.name} (${s.seriesCode || 'No Code'})`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Investors: ${s.investors || 0}`);
    console.log(`   Funds: ₹${s.fundsRaised?.toLocaleString() || 0}`);
    console.log('');
});

console.log('\n🔍 CHECKING FOR DUMMY DATA INDICATORS:');
console.log('─'.repeat(40));

// Check for specific dummy data
const hasRajeshKumar = investors.some(inv => inv.name?.includes('Rajesh Kumar'));
const hasSowmithReddy = investors.some(inv => inv.name?.includes('Sowmith Reddy'));
const hasSeriesAB = series.some(s => s.name === 'Series AB');
const hasDummyPAN = investors.some(inv => inv.investorId === 'ABCDE1234F');

console.log(`❌ Rajesh Kumar found: ${hasRajeshKumar}`);
console.log(`❌ Sowmith Reddy found: ${hasSowmithReddy}`);
console.log(`❌ Series AB found: ${hasSeriesAB}`);
console.log(`❌ Dummy PAN (ABCDE1234F) found: ${hasDummyPAN}`);

if (hasRajeshKumar || hasSowmithReddy || hasSeriesAB || hasDummyPAN) {
    console.log('\n🚨 DUMMY DATA DETECTED!');
    console.log('This explains why dummy data keeps appearing.');
    console.log('\n💡 SOLUTION: Run the clear script to remove all dummy data.');
} else {
    console.log('\n✅ NO DUMMY DATA DETECTED');
    console.log('Data appears to be clean or from MySQL API.');
}

console.log('\n🔧 TO CLEAR ALL DATA AND CONNECT TO API:');
console.log('Copy and paste the clear-dummy-data-and-connect.js script content');
console.log('into this console and press Enter.');