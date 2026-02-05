/**
 * SEAMLESS FRONTEND INTEGRATION TESTER
 * Ultimate testing suite for React frontend + FastAPI backend integration
 * Tests real user workflows and edge cases
 */

class SeamlessFrontendTester {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/v1';
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
        this.results = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            performance: {},
            workflows: {}
        };
        this.testData = {};
        
        // Performance thresholds (milliseconds)
        this.performanceThresholds = {
            fast: 500,
            acceptable: 2000,
            slow: 5000
        };
        
        console.log('🚀 Seamless Frontend Tester Initialized');
        console.log('📊 Ready to test complete user workflows');
    }

    // ==================== UTILITY METHODS ====================

    log(testName, success, message = '', duration = 0, warning = false) {
        this.results.totalTests++;
        
        let emoji, status;
        if (warning) {
            emoji = '⚠️';
            status = 'WARNING';
            this.results.warnings++;
        } else if (success) {
            emoji = '✅';
            status = 'PASS';
            this.results.passed++;
        } else {
            emoji = '❌';
            status = 'FAIL';
            this.results.failed++;
            this.results.errors.push(`${testName}: ${message}`);
        }

        // Performance indicator
        let perfEmoji = '';
        if (duration > 0) {
            if (duration <= this.performanceThresholds.fast) perfEmoji = '🚀';
            else if (duration <= this.performanceThresholds.acceptable) perfEmoji = '⚡';
            else if (duration <= this.performanceThresholds.slow) perfEmoji = '🐌';
            else perfEmoji = '🐢';
            
            this.results.performance[testName] = duration;
        }

        const durationStr = duration > 0 ? ` (${duration}ms)` : '';
        console.log(`${emoji} ${perfEmoji} ${testName}${durationStr} - ${status} ${message}`);
    }

    async makeRequest(endpoint, method = 'GET', data = null, expectedStatus = 200) {
        const startTime = performance.now();
        
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
            const duration = Math.round(performance.now() - startTime);
            
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const responseData = isJson ? await response.json() : await response.text();

            return {
                success: response.status === expectedStatus,
                status: response.status,
                data: responseData,
                duration,
                response
            };
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            return {
                success: false,
                error: error.message,
                duration
            };
        }
    }

    generateTestData() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        return {
            series: {
                series_name: `Test NCD Series ${timestamp}`,
                series_code: `TEST${randomId}`,
                issue_size: 100000000.00,
                face_value: 1000.00,
                minimum_investment: 10000.00,
                maximum_investment: 1000000.00,
                interest_rate: 8.5,
                interest_frequency: "monthly",
                tenure_years: 3,
                tenure_months: 0,
                issue_open_date: new Date(Date.now() + 86400000).toISOString(),
                issue_close_date: new Date(Date.now() + 86400000 * 15).toISOString(),
                maturity_date: new Date(Date.now() + 86400000 * 1095).toISOString(),
                description: `Test series created at ${new Date().toISOString()}`,
                is_secured: true,
                credit_rating: "AAA"
            },
            investor: {
                investor_type: "individual",
                first_name: "Test",
                last_name: `User${randomId}`,
                full_name: `Test User${randomId}`,
                email: `test.user${randomId.toLowerCase()}@example.com`,
                phone: `9876${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
                date_of_birth: "1990-01-01",
                gender: "male",
                pan_number: `ABCDE${Math.floor(Math.random() * 10000)}F`,
                address_line1: "123 Test Street",
                city: "Mumbai",
                state: "Maharashtra",
                pincode: "400001"
            },
            communication: {
                type: "email",
                subject: `Test Communication ${timestamp}`,
                content: "This is a test communication message",
                recipient_type: "all_investors",
                priority: "normal"
            }
        };
    }

    // ==================== WORKFLOW TESTS ====================

    async testCompleteUserWorkflow() {
        console.log('\n🔄 TESTING COMPLETE USER WORKFLOW');
        console.log('=' * 60);
        
        const workflowStart = performance.now();
        let workflowSuccess = true;

        // Step 1: Login
        const loginResult = await this.testLoginWorkflow();
        if (!loginResult) {
            workflowSuccess = false;
            this.log('Complete User Workflow', false, 'Login failed');
            return false;
        }

        // Step 2: Dashboard Access
        const dashboardResult = await this.testDashboardWorkflow();
        if (!dashboardResult) workflowSuccess = false;

        // Step 3: Series Management
        const seriesResult = await this.testSeriesWorkflow();
        if (!seriesResult) workflowSuccess = false;

        // Step 4: Investor Management
        const investorResult = await this.testInvestorWorkflow();
        if (!investorResult) workflowSuccess = false;

        // Step 5: Reports and Communication
        const reportsResult = await this.testReportsWorkflow();
        if (!reportsResult) workflowSuccess = false;

        const workflowDuration = Math.round(performance.now() - workflowStart);
        this.results.workflows['Complete User Workflow'] = {
            success: workflowSuccess,
            duration: workflowDuration
        };

        this.log(
            'Complete User Workflow', 
            workflowSuccess, 
            workflowSuccess ? 'All steps completed' : 'Some steps failed',
            workflowDuration
        );

        return workflowSuccess;
    }

    async testLoginWorkflow() {
        console.log('\n🔐 Testing Login Workflow...');
        
        // Test admin login
        const loginData = {
            username: 'admin',
            password: 'admin123',
            user_type: 'admin'
        };

        const result = await this.makeRequest('/auth/login', 'POST', loginData);
        
        if (result.success) {
            this.token = result.data.access_token;
            this.log('Admin Login', true, 'Token received', result.duration);
            
            // Test getting user info
            const userResult = await this.makeRequest('/auth/me');
            this.log('Get User Info', userResult.success, '', userResult.duration);
            
            // Store user info for later tests
            if (userResult.success) {
                this.testData.currentUser = userResult.data;
            }
            
            return true;
        } else {
            this.log('Admin Login', false, result.error || 'Login failed', result.duration);
            return false;
        }
    }

    async testDashboardWorkflow() {
        console.log('\n📊 Testing Dashboard Workflow...');
        
        let allSuccess = true;

        // Test dashboard metrics
        const metricsResult = await this.makeRequest('/dashboard/metrics');
        this.log('Dashboard Metrics', metricsResult.success, '', metricsResult.duration);
        if (!metricsResult.success) allSuccess = false;

        // Validate metrics structure
        if (metricsResult.success) {
            const data = metricsResult.data;
            const requiredKeys = ['series', 'investors', 'investments', 'payouts', 'grievances', 'compliance'];
            const hasAllKeys = requiredKeys.every(key => key in data);
            
            this.log('Dashboard Data Structure', hasAllKeys, hasAllKeys ? 'All keys present' : 'Missing keys');
            if (!hasAllKeys) allSuccess = false;
        }

        // Test recent activities
        const activitiesResult = await this.makeRequest('/dashboard/recent-activities');
        this.log('Recent Activities', activitiesResult.success, '', activitiesResult.duration);
        if (!activitiesResult.success) allSuccess = false;

        return allSuccess;
    }

    async testSeriesWorkflow() {
        console.log('\n📈 Testing Series Management Workflow...');
        
        let allSuccess = true;
        const testData = this.generateTestData();

        // Test getting series list
        const listResult = await this.makeRequest('/series/');
        this.log('Get Series List', listResult.success, '', listResult.duration);
        if (!listResult.success) allSuccess = false;

        // Test creating new series
        const createResult = await this.makeRequest('/series/', 'POST', testData.series);
        if (createResult.success) {
            this.testData.seriesId = createResult.data.id;
            this.log('Create Series', true, `ID: ${this.testData.seriesId}`, createResult.duration);
            
            // Test getting series details
            const detailsResult = await this.makeRequest(`/series/${this.testData.seriesId}`);
            this.log('Get Series Details', detailsResult.success, '', detailsResult.duration);
            if (!detailsResult.success) allSuccess = false;

            // Test updating series
            const updateData = { description: 'Updated by seamless test' };
            const updateResult = await this.makeRequest(`/series/${this.testData.seriesId}`, 'PUT', updateData);
            this.log('Update Series', updateResult.success, '', updateResult.duration);
            if (!updateResult.success) allSuccess = false;

        } else {
            this.log('Create Series', false, createResult.error || 'Creation failed', createResult.duration);
            allSuccess = false;
        }

        return allSuccess;
    }

    async testInvestorWorkflow() {
        console.log('\n👥 Testing Investor Management Workflow...');
        
        let allSuccess = true;

        // Test getting investors list
        const listResult = await this.makeRequest('/investors/');
        this.log('Get Investors List', listResult.success, '', listResult.duration);
        if (!listResult.success) allSuccess = false;

        // Test search functionality
        const searchResult = await this.makeRequest('/investors/?search=test');
        this.log('Search Investors', searchResult.success, '', searchResult.duration);
        if (!searchResult.success) allSuccess = false;

        // Test pagination
        const paginationResult = await this.makeRequest('/investors/?skip=0&limit=5');
        this.log('Investor Pagination', paginationResult.success, '', paginationResult.duration);
        if (!paginationResult.success) allSuccess = false;

        return allSuccess;
    }

    async testReportsWorkflow() {
        console.log('\n📄 Testing Reports Workflow...');
        
        let allSuccess = true;

        // Test getting reports list
        const listResult = await this.makeRequest('/reports/');
        this.log('Get Reports List', listResult.success, '', listResult.duration);
        if (!listResult.success) allSuccess = false;

        // Test report generation
        const generateResult = await this.makeRequest('/reports/generate?report_type=investor_summary&format=pdf', 'POST');
        this.log('Generate Report', generateResult.success, '', generateResult.duration);
        if (!generateResult.success) allSuccess = false;

        return allSuccess;
    }

    // ==================== PERFORMANCE TESTS ====================

    async testPerformanceUnderLoad() {
        console.log('\n⚡ Testing Performance Under Load...');
        
        const endpoints = [
            '/dashboard/metrics',
            '/series/',
            '/investors/',
            '/interest/payouts',
            '/compliance/requirements'
        ];

        const concurrentRequests = 10;
        const results = [];

        for (const endpoint of endpoints) {
            const promises = Array(concurrentRequests).fill().map(() => 
                this.makeRequest(endpoint)
            );

            const startTime = performance.now();
            const responses = await Promise.all(promises);
            const totalTime = Math.round(performance.now() - startTime);

            const successCount = responses.filter(r => r.success).length;
            const avgResponseTime = Math.round(
                responses.reduce((sum, r) => sum + r.duration, 0) / responses.length
            );

            results.push({
                endpoint,
                successCount,
                totalRequests: concurrentRequests,
                avgResponseTime,
                totalTime
            });

            this.log(
                `Load Test ${endpoint}`,
                successCount >= concurrentRequests * 0.8,
                `${successCount}/${concurrentRequests} successful, avg: ${avgResponseTime}ms`,
                totalTime
            );
        }

        return results;
    }

    // ==================== ERROR HANDLING TESTS ====================

    async testErrorHandling() {
        console.log('\n🛡️ Testing Error Handling...');
        
        // Test unauthorized access
        const oldToken = this.token;
        this.token = 'invalid_token';
        
        const unauthorizedResult = await this.makeRequest('/admin/users', 'GET', null, 401);
        this.log('Unauthorized Access Handling', unauthorizedResult.success, '', unauthorizedResult.duration);
        
        this.token = oldToken;

        // Test invalid data
        const invalidData = { series_name: '' }; // Invalid empty name
        const invalidResult = await this.makeRequest('/series/', 'POST', invalidData, 422);
        this.log('Invalid Data Handling', invalidResult.success, '', invalidResult.duration);

        // Test non-existent resource
        const notFoundResult = await this.makeRequest('/series/99999', 'GET', null, 404);
        this.log('Not Found Handling', notFoundResult.success, '', notFoundResult.duration);
    }

    // ==================== REAL-TIME FEATURES TESTS ====================

    async testRealTimeFeatures() {
        console.log('\n🔄 Testing Real-time Features...');
        
        // Test data consistency across multiple requests
        const firstMetrics = await this.makeRequest('/dashboard/metrics');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        const secondMetrics = await this.makeRequest('/dashboard/metrics');

        if (firstMetrics.success && secondMetrics.success) {
            // Data should be consistent for dashboard metrics
            const consistent = JSON.stringify(firstMetrics.data) === JSON.stringify(secondMetrics.data);
            this.log('Data Consistency', consistent, consistent ? 'Metrics consistent' : 'Metrics changed unexpectedly');
        }

        // Test rapid successive requests
        const rapidRequests = Array(5).fill().map(() => this.makeRequest('/dashboard/metrics'));
        const rapidResults = await Promise.all(rapidRequests);
        const allSuccessful = rapidResults.every(r => r.success);
        
        this.log('Rapid Successive Requests', allSuccessful, `${rapidResults.filter(r => r.success).length}/5 successful`);
    }

    // ==================== INTEGRATION TESTS ====================

    async testFrontendBackendIntegration() {
        console.log('\n🔗 Testing Frontend-Backend Integration...');
        
        // Test if localStorage/sessionStorage integration works
        const tokenExists = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
        this.log('Token Storage Integration', tokenExists, tokenExists ? 'Token found in storage' : 'No token in storage', 0, !tokenExists);

        // Test CORS headers
        const corsResult = await this.makeRequest('/dashboard/metrics');
        if (corsResult.response) {
            const corsHeaders = corsResult.response.headers.get('Access-Control-Allow-Origin');
            this.log('CORS Configuration', !!corsHeaders, corsHeaders ? 'CORS headers present' : 'CORS headers missing');
        }

        // Test response format consistency
        const endpoints = ['/dashboard/metrics', '/series/', '/investors/'];
        for (const endpoint of endpoints) {
            const result = await this.makeRequest(endpoint);
            if (result.success) {
                const isValidJson = typeof result.data === 'object';
                this.log(`JSON Response ${endpoint}`, isValidJson, isValidJson ? 'Valid JSON' : 'Invalid JSON format');
            }
        }
    }

    // ==================== MAIN TEST RUNNER ====================

    async runSeamlessTests() {
        console.log('🚀 SEAMLESS FRONTEND INTEGRATION TESTING');
        console.log('=' * 80);
        console.log(`🕐 Started at: ${new Date().toLocaleString()}`);
        console.log('=' * 80);

        const overallStart = performance.now();

        // Run all test suites
        const testSuites = [
            { name: 'Complete User Workflow', test: () => this.testCompleteUserWorkflow() },
            { name: 'Performance Under Load', test: () => this.testPerformanceUnderLoad() },
            { name: 'Error Handling', test: () => this.testErrorHandling() },
            { name: 'Real-time Features', test: () => this.testRealTimeFeatures() },
            { name: 'Frontend-Backend Integration', test: () => this.testFrontendBackendIntegration() }
        ];

        for (const suite of testSuites) {
            try {
                console.log(`\n🧪 Running ${suite.name}...`);
                await suite.test();
            } catch (error) {
                this.log(`${suite.name} Suite`, false, `Exception: ${error.message}`);
            }
        }

        const overallDuration = Math.round(performance.now() - overallStart);
        this.generateSeamlessReport(overallDuration);
    }

    generateSeamlessReport(totalDuration) {
        console.log('\n' + '=' * 80);
        console.log('📊 SEAMLESS INTEGRATION TEST REPORT');
        console.log('=' * 80);

        const { totalTests, passed, failed, warnings } = this.results;
        const successRate = totalTests > 0 ? (passed / totalTests * 100) : 0;

        console.log(`📈 OVERALL STATISTICS:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   ⚠️ Warnings: ${warnings}`);
        console.log(`   📊 Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`   ⏱️ Total Duration: ${totalDuration}ms`);

        // Performance analysis
        const performanceEntries = Object.entries(this.results.performance);
        if (performanceEntries.length > 0) {
            console.log(`\n⚡ PERFORMANCE ANALYSIS:`);
            const fastTests = performanceEntries.filter(([, time]) => time <= this.performanceThresholds.fast).length;
            const acceptableTests = performanceEntries.filter(([, time]) => 
                time > this.performanceThresholds.fast && time <= this.performanceThresholds.acceptable).length;
            const slowTests = performanceEntries.filter(([, time]) => time > this.performanceThresholds.acceptable).length;

            console.log(`   🚀 Fast (≤500ms): ${fastTests}`);
            console.log(`   ⚡ Acceptable (500ms-2s): ${acceptableTests}`);
            console.log(`   🐌 Slow (>2s): ${slowTests}`);

            // Show slowest tests
            const slowest = performanceEntries.sort((a, b) => b[1] - a[1]).slice(0, 3);
            console.log(`\n   🐢 Slowest Tests:`);
            slowest.forEach(([name, time]) => {
                console.log(`      ${name}: ${time}ms`);
            });
        }

        // Workflow analysis
        if (Object.keys(this.results.workflows).length > 0) {
            console.log(`\n🔄 WORKFLOW ANALYSIS:`);
            Object.entries(this.results.workflows).forEach(([name, data]) => {
                const status = data.success ? '✅' : '❌';
                console.log(`   ${status} ${name}: ${data.duration}ms`);
            });
        }

        // Error summary
        if (this.results.errors.length > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            this.results.errors.forEach(error => {
                console.log(`   • ${error}`);
            });
        }

        // Final assessment
        console.log(`\n🎯 INTEGRATION ASSESSMENT:`);
        if (successRate >= 95) {
            console.log('   🎉 EXCELLENT! Frontend-Backend integration is perfect!');
            console.log('   ✅ All workflows functioning seamlessly');
            console.log('   ✅ Performance is optimal');
            console.log('   ✅ Ready for production deployment');
        } else if (successRate >= 85) {
            console.log('   👍 GOOD! Integration is working well');
            console.log('   ⚠️ Minor issues detected - review warnings');
            console.log('   ✅ Core functionality is solid');
        } else if (successRate >= 70) {
            console.log('   ⚠️ ACCEPTABLE but needs attention');
            console.log('   🔧 Several integration issues found');
            console.log('   ⚠️ Review failed tests before production');
        } else {
            console.log('   ❌ INTEGRATION ISSUES DETECTED');
            console.log('   🚨 Multiple critical problems found');
            console.log('   🔧 Significant debugging required');
        }

        console.log(`\n💡 NEXT STEPS:`);
        if (failed > 0) {
            console.log('   🔧 Fix failed tests and re-run');
        }
        if (warnings > 0) {
            console.log('   ⚠️ Address warning conditions');
        }
        console.log('   📖 Check API docs: http://localhost:8000/docs');
        console.log('   🔍 Review browser network tab for details');

        console.log('=' * 80);
    }

    // ==================== QUICK TEST METHODS ====================

    async testCurrentPage() {
        const path = window.location.pathname;
        console.log(`🧪 Testing current page: ${path}`);

        if (path.includes('login')) {
            await this.testLoginWorkflow();
        } else if (path.includes('dashboard') || path === '/') {
            await this.testDashboardWorkflow();
        } else if (path.includes('series')) {
            await this.testSeriesWorkflow();
        } else if (path.includes('investors')) {
            await this.testInvestorWorkflow();
        } else if (path.includes('reports')) {
            await this.testReportsWorkflow();
        } else {
            console.log('⚠️ Unknown page - running basic tests');
            await this.testDashboardWorkflow();
        }

        this.generateSeamlessReport(0);
    }
}

// ==================== USAGE INSTRUCTIONS ====================

console.log(`
🚀 SEAMLESS FRONTEND TESTER LOADED!

USAGE COMMANDS:
===============

// Run complete seamless test suite:
const tester = new SeamlessFrontendTester();
await tester.runSeamlessTests();

// Test current page only:
await tester.testCurrentPage();

// Test specific workflows:
await tester.testCompleteUserWorkflow();
await tester.testPerformanceUnderLoad();
await tester.testErrorHandling();

// Quick individual tests:
await tester.testLoginWorkflow();
await tester.testDashboardWorkflow();
await tester.testSeriesWorkflow();

REQUIREMENTS:
=============
1. Backend server running on http://localhost:8000
2. React frontend running on current domain
3. Browser console access (F12)

FEATURES:
=========
✅ Complete user workflow simulation
✅ Performance testing under load
✅ Error handling validation
✅ Real-time feature testing
✅ Frontend-backend integration validation
✅ Detailed performance metrics
✅ Comprehensive reporting

Ready to test! 🎯
`);

// Export for global access
window.SeamlessFrontendTester = SeamlessFrontendTester;