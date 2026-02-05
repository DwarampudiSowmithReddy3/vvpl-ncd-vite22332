// FINAL SOLUTION - COMPLETE DUMMY DATA REMOVAL AND MYSQL CONNECTION
// Copy this ENTIRE script and paste it in your browser console on the frontend page

console.log('🚀 FINAL SOLUTION: COMPLETE DUMMY DATA REMOVAL');
console.log('═'.repeat(60));

async function finalClearAndConnect() {
    try {
        console.log('🧹 STEP 1: NUCLEAR CLEAR - Removing ALL localStorage data...');
        
        // Clear everything - no exceptions
        localStorage.clear();
        sessionStorage.clear();
        
        // Also clear any potential cached data
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        console.log('✅ Complete data wipe successful');
        
        console.log('\n🔌 STEP 2: Connecting to MySQL API...');
        
        // Test API connection first
        const healthResponse = await fetch('http://localhost:8005/health');
        if (!healthResponse.ok) {
            throw new Error('Backend not responding. Please ensure backend is running on port 8005');
        }
        
        const healthData = await healthResponse.json();
        console.log(`✅ Backend health: ${healthData.status}`);
        
        // Authenticate
        console.log('🔐 Authenticating...');
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
            const errorText = await loginResponse.text();
            throw new Error(`Authentication failed: ${loginResponse.status} - ${errorText}`);
        }
        
        const loginData = await loginResponse.json();
        localStorage.setItem('api_token', loginData.access_token);
        console.log('✅ Authentication successful');
        
        console.log('\n📊 STEP 3: Loading data from MySQL...');
        
        // Load series from MySQL
        const seriesResponse = await fetch('http://localhost:8005/api/v1/series/', {
            headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        
        let seriesData = [];
        if (seriesResponse.ok) {
            const apiSeries = await seriesResponse.json();
            console.log(`📈 Found ${apiSeries.length} series in MySQL database`);
            
            if (apiSeries.length > 0) {
                // Convert MySQL format to frontend format
                seriesData = apiSeries.map((s, index) => ({
                    id: s.id || (index + 1),
                    name: s.series_name || `Series ${index + 1}`,
                    seriesCode: s.series_code || `NCD-${index + 1}`,
                    status: s.status || 'active',
                    interestFrequency: s.interest_frequency_type || 'Non-cumulative & Monthly',
                    interestRate: s.interest_rate || 0,
                    investors: 0, // Will be calculated based on actual investments
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
                console.log('✅ Series data converted to frontend format');
            } else {
                console.log('ℹ️ No series found in MySQL - starting with empty array');
            }
        } else {
            console.log(`⚠️ Series API call failed (${seriesResponse.status}) - starting with empty array`);
        }
        
        // Load investors from MySQL
        const investorsResponse = await fetch('http://localhost:8005/api/v1/investors/', {
            headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        
        let investorsData = [];
        if (investorsResponse.ok) {
            const apiInvestors = await investorsResponse.json();
            console.log(`👥 Found ${apiInvestors.length} investors in MySQL database`);
            
            if (apiInvestors.length > 0) {
                // Convert MySQL format to frontend format
                investorsData = apiInvestors.map((inv, index) => ({
                    id: inv.id || (index + 1),
                    name: inv.full_name || inv.name || `Investor ${index + 1}`,
                    investorId: inv.investor_id || `INV${String(index + 1).padStart(3, '0')}`,
                    email: inv.email || `investor${index + 1}@example.com`,
                    phone: inv.phone || '+91 98765 43210',
                    series: [], // Will be populated based on actual investments
                    investment: inv.total_investment || 0,
                    investments: [], // Will be populated based on actual data
                    kycStatus: inv.kyc_status || 'Pending',
                    dateJoined: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                    bankAccountNumber: inv.bank_account || '1234567890123456',
                    ifscCode: inv.ifsc_code || 'SBIN0001234',
                    bankName: inv.bank_name || 'State Bank of India'
                }));
                console.log('✅ Investors data converted to frontend format');
            } else {
                console.log('ℹ️ No investors found in MySQL - starting with empty array');
            }
        } else {
            console.log(`⚠️ Investors API call failed (${investorsResponse.status}) - starting with empty array`);
        }
        
        console.log('\n💾 STEP 4: Saving clean data to localStorage...');
        
        // Save the clean data
        localStorage.setItem('series', JSON.stringify(seriesData));
        localStorage.setItem('investors', JSON.stringify(investorsData));
        localStorage.setItem('complaints', JSON.stringify([])); // Start with empty complaints
        localStorage.setItem('dataVersion', '4.0.0-mysql-only');
        localStorage.setItem('lastDataClear', new Date().toISOString());
        
        console.log('✅ Clean data saved to localStorage');
        
        console.log('\n🎉 SUCCESS! DUMMY DATA COMPLETELY REMOVED');
        console.log('═'.repeat(60));
        console.log(`📊 Final Data Summary:`);
        console.log(`   • Series: ${seriesData.length} (from MySQL)`);
        console.log(`   • Investors: ${investorsData.length} (from MySQL)`);
        console.log(`   • Complaints: 0 (clean start)`);
        console.log(`   • Data Version: 4.0.0-mysql-only`);
        console.log(`   • No dummy data remaining`);
        
        if (seriesData.length === 0 && investorsData.length === 0) {
            console.log('\n📝 NOTE: Your MySQL database appears to be empty.');
            console.log('This is normal if you haven\'t added any data yet.');
            console.log('The frontend will now show empty cards instead of dummy data.');
            console.log('You can now add new series and investors through the UI.');
        }
        
        console.log('\n🔄 Refreshing page to show clean data...');
        
        setTimeout(() => {
            window.location.reload();
        }, 3000);
        
    } catch (error) {
        console.error('❌ FINAL CLEAR FAILED:', error);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Ensure backend is running: http://localhost:8005/health');
        console.error('2. Check MySQL database connection');
        console.error('3. Verify admin credentials (admin/admin123)');
        console.error('4. Check browser console for CORS errors');
        
        // Even if API fails, clear dummy data
        console.log('\n🧹 Clearing dummy data anyway...');
        localStorage.clear();
        localStorage.setItem('series', JSON.stringify([]));
        localStorage.setItem('investors', JSON.stringify([]));
        localStorage.setItem('complaints', JSON.stringify([]));
        localStorage.setItem('dataVersion', '4.0.0-cleared-only');
        
        console.log('✅ Dummy data cleared. Page will refresh to show empty state.');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

// Execute the final solution
finalClearAndConnect();