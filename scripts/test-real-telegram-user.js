#!/usr/bin/env node

/**
 * Test script for real Telegram user authentication
 * This script tests with a realistic Telegram user to ensure authentication works
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://mnemine-backend-7b4y.onrender.com';

console.log(`[TEST] Testing real Telegram user authentication on: ${BACKEND_URL}`);

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
    
    console.log(`[TEST] Making request to: ${url}`);
    console.log(`[TEST] Request data:`, data);
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      console.log(`[TEST] Response status: ${res.statusCode}`);
      
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

async function testRealTelegramUser() {
  console.log('\n=== Testing Real Telegram User Authentication ===\n');
  
  // Test with a realistic Telegram user
  const realUser = {
    id: 987654321,
    username: 'realuser',
    first_name: 'Real',
    last_name: 'User'
  };
  
  console.log(`[TEST] Testing with real user:`, realUser);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/login`, realUser);
    
    console.log(`[TEST] Real user response:`, response);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ SUCCESS: Real user authentication works!');
      console.log('   User ID:', response.data.user?.id);
      console.log('   Telegram ID:', response.data.telegramId);
      console.log('   Username:', response.data.username);
    } else {
      console.log('❌ ISSUE: Real user authentication failed');
      console.log('   Status:', response.statusCode);
      console.log('   Response:', response.data);
    }
    
  } catch (error) {
    console.error('[TEST] Error testing real user:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testRealTelegramUser().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
