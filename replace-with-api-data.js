// Manual API Data Replacement - Run this in browser console
console.log('🔄 MANUALLY REPLACING DUMMY DATA WITH API DATA...');

async function replaceWithAPIData() {
    try {
        // Step 1: Clear all localStorage
        console.log('🧹 Clearing all localStorage...');
        localStorage.clear();
        
        // Step 2: Login to API
        console.log('🔐 Logging into MySQL API...');
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
        const token = loginData.access_token;
        localStorage.setItem('api_token', token);
        console.log('✅ Login successful, token saved');
        
        // Step 3: Load series from API
        console.log('📊 Loading series from MySQL API...');
        const seriesResponse = await fetch('http://localhost:8005/api/v1/series/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (seriesResponse.ok) {
            const apiSeries = await seriesResponse.json();
            console.log(`✅ Loaded ${apiSeries.length} series from API:`, apiSeries);
            
            // Convert API format to frontend format
            const frontendSeries = apiSeries.map(s => ({
                id: s.id,
                name: s.series_name,
                seriesCode: s.series_code,
                status: s.status || 'active',
                interestFrequency: s.interest_frequency_type || 'Non-cumulative & Monthly',
                interestRate: s.interest_rate || 0,
                investors: 0,
                fundsRaised: s.issue_size || 0,
                targetAmount: s.target_amount_cr ? s.target_amount_cr * 10000000 : 0,
                issueDate: s.issue_date,
                maturityDate: s.maturity_date,
                faceValue: s.face_value || 1000,
                minInvestment: s.minimum_investment || 25000,
                releaseDate: s.issue_date,
                lockInPeriod: s.lock_in_date,
                debentureTrustee: s.debenture_trustee_name,
                investorsSize: s.investors_size || 0
            }));
            
            localStorage.setItem('series', JSON.stringify(frontendSeries));
            console.log('✅ Series data saved to localStorage in frontend format');
        }
        
        // Step 4: Load investors from API
        console.log('👥 Loading investors from MySQL API...');
        const investorsResponse = await fetch('http://localhost:8005/api/v1/investors/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (investorsResponse.ok) {
            const apiInvestors = await investorsResponse.json();
            console.log(`✅ Loaded ${apiInvestors.length} investors from API:`, apiInvestors);
            
            // Convert API format to frontend format
            const frontendInvestors = apiInvestors.map(inv => ({
                id: inv.id,
                name: inv.full_name || inv.name,
                investorId: inv.investor_id || `INV${inv.id}`,
                email: inv.email,
                phone: inv.phone,
                series: [], // Will be populated based on investments
                investment: inv.total_investment || 0,
                investments: [],
                kycStatus: inv.kyc_status || 'Pending',
                dateJoined: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                bankAccountNumber: inv.bank_account || 'N/A',
                ifscCode: inv.ifsc_code || 'N/A',
                bankName: inv.bank_name || 'N/A'
            }));
            
            localStorage.setItem('investors', JSON.stringify(frontendInvestors));
            console.log('✅ Investors data saved to localStorage in frontend format');
        }
        
        // Step 5: Set data version
        localStorage.setItem('dataVersion', '3.0.0-api');
        
        console.log('🎉 SUCCESS! API data has been loaded into localStorage');
        console.log('🔄 Refreshing page to show API data...');
        
        // Refresh the page to show new data
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Failed to replace with API data:', error);
        console.error('Make sure backend is running on http://localhost:8005');
    }
}

// Run the replacement
replaceWithAPIData();