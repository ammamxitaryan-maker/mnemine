#!/usr/bin/env node

/**
 * Admin Panel API Test Suite
 * Tests all admin endpoints and functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:10112/api';
const ADMIN_PASSWORD = 'admin123';

let adminToken = null;

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function logTest(testName, status, message = '') {
    testResults.total++;
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${testName}: PASS ${message}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: FAIL ${message}`);
    }
    testResults.details.push({ testName, status, message });
}

async function testAdminLogin() {
    console.log('\n🔐 Testing Admin Authentication...');
    
    try {
        const response = await axios.post(`${BASE_URL}/admin/login`, {
            password: ADMIN_PASSWORD
        });
        
        if (response.data.success && response.data.token) {
            adminToken = response.data.token;
            logTest('Admin Login', 'PASS', `Token received: ${adminToken.substring(0, 20)}...`);
            return true;
        } else {
            logTest('Admin Login', 'FAIL', 'No token in response');
            return false;
        }
    } catch (error) {
        logTest('Admin Login', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testTokenVerification() {
    console.log('\n🔍 Testing Token Verification...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/verify-token`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
            logTest('Token Verification', 'PASS', 'Token is valid');
            return true;
        } else {
            logTest('Token Verification', 'FAIL', 'Token verification failed');
            return false;
        }
    } catch (error) {
        logTest('Token Verification', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testDashboardStats() {
    console.log('\n📊 Testing Dashboard Statistics...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/dashboard-stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success && response.data.data) {
            const stats = response.data.data;
            logTest('Dashboard Stats', 'PASS', `Users: ${stats.users?.total || 0}, Active: ${stats.users?.active || 0}`);
            return true;
        } else {
            logTest('Dashboard Stats', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('Dashboard Stats', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testAnalytics() {
    console.log('\n📈 Testing Analytics API...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/analytics`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success && response.data.data) {
            const analytics = response.data.data;
            logTest('Analytics API', 'PASS', `Total users: ${analytics.users?.total || 0}`);
            return true;
        } else {
            logTest('Analytics API', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('Analytics API', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testUserManagement() {
    console.log('\n👥 Testing User Management...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success && response.data.data) {
            const users = response.data.data;
            logTest('User Management', 'PASS', `Found ${users.users?.length || 0} users`);
            return true;
        } else {
            logTest('User Management', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('User Management', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testTransactions() {
    console.log('\n💰 Testing Transaction Management...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/transactions`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success && response.data.data) {
            const transactions = response.data.data;
            logTest('Transaction Management', 'PASS', `Found ${transactions.transactions?.length || 0} transactions`);
            return true;
        } else {
            logTest('Transaction Management', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('Transaction Management', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testSystemLogs() {
    console.log('\n📋 Testing System Logs...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/logs`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success && response.data.data) {
            const logs = response.data.data;
            logTest('System Logs', 'PASS', `Found ${logs.logs?.length || 0} log entries`);
            return true;
        } else {
            logTest('System Logs', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('System Logs', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testSystemSettings() {
    console.log('\n⚙️ Testing System Settings...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/settings`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success && response.data.data) {
            const settings = response.data.data;
            logTest('System Settings', 'PASS', `Exchange rate: ${settings.exchangeRate?.current || 'N/A'}`);
            return true;
        } else {
            logTest('System Settings', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('System Settings', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testLotteryManagement() {
    console.log('\n🎲 Testing Lottery Management...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/lottery/participants`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
            const lottery = response.data.data;
            logTest('Lottery Management', 'PASS', `Participants: ${lottery.participants?.length || 0}`);
            return true;
        } else {
            logTest('Lottery Management', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('Lottery Management', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testNotifications() {
    console.log('\n🔔 Testing Notification System...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/notifications/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
            const stats = response.data.data;
            logTest('Notification System', 'PASS', 'Notification stats retrieved');
            return true;
        } else {
            logTest('Notification System', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('Notification System', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testProcessingManagement() {
    console.log('\n⚙️ Testing Processing Management...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/processing/metrics`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
            const metrics = response.data.data;
            logTest('Processing Management', 'PASS', 'Processing metrics retrieved');
            return true;
        } else {
            logTest('Processing Management', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('Processing Management', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testExchangeManagement() {
    console.log('\n💱 Testing Exchange Management...');
    
    try {
        const response = await axios.get(`${BASE_URL}/admin/rate`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
            const rate = response.data.data;
            logTest('Exchange Management', 'PASS', `Current rate: ${rate.rate || 'N/A'}`);
            return true;
        } else {
            logTest('Exchange Management', 'FAIL', 'Invalid response format');
            return false;
        }
    } catch (error) {
        logTest('Exchange Management', 'FAIL', error.response?.data?.error || error.message);
        return false;
    }
}

async function testSecurity() {
    console.log('\n🔒 Testing Security Features...');
    
    // Test without token
    try {
        await axios.get(`${BASE_URL}/admin/dashboard-stats`);
        logTest('Security - No Token', 'FAIL', 'Should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Security - No Token', 'PASS', 'Correctly requires authentication');
        } else {
            logTest('Security - No Token', 'FAIL', `Unexpected error: ${error.response?.status}`);
        }
    }
    
    // Test with invalid token
    try {
        await axios.get(`${BASE_URL}/admin/dashboard-stats`, {
            headers: { Authorization: 'Bearer invalid-token' }
        });
        logTest('Security - Invalid Token', 'FAIL', 'Should reject invalid token');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Security - Invalid Token', 'PASS', 'Correctly rejects invalid token');
        } else {
            logTest('Security - Invalid Token', 'FAIL', `Unexpected error: ${error.response?.status}`);
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Admin Panel API Test Suite...\n');
    console.log(`📡 Testing against: ${BASE_URL}`);
    console.log(`🔐 Using password: ${ADMIN_PASSWORD}\n`);
    
    // Test authentication first
    const loginSuccess = await testAdminLogin();
    if (!loginSuccess) {
        console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
        return;
    }
    
    // Run all other tests
    await testTokenVerification();
    await testDashboardStats();
    await testAnalytics();
    await testUserManagement();
    await testTransactions();
    await testSystemLogs();
    await testSystemSettings();
    await testLotteryManagement();
    await testNotifications();
    await testProcessingManagement();
    await testExchangeManagement();
    await testSecurity();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.details
            .filter(test => test.status === 'FAIL')
            .forEach(test => {
                console.log(`   - ${test.testName}: ${test.message}`);
            });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (testResults.failed === 0) {
        console.log('🎉 All tests passed! Admin Panel is fully functional.');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
        process.exit(1);
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error.message);
    process.exit(1);
});

// Run tests
runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});
