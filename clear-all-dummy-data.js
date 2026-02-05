// Clear All Dummy Data from localStorage
console.log('🧹 Clearing all dummy data from localStorage...');

// List all localStorage keys before clearing
console.log('📋 Current localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`   - ${key}`);
}

// Clear all dummy data keys
const keysToRemove = [
    'investors',
    'series', 
    'complaints',
    'auditLogs',
    'satisfactionEvents',
    'payoutStatusUpdates',
    'payoutMetadata',
    'complianceStatus',
    'dataVersion'
];

keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Removed: ${key}`);
    }
});

console.log('🎉 All dummy data cleared! Frontend will now use ONLY MySQL API data.');
console.log('🔄 Please refresh the page to load fresh data from API.');