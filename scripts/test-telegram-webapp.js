#!/usr/bin/env node

/**
 * Test script for Telegram WebApp functionality
 * This script simulates Telegram WebApp requests to test authentication
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://mnemine-backend-7b4y.onrender.com';

console.log(`🧪 Testing Telegram WebApp functionality on: ${BACKEND_URL}`);

// Simulate Telegram WebApp initData
function createTelegramInitData(userId, username, firstName, lastName) {
  const user = {
    id: userId,
    first_name: firstName,
    last_name: lastName,
    username: username,
    language_code: 'en'
  };
  
  const authDate = Math.floor(Date.now() / 1000);
  const queryId = 'test_query_id_' + Date.now();
  
  // Create initData string (URL encoded)
  const initData = new URLSearchParams({
    user: JSON.stringify(user),
    auth_date: authDate.toString(),
    query_id: queryId
  }).toString();
  
  return initData;
}

async function testTelegramWebApp() {
  console.log('\n=== Testing Telegram WebApp Authentication ===\n');
  
  // Test with a real Telegram user
  const testUser = {
    id: 987654321,
    username: 'realuser',
    first_name: 'Real',
    last_name: 'User'
  };
  
  console.log(`[TEST] Testing with user:`, testUser);
  
  // Create initData
  const initData = createTelegramInitData(
    testUser.id,
    testUser.username,
    testUser.first_name,
    testUser.last_name
  );
  
  console.log(`[TEST] Generated initData:`, initData);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/validate`, {
      initData: initData,
      startParam: null
    });
    
    console.log(`[TEST] Response:`, response);
    
    if (response.statusCode === 200) {
      console.log('✅ SUCCESS: Telegram WebApp authentication works!');
      console.log('   This means the ENCRYPTION_KEY is working correctly');
    } else if (response.statusCode === 403) {
      console.log('❌ AUTHENTICATION FAILED: Hash validation failed');
      console.log('   This means the ENCRYPTION_KEY is still incorrect');
    } else {
      console.log('⚠️  UNEXPECTED: Unexpected response');
    }
    
  } catch (error) {
    console.error('[TEST] Error:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\n💡 To test in real Telegram:');
  console.log('   1. Open Telegram');
  console.log('   2. Find your bot');
  console.log('   3. Send /start');
  console.log('   4. Click "🚀 Launch App" button');
  console.log('   5. App should open as Telegram WebApp');
}

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

// Run the test
testTelegramWebApp().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
