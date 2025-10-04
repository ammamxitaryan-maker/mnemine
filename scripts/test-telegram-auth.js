#!/usr/bin/env node

/**
 * Test script for Telegram WebApp authentication
 * This script tests the authentication flow to ensure real Telegram users
 * are properly authenticated and test users are rejected in production
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://mnemine-backend-7b4y.onrender.com';
const isProduction = BACKEND_URL.includes('render.com') || BACKEND_URL.includes('https://');

console.log(`[TEST] Testing Telegram authentication on: ${BACKEND_URL}`);
console.log(`[TEST] Production mode: ${isProduction}`);

// Test data for different scenarios
const testCases = [
  {
    name: 'Real Telegram User (Valid)',
    data: {
      id: 987654321,
      username: 'realuser',
      first_name: 'Real',
      last_name: 'User'
    },
    shouldSucceed: true
  },
  {
    name: 'Test User (Should be rejected in production)',
    data: {
      id: 123456789,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User'
    },
    shouldSucceed: !isProduction // Should fail in production, succeed in development
  },
  {
    name: 'Another Real User',
    data: {
      id: 555666777,
      username: 'anotheruser',
      first_name: 'Another',
      last_name: 'User'
    },
    shouldSucceed: true
  }
];

async function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testTelegramAuth() {
  console.log('\n=== Testing Telegram WebApp Authentication ===\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`[TEST] ${testCase.name}`);
    console.log(`[TEST] Data:`, testCase.data);
    
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/login`, testCase.data);
      
      const success = response.statusCode === 200 && response.data.success;
      const expectedSuccess = testCase.shouldSucceed;
      
      if (success === expectedSuccess) {
        console.log(`✅ PASS - ${testCase.name}`);
        console.log(`   Status: ${response.statusCode}, Success: ${response.data.success}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL - ${testCase.name}`);
        console.log(`   Expected success: ${expectedSuccess}, Got: ${success}`);
        console.log(`   Response:`, response.data);
      }
      
    } catch (error) {
      console.log(`❌ ERROR - ${testCase.name}`);
      console.log(`   Error:`, error.message);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('=== Test Results ===');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed!');
    process.exit(1);
  }
}

// Run the tests
testTelegramAuth().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
