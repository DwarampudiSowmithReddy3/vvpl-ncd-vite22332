// Test Permissions in Browser Console
// Copy and paste this into the browser console on the React app

console.log('🧪 Testing Permissions in Browser Console...');

// Function to test permissions loading
async function testPermissionsLoading() {
    try {
        console.log('🔄 Testing permissions loading...');
        
        // Check if token exists
        const token = localStorage.getItem('authToken');
        console.log('🔑 Token exists:', token ? 'Yes' : 'No');
        
        if (!token) {
            console.log('❌ No token found. Please login first.');
            return;
        }
        
        // Test API call directly
        const response = await fetch('http://localhost:8000/permissions/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error('❌ API call failed:', response.status);
            return;
        }
        
        const permissions = await response.json();
        console.log('✅ Permissions loaded from API:', permissions);
        console.log('✅ Super Admin administrator:', permissions['Super Admin']['administrator']);
        
        // Check React context (if available)
        if (window.React && window.React.useContext) {
            console.log('🔍 React context available - check AuthContext state');
        }
        
        return permissions;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Function to test permission toggle
async function testPermissionToggle(role, module, action) {
    try {
        console.log(`🔄 Testing permission toggle: ${role}.${module}.${action}`);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('❌ No token found. Please login first.');
            return;
        }
        
        // Get current permissions
        const currentResponse = await fetch('http://localhost:8000/permissions/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const currentPermissions = await currentResponse.json();
        
        const currentValue = currentPermissions[role][module][action];
        const newValue = !currentValue;
        
        console.log(`🔄 Toggling ${role}.${module}.${action}: ${currentValue} → ${newValue}`);
        
        // Update permission
        const updateData = {
            [role]: {
                [module]: {
                    [action]: newValue
                }
            }
        };
        
        const updateResponse = await fetch('http://localhost:8000/permissions/', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
            console.error('❌ Update failed:', updateResponse.status);
            return;
        }
        
        console.log('✅ Permission updated successfully');
        
        // Verify the change
        const verifyResponse = await fetch('http://localhost:8000/permissions/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedPermissions = await verifyResponse.json();
        const finalValue = updatedPermissions[role][module][action];
        
        if (finalValue === newValue) {
            console.log(`✅ Change verified: ${finalValue}`);
        } else {
            console.error(`❌ Change not persisted: expected ${newValue}, got ${finalValue}`);
        }
        
        return updatedPermissions;
        
    } catch (error) {
        console.error('❌ Toggle test failed:', error);
    }
}

// Function to check React AuthContext state
function checkReactAuthContext() {
    try {
        console.log('🔍 Checking React AuthContext state...');
        
        // Try to access React DevTools
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            console.log('✅ React DevTools available');
        }
        
        // Check for common React context patterns
        const reactFiberNode = document.querySelector('#root')._reactInternalFiber || 
                              document.querySelector('#root')._reactInternalInstance;
        
        if (reactFiberNode) {
            console.log('✅ React fiber node found');
        }
        
        console.log('💡 To check AuthContext state:');
        console.log('1. Open React DevTools');
        console.log('2. Go to Components tab');
        console.log('3. Find AuthProvider component');
        console.log('4. Check the permissions state');
        
    } catch (error) {
        console.log('⚠️ Could not access React internals:', error.message);
    }
}

// Auto-run tests
console.log('🚀 Running automatic tests...');
testPermissionsLoading();

// Export functions for manual testing
window.testPermissionsLoading = testPermissionsLoading;
window.testPermissionToggle = testPermissionToggle;
window.checkReactAuthContext = checkReactAuthContext;

console.log('📋 Available functions:');
console.log('- testPermissionsLoading()');
console.log('- testPermissionToggle(role, module, action)');
console.log('- checkReactAuthContext()');
console.log('');
console.log('Example: testPermissionToggle("Finance Executive", "reports", "create")');