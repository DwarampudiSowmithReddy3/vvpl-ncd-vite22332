// Debug API Connection - Run this in browser console
console.log('🔍 DEBUGGING API CONNECTION...');

// Step 1: Check if backend is reachable
async function testBackendConnection() {
    try {
        console.log('Testing backend health...');
        const response = await fetch('http://localhost:8005/health');
        const data = await response.json();
        console.log('✅ Backend health:', data);
        return true;
    } catch (error) {
        console.error('❌ Backend not reachable:', error);
        return false;
    }
}

// Step 2: Test login
async function testLogin() {
    try {
        console.log('Testing login...');
        const response = await fetch('http://localhost:8005/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
                user_type: 'admin'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Login successful:', data);
            localStorage.setItem('api_token', data.access_token);
            return data.access_token;
        } else {
            console.error('❌ Login failed:', response.status);
            return null;
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        return null;
    }
}

// Step 3: Test data loading
async function testDataLoading(token) {
    try {
        console.log('Testing data loading...');
        
        // Test series
        const seriesResponse = await fetch('http://localhost:8005/api/v1/series/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (seriesResponse.ok) {
            const seriesData = await seriesResponse.json();
            console.log('✅ Series data loaded:', seriesData);
        } else {
            console.error('❌ Series loading failed:', seriesResponse.status);
        }
        
        // Test investors
        const investorsResponse = await fetch('http://localhost:8005/api/v1/investors/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (investorsResponse.ok) {
            const investorsData = await investorsResponse.json();
            console.log('✅ Investors data loaded:', investorsData);
        } else {
            console.error('❌ Investors loading failed:', investorsResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Data loading error:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting API connection tests...');
    
    const backendOk = await testBackendConnection();
    if (!backendOk) {
        console.error('❌ Backend is not running or not reachable');
        return;
    }
    
    const token = await testLogin();
    if (!token) {
        console.error('❌ Login failed');
        return;
    }
    
    await testDataLoading(token);
    
    console.log('🎉 All tests completed! Check results above.');
}

// Auto-run the tests
runAllTests();