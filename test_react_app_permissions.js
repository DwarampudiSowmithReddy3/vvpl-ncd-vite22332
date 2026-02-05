// Test script to run in React app console (http://localhost:5178)
// Open browser console on the React app and paste this script

console.log('🔍 TESTING REACT APP PERMISSIONS');
console.log('=====================================');

async function testReactAppPermissions() {
    try {
        console.log('🔄 Step 1: Testing API connection from React app...');
        
        // Test if we can reach the backend from the React app
        const healthResponse = await fetch('http://localhost:8000/health');
        if (healthResponse.ok) {
            console.log('✅ Backend connection: SUCCESS');
        } else {
            console.log('❌ Backend connection: FAILED');
            return;
        }
        
        console.log('🔄 Step 2: Testing login...');
        const loginResponse = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed:', loginResponse.status);
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.access_token;
        console.log('✅ Login: SUCCESS');
        
        console.log('🔄 Step 3: Testing permissions API...');
        const permResponse = await fetch('http://localhost:8000/permissions/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!permResponse.ok) {
            console.log('❌ Permissions API failed:', permResponse.status);
            return;
        }
        
        const permissions = await permResponse.json();
        console.log('✅ Permissions API: SUCCESS');
        console.log('📊 Loaded roles:', Object.keys(permissions).length);
        
        const financeExec = permissions['Finance Executive'];
        const currentValue = financeExec.dashboard.create;
        console.log('🎯 Finance Executive dashboard create:', currentValue);
        
        console.log('🔄 Step 4: Testing permission update...');
        const newValue = !currentValue;
        const updatedPermissions = {
            ...permissions,
            'Finance Executive': {
                ...permissions['Finance Executive'],
                dashboard: {
                    ...permissions['Finance Executive'].dashboard,
                    create: newValue
                }
            }
        };
        
        const updateResponse = await fetch('http://localhost:8000/permissions/', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedPermissions)
        });
        
        if (!updateResponse.ok) {
            console.log('❌ Permission update failed:', updateResponse.status);
            return;
        }
        
        console.log('✅ Permission update: SUCCESS');
        console.log('🔄 Changed:', currentValue, '→', newValue);
        
        console.log('🔄 Step 5: Testing persistence...');
        const verifyResponse = await fetch('http://localhost:8000/permissions/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!verifyResponse.ok) {
            console.log('❌ Verify failed:', verifyResponse.status);
            return;
        }
        
        const verifyPermissions = await verifyResponse.json();
        const verifyValue = verifyPermissions['Finance Executive'].dashboard.create;
        
        if (verifyValue === newValue) {
            console.log('✅ PERSISTENCE TEST: SUCCESS');
            console.log('🎉 ALL TESTS PASSED - API is working from React app!');
            console.log('');
            console.log('📋 NEXT STEPS:');
            console.log('1. Login to the React app with admin/admin123');
            console.log('2. Go to Administrator → Permissions tab');
            console.log('3. Toggle Finance Executive → Dashboard → Create');
            console.log('4. Refresh the page');
            console.log('5. Check if the permission stayed toggled');
        } else {
            console.log('❌ PERSISTENCE TEST: FAILED');
            console.log('Expected:', newValue, 'Got:', verifyValue);
        }
        
    } catch (error) {
        console.error('❌ TEST ERROR:', error.message);
        console.log('');
        console.log('🔍 TROUBLESHOOTING:');
        console.log('- Make sure you are running this on http://localhost:5178');
        console.log('- Make sure backend is running on http://localhost:8000');
        console.log('- Check browser console for CORS errors');
    }
}

// Run the test
testReactAppPermissions();