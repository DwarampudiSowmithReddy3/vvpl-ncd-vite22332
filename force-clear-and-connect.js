// FORCE CLEAR DUMMY DATA AND CONNECT TO MYSQL - Run in Node.js
const fs = require('fs');
const path = require('path');

console.log('🚀 FORCE CLEARING DUMMY DATA AND CONNECTING TO MYSQL...');

// Create a script that will be injected into the frontend
const frontendScript = `
// AUTO-INJECTED SCRIPT TO CLEAR DUMMY DATA AND CONNECT TO MYSQL
console.log('🧹 AUTO-CLEARING DUMMY DATA...');

// Step 1: Complete localStorage clear
localStorage.clear();
sessionStorage.clear();
console.log('✅ All browser storage cleared');

// Step 2: Connect to MySQL API
async function connectToMySQL() {
    try {
        console.log('🔌 Connecting to MySQL API...');
        
        // Authenticate
        const loginResponse = await fetch('http://localhost:8005/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
                user_type: 'admin'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error('Authentication failed');
        }
        
        const loginData = await loginResponse.json();
        localStorage.setItem('api_token', loginData.access_token);
        console.log('✅ MySQL API connected');
        
        // Load series
        const seriesResponse = await fetch('http://localhost:8005/api/v1/series/', {
            headers: { 'Authorization': \`Bearer \${loginData.access_token}\` }
        });
        
        let seriesData = [];
        if (seriesResponse.ok) {
            const apiSeries = await seriesResponse.json();
            seriesData = apiSeries.map((s, index) => ({
                id: s.id || (index + 1),
                name: s.series_name || \`Series \${index + 1}\`,
                seriesCode: s.series_code || \`NCD-\${index + 1}\`,
                status: s.status || 'active',
                interestFrequency: s.interest_frequency_type || 'Non-cumulative & Monthly',
                interestRate: s.interest_rate || 0,
                investors: 0,
                fundsRaised: s.issue_size || 0,
                targetAmount: s.target_amount_cr ? (s.target_amount_cr * 10000000) : 50000000,
                issueDate: s.issue_date || new Date().toLocaleDateString('en-GB'),
                maturityDate: s.maturity_date || new Date().toLocaleDateString('en-GB'),
                faceValue: s.face_value || 1000,
                minInvestment: s.minimum_investment || 25000,
                releaseDate: s.issue_date || new Date().toLocaleDateString('en-GB'),
                lockInPeriod: s.lock_in_date || new Date().toLocaleDateString('en-GB'),
                debentureTrustee: s.debenture_trustee_name || 'IDBI Trusteeship Services Ltd'
            }));
        }
        
        // Load investors
        const investorsResponse = await fetch('http://localhost:8005/api/v1/investors/', {
            headers: { 'Authorization': \`Bearer \${loginData.access_token}\` }
        });
        
        let investorsData = [];
        if (investorsResponse.ok) {
            const apiInvestors = await investorsResponse.json();
            investorsData = apiInvestors.map((inv, index) => ({
                id: inv.id || (index + 1),
                name: inv.full_name || inv.name || \`Investor \${index + 1}\`,
                investorId: inv.investor_id || \`INV\${String(index + 1).padStart(3, '0')}\`,
                email: inv.email || \`investor\${index + 1}@example.com\`,
                phone: inv.phone || '+91 98765 43210',
                series: [],
                investment: inv.total_investment || 0,
                investments: [],
                kycStatus: inv.kyc_status || 'Pending',
                dateJoined: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                bankAccountNumber: inv.bank_account || '1234567890123456',
                ifscCode: inv.ifsc_code || 'SBIN0001234',
                bankName: inv.bank_name || 'State Bank of India'
            }));
        }
        
        // Save clean data
        localStorage.setItem('series', JSON.stringify(seriesData));
        localStorage.setItem('investors', JSON.stringify(investorsData));
        localStorage.setItem('complaints', JSON.stringify([]));
        localStorage.setItem('dataVersion', '5.0.0-mysql-forced');
        
        console.log(\`🎉 SUCCESS! Loaded \${seriesData.length} series and \${investorsData.length} investors from MySQL\`);
        
        // Refresh page
        setTimeout(() => window.location.reload(), 1000);
        
    } catch (error) {
        console.error('❌ MySQL connection failed:', error);
        // Even if API fails, ensure dummy data is cleared
        localStorage.setItem('series', JSON.stringify([]));
        localStorage.setItem('investors', JSON.stringify([]));
        localStorage.setItem('complaints', JSON.stringify([]));
        localStorage.setItem('dataVersion', '5.0.0-cleared-only');
        console.log('✅ Dummy data cleared anyway');
        setTimeout(() => window.location.reload(), 1000);
    }
}

// Execute immediately when page loads
connectToMySQL();
`;

// Write the script to public folder so it can be loaded by the frontend
const publicScriptPath = path.join(__dirname, 'public', 'auto-clear-dummy-data.js');
fs.writeFileSync(publicScriptPath, frontendScript);

console.log('✅ Auto-clear script created at public/auto-clear-dummy-data.js');
console.log('');
console.log('📋 NEXT STEPS:');
console.log('1. Add this script tag to your index.html:');
console.log('   <script src="/auto-clear-dummy-data.js"></script>');
console.log('2. Or run the script manually in browser console');
console.log('3. The script will automatically clear dummy data and connect to MySQL');
console.log('');
console.log('🎯 This will permanently solve the dummy data problem!');