// Force API Data - Run this in browser console after the debug test
console.log('🔄 FORCING API DATA LOAD...');

async function forceLoadAPIData() {
    try {
        // Clear all localStorage first
        localStorage.clear();
        console.log('✅ Cleared all localStorage');
        
        // Login to get token
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
            throw new Error('Login failed');
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.access_token;
        localStorage.setItem('api_token', token);
        console.log('✅ Login successful, token saved');
        
        // Load series from API
        const seriesResponse = await fetch('http://localhost:8005/api/v1/series/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (seriesResponse.ok) {
            const seriesData = await seriesResponse.json();
            console.log('✅ Series loaded from API:', seriesData);
            
            // Force update the React state (if possible)
            if (window.React && window.ReactDOM) {
                console.log('🔄 Attempting to trigger React re-render...');
                // This is a hack to force re-render
                window.dispatchEvent(new CustomEvent('forceAPIData', { 
                    detail: { series: seriesData } 
                }));
            }
        }
        
        // Load investors from API
        const investorsResponse = await fetch('http://localhost:8005/api/v1/investors/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (investorsResponse.ok) {
            const investorsData = await investorsResponse.json();
            console.log('✅ Investors loaded from API:', investorsData);
        }
        
        console.log('🎉 API data loaded! Try refreshing the page now.');
        
    } catch (error) {
        console.error('❌ Force API load failed:', error);
    }
}

forceLoadAPIData();