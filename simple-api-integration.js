// SIMPLE API INTEGRATION - Verified Step by Step
console.log('🚀 SIMPLE API INTEGRATION STARTING...');

async function integrateAPIData() {
    console.log('📋 Step 1: Clearing localStorage...');
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    console.log('📋 Step 2: Authenticating with API...');
    try {
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
        console.log('✅ Authentication successful, token saved');
        
        console.log('📋 Step 3: Loading series from MySQL...');
        const seriesResponse = await fetch('http://localhost:8005/api/v1/series/', {
            headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        
        if (seriesResponse.ok) {
            const apiSeries = await seriesResponse.json();
            console.log(`✅ Loaded ${apiSeries.length} series from MySQL API`);
            
            // Convert API format to frontend format
            const frontendSeries = apiSeries.map((s, index) => ({
                id: s.id || (index + 1),
                name: s.series_name || `Series ${index + 1}`,
                seriesCode: s.series_code || `NCD-${index + 1}`,
                status: s.status || 'active',
                interestFrequency: s.interest_frequency_type || 'Non-cumulative & Monthly',
                interestRate: s.interest_rate || 0,
                investors: 0, // Will be calculated
                fundsRaised: s.issue_size || 0,
                targetAmount: s.target_amount_cr ? (s.target_amount_cr * 10000000) : 50000000,
                issueDate: s.issue_date || new Date().toLocaleDateString('en-GB'),
                maturityDate: s.maturity_date || new Date().toLocaleDateString('en-GB'),
                faceValue: s.face_value || 1000,
                minInvestment: s.minimum_investment || 25000,
                releaseDate: s.issue_date || new Date().toLocaleDateString('en-GB'),
                lockInPeriod: s.lock_in_date || new Date().toLocaleDateString('en-GB'),
                debentureTrustee: s.debenture_trustee_name || 'IDBI Trusteeship Services Ltd',
                investorsSize: s.investors_size || 0
            }));
            
            localStorage.setItem('series', JSON.stringify(frontendSeries));
            console.log('✅ Series data converted and saved to localStorage');
        } else {
            console.warn('⚠️ Series API call failed, status:', seriesResponse.status);
        }
        
        console.log('📋 Step 4: Loading investors from MySQL...');
        const investorsResponse = await fetch('http://localhost:8005/api/v1/investors/', {
            headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        
        if (investorsResponse.ok) {
            const apiInvestors = await investorsResponse.json();
            console.log(`✅ Loaded ${apiInvestors.length} investors from MySQL API`);
            
            // Convert API format to frontend format
            const frontendInvestors = apiInvestors.map((inv, index) => ({
                id: inv.id || (index + 1),
                name: inv.full_name || inv.name || `Investor ${index + 1}`,
                investorId: inv.investor_id || `INV${String(index + 1).padStart(3, '0')}`,
                email: inv.email || `investor${index + 1}@example.com`,
                phone: inv.phone || '+91 98765 43210',
                series: [], // Will be populated based on investments
                investment: inv.total_investment || 0,
                investments: [],
                kycStatus: inv.kyc_status || 'Pending',
                dateJoined: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                bankAccountNumber: inv.bank_account || '1234567890123456',
                ifscCode: inv.ifsc_code || 'SBIN0001234',
                bankName: inv.bank_name || 'State Bank of India'
            }));
            
            localStorage.setItem('investors', JSON.stringify(frontendInvestors));
            console.log('✅ Investors data converted and saved to localStorage');
        } else {
            console.warn('⚠️ Investors API call failed, status:', investorsResponse.status);
        }
        
        // Set data version to indicate API data
        localStorage.setItem('dataVersion', '3.0.0-mysql-api');
        
        console.log('🎉 SUCCESS! MySQL API data has been integrated');
        console.log('📊 Summary:');
        console.log(`   - Series: ${JSON.parse(localStorage.getItem('series') || '[]').length}`);
        console.log(`   - Investors: ${JSON.parse(localStorage.getItem('investors') || '[]').length}`);
        console.log('🔄 Refreshing page to show MySQL data...');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Integration failed:', error);
        console.error('Please check:');
        console.error('1. Backend is running on http://localhost:8005');
        console.error('2. Database is connected');
        console.error('3. No CORS issues');
    }
}

// Start integration
integrateAPIData();