// CLEAR DUMMY DATA AND CONNECT TO MYSQL API
// Run this in the browser console on your frontend page

console.log('🚀 CLEARING DUMMY DATA AND CONNECTING TO MYSQL API...');

async function clearDummyDataAndConnect() {
    try {
        console.log('📋 Step 1: Clearing all localStorage data...');
        localStorage.clear();
        console.log('✅ localStorage cleared completely');
        
        console.log('📋 Step 2: Authenticating with MySQL API...');
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
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        localStorage.setItem('api_token', loginData.access_token);
        console.log('✅ Authentication successful');
        
        console.log('📋 Step 3: Loading data from MySQL API...');
        
        // Load series
        const seriesResponse = await fetch('http://localhost:8005/api/v1/series/', {
            headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        
        let seriesData = [];
        if (seriesResponse.ok) {
            const apiSeries = await seriesResponse.json();
            console.log(`✅ Loaded ${apiSeries.length} series from MySQL`);
            
            // Convert to frontend format
            seriesData = apiSeries.map((s, index) => ({
                id: s.id || (index + 1),
                name: s.series_name || `Series ${index + 1}`,
                seriesCode: s.series_code || `NCD-${index + 1}`,
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
        } else {
            console.log('⚠️ No series data from API, using empty array');
        }
        
        // Load investors
        const investorsResponse = await fetch('http://localhost:8005/api/v1/investors/', {
            headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        
        let investorsData = [];
        if (investorsResponse.ok) {
            const apiInvestors = await investorsResponse.json();
            console.log(`✅ Loaded ${apiInvestors.length} investors from MySQL`);
            
            // Convert to frontend format
            investorsData = apiInvestors.map((inv, index) => ({
                id: inv.id || (index + 1),
                name: inv.full_name || inv.name || `Investor ${index + 1}`,
                investorId: inv.investor_id || `INV${String(index + 1).padStart(3, '0')}`,
                email: inv.email || `investor${index + 1}@example.com`,
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
        } else {
            console.log('⚠️ No investors data from API, using empty array');
        }
        
        console.log('📋 Step 4: Saving MySQL data to localStorage...');
        localStorage.setItem('series', JSON.stringify(seriesData));
        localStorage.setItem('investors', JSON.stringify(investorsData));
        localStorage.setItem('complaints', JSON.stringify([]));
        localStorage.setItem('dataVersion', '3.0.0-mysql-connected');
        
        console.log('🎉 SUCCESS! MySQL API connected and dummy data cleared');
        console.log(`📊 Data loaded: ${seriesData.length} series, ${investorsData.length} investors`);
        console.log('🔄 Refreshing page to show MySQL data...');
        
        // Refresh the page to show new data
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Connection failed:', error);
        console.error('Please ensure:');
        console.error('1. Backend is running on http://localhost:8005');
        console.error('2. Database is connected');
        console.error('3. No CORS issues');
    }
}

// Execute the function
clearDummyDataAndConnect();