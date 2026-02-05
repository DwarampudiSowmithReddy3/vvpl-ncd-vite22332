/**
 * Frontend Integration Test Script
 * Tests if backend APIs work with your React frontend
 * Run this in your browser console on each page
 */

class FrontendIntegrationTester {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/v1';
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
        this.results = { passed: 0, failed: 0, errors: [] };
    }

    log(message, success = true) {
        const emoji = success ? '✅' : '❌';
        console.log(`${emoji} ${message}`);
        if (success) {
            this.results.passed++;
        } else {
            this.results.failed++;
            this.results.errors.push(message);
        }
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token ? `Bearer ${this.token}` : ''
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            return {
                ok: response.ok,
                status: response.status,
                data: response.ok ? await response.json() : await response.text()
            };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }

    // Test Login Page APIs
    async testLoginPage() {
        console.log('\n🔐 Testing Login Page APIs...');
        
        // Test admin login
        const loginResult = await this.makeRequest('/auth/login', 'POST', {
            username: 'admin',
            password: 'admin123',
            user_type: 'admin'
        });

        if (loginResult.ok) {
            this.log('Admin login API works');
            this.token = loginResult.data.access_token;
            
            // Test token refresh
            const refreshResult = await this.makeRequest('/auth/refresh', 'POST', {
                refresh_token: loginResult.data.refresh_token
            });
            
            if (refreshResult.ok) {
                this.log('Token refresh API works');
            } else {
                this.log('Token refresh API failed', false);
            }
        } else {
            this.log('Admin login API failed', false);
        }
    }

    // Test Dashboard Page APIs
    async testDashboardPage() {
        console.log('\n📊 Testing Dashboard Page APIs...');
        
        // Test dashboard metrics
        const metricsResult = await this.makeRequest('/dashboard/metrics');
        if (metricsResult.ok) {
            this.log('Dashboard metrics API works');
            console.log('Sample metrics data:', metricsResult.data);
        } else {
            this.log('Dashboard metrics API failed', false);
        }

        // Test recent activities
        const activitiesResult = await this.makeRequest('/dashboard/recent-activities');
        if (activitiesResult.ok) {
            this.log('Recent activities API works');
        } else {
            this.log('Recent activities API failed', false);
        }
    }

    // Test Series Management APIs
    async testSeriesPage() {
        console.log('\n📈 Testing Series Management APIs...');
        
        // Test get series list
        const seriesResult = await this.makeRequest('/series/');
        if (seriesResult.ok) {
            this.log('Get series list API works');
            console.log('Sample series data:', seriesResult.data.slice(0, 2));
        } else {
            this.log('Get series list API failed', false);
        }

        // Test series filters
        const filteredResult = await this.makeRequest('/series/?status=active');
        if (filteredResult.ok) {
            this.log('Series filtering API works');
        } else {
            this.log('Series filtering API failed', false);
        }
    }

    // Test Investors Page APIs
    async testInvestorsPage() {
        console.log('\n👥 Testing Investors Page APIs...');
        
        // Test get investors
        const investorsResult = await this.makeRequest('/investors/');
        if (investorsResult.ok) {
            this.log('Get investors API works');
        } else {
            this.log('Get investors API failed', false);
        }

        // Test investor search
        const searchResult = await this.makeRequest('/investors/?search=test');
        if (searchResult.ok) {
            this.log('Investor search API works');
        } else {
            this.log('Investor search API failed', false);
        }
    }

    // Test Interest Payout APIs
    async testInterestPage() {
        console.log('\n💰 Testing Interest Payout APIs...');
        
        const payoutsResult = await this.makeRequest('/interest/payouts');
        if (payoutsResult.ok) {
            this.log('Interest payouts API works');
        } else {
            this.log('Interest payouts API failed', false);
        }
    }

    // Test Compliance APIs
    async testCompliancePage() {
        console.log('\n📋 Testing Compliance APIs...');
        
        const requirementsResult = await this.makeRequest('/compliance/requirements');
        if (requirementsResult.ok) {
            this.log('Compliance requirements API works');
        } else {
            this.log('Compliance requirements API failed', false);
        }
    }

    // Test Reports APIs
    async testReportsPage() {
        console.log('\n📄 Testing Reports APIs...');
        
        const reportsResult = await this.makeRequest('/reports/');
        if (reportsResult.ok) {
            this.log('Reports list API works');
        } else {
            this.log('Reports list API failed', false);
        }
    }

    // Test Communication APIs
    async testCommunicationPage() {
        console.log('\n📧 Testing Communication APIs...');
        
        const commResult = await this.makeRequest('/communication/');
        if (commResult.ok) {
            this.log('Communications API works');
        } else {
            this.log('Communications API failed', false);
        }
    }

    // Test Grievance APIs
    async testGrievancePage() {
        console.log('\n🎫 Testing Grievance APIs...');
        
        const investorGrievancesResult = await this.makeRequest('/grievance/investor');
        if (investorGrievancesResult.ok) {
            this.log('Investor grievances API works');
        } else {
            this.log('Investor grievances API failed', false);
        }

        const trusteeGrievancesResult = await this.makeRequest('/grievance/trustee');
        if (trusteeGrievancesResult.ok) {
            this.log('Trustee grievances API works');
        } else {
            this.log('Trustee grievances API failed', false);
        }
    }

    // Test Admin APIs
    async testAdminPage() {
        console.log('\n⚙️ Testing Admin APIs...');
        
        const usersResult = await this.makeRequest('/admin/users');
        if (usersResult.ok) {
            this.log('Admin users API works');
        } else {
            this.log('Admin users API failed', false);
        }

        const healthResult = await this.makeRequest('/admin/system-health');
        if (healthResult.ok) {
            this.log('System health API works');
        } else {
            this.log('System health API failed', false);
        }
    }

    // Test current page based on URL
    async testCurrentPage() {
        const path = window.location.pathname;
        console.log(`🧪 Testing APIs for current page: ${path}`);

        if (path.includes('login')) {
            await this.testLoginPage();
        } else if (path.includes('dashboard') || path === '/') {
            await this.testDashboardPage();
        } else if (path.includes('series')) {
            await this.testSeriesPage();
        } else if (path.includes('investors')) {
            await this.testInvestorsPage();
        } else if (path.includes('interest')) {
            await this.testInterestPage();
        } else if (path.includes('compliance')) {
            await this.testCompliancePage();
        } else if (path.includes('reports')) {
            await this.testReportsPage();
        } else if (path.includes('communication')) {
            await this.testCommunicationPage();
        } else if (path.includes('grievance')) {
            await this.testGrievancePage();
        } else if (path.includes('admin')) {
            await this.testAdminPage();
        } else {
            console.log('⚠️ Unknown page - testing basic APIs');
            await this.testDashboardPage();
        }
    }

    // Run all tests
    async testAllPages() {
        console.log('🚀 Starting Frontend Integration Tests...');
        console.log('=' * 50);

        await this.testLoginPage();
        await this.testDashboardPage();
        await this.testSeriesPage();
        await this.testInvestorsPage();
        await this.testInterestPage();
        await this.testCompliancePage();
        await this.testReportsPage();
        await this.testCommunicationPage();
        await this.testGrievancePage();
        await this.testAdminPage();

        this.showSummary();
    }

    showSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 FRONTEND INTEGRATION TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);

        if (this.results.errors.length > 0) {
            console.log('\n🔍 FAILED TESTS:');
            this.results.errors.forEach(error => console.log(`   • ${error}`));
        }

        const successRate = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
        console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);

        if (successRate >= 90) {
            console.log('🎉 Excellent! Backend integration is working perfectly!');
        } else if (successRate >= 70) {
            console.log('⚠️ Good, but some APIs need attention');
        } else {
            console.log('❌ Multiple integration issues found');
        }
    }
}

// Usage instructions
console.log(`
🧪 FRONTEND INTEGRATION TESTER LOADED!

Usage:
1. Make sure backend is running on http://localhost:8000
2. Run one of these commands:

// Test current page only:
const tester = new FrontendIntegrationTester();
await tester.testCurrentPage();

// Test all pages:
const tester = new FrontendIntegrationTester();
await tester.testAllPages();

// Test specific page:
await tester.testDashboardPage();
await tester.testSeriesPage();
// ... etc
`);

// Auto-export for easy access
window.FrontendIntegrationTester = FrontendIntegrationTester;