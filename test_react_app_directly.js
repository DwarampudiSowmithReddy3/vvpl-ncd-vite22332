// Test script to run in browser console on http://localhost:5178
// This will help debug what's actually happening in the React app

console.log('🔍 DEBUGGING REACT APP PERMISSIONS');
console.log('=====================================');

// Check if we're on the right page
if (window.location.hostname !== 'localhost' || !window.location.port.includes('517')) {
    console.error('❌ Please run this on http://localhost:5178');
} else {
    console.log('✅ Running on correct frontend URL');
}

// Check localStorage for auth token
const token = localStorage.getItem('authToken');
console.log('🔑 Auth Token:', token ? 'Present' : 'Missing');

// Check if user is logged in
const user = localStorage.getItem('user');
console.log('👤 User Data:', user ? JSON.parse(user) : 'Not logged in');

// Test API connection
async function testAPIConnection() {
    try {
        console.log('🔄 Testing API connection...');
        
        if (!token) {
            console.log('⚠️ No token found, attempting login...');
            
            const loginResponse = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password: 'admin123' })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                localStorage.setItem('authToken', loginData.access_token);
                console.log('✅ Login successful, token stored');
            } else {
                console.error('❌ Login failed');
                return;
            }
        }
        
        // Test permissions API
        const currentToken = localStorage.getItem('authToken');
        const permResponse = await fetch('http://localhost:8000/permissions/', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (permResponse.ok) {
            const permissions = await permResponse.json();
            console.log('✅ Permissions API working');
            console.log('📊 Permissions loaded:', Object.keys(permissions).length, 'roles');
            console.log('🎯 Finance Executive dashboard create:', permissions['Finance Executive']?.dashboard?.create);
            
            // Test permission update
            const oldValue = permissions['Finance Executive'].dashboard.create;
            const newValue = !oldValue;
            permissions['Finance Executive'].dashboard.create = newValue;
            
            const updateResponse = await fetch('http://localhost:8000/permissions/', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(permissions)
            });
            
            if (updateResponse.ok) {
                console.log(`✅ Permission update successful: ${oldValue} → ${newValue}`);
                
                // Verify persistence
                const verifyResponse = await fetch('http://localhost:8000/permissions/', {
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                });
                
                if (verifyResponse.ok) {
                    const verifyPermissions = await verifyResponse.json();
                    const verifyValue = verifyPermissions['Finance Executive'].dashboard.create;
                    
                    if (verifyValue === newValue) {
                        console.log('✅ PERSISTENCE VERIFIED - Backend is working correctly!');
                        console.log('🎯 The issue must be in the React app state management');
                    } else {
                        console.error('❌ Persistence failed in backend');
                    }
                } else {
                    console.error('❌ Failed to verify permissions');
                }
            } else {
                console.error('❌ Permission update failed');
            }
        } else {
            console.error('❌ Permissions API failed');
        }
        
    } catch (error) {
        console.error('❌ API Test Error:', error);
    }
}

// Check React app state (if available)
function checkReactState() {
    console.log('🔍 Checking React app state...');
    
    // Try to access React DevTools or global state
    if (window.React) {
        console.log('✅ React is loaded');
    } else {
        console.log('⚠️ React not found in global scope');
    }
    
    // Check for common React app indicators
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot.innerHTML.includes('Administrator')) {
        console.log('✅ React app appears to be loaded');
    } else {
        console.log('⚠️ React app may not be fully loaded');
    }
}

// Run tests
console.log('\n1️⃣ Checking React State...');
checkReactState();

console.log('\n2️⃣ Testing API Connection...');
testAPIConnection();

console.log('\n3️⃣ Instructions:');
console.log('- If you see "PERSISTENCE VERIFIED", the backend is working');
console.log('- The issue is in React app state management');
console.log('- Check for console errors starting with "❌ AuthContext:" or "❌ Administrator:"');
console.log('- Try logging in and going to Administrator → Permissions tab');
console.log('- Toggle a permission and watch the console logs');

console.log('\n🔍 DEBUGGING COMPLETE - Check results above');