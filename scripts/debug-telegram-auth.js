#!/usr/bin/env node

/**
 * Debug script for Telegram WebApp authentication
 * This script provides detailed debugging information about the authentication flow
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://mnemine-backend-7b4y.onrender.com';

console.log(`[DEBUG] Testing Telegram authentication on: ${BACKEND_URL}`);

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
    
    console.log(`[DEBUG] Making request to: ${url}`);
    console.log(`[DEBUG] Request data:`, data);
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      console.log(`[DEBUG] Response status: ${res.statusCode}`);
      console.log(`[DEBUG] Response headers:`, res.headers);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`[DEBUG] Response body:`, responseData);
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
      console.error(`[DEBUG] Request error:`, error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function debugTelegramAuth() {
  console.log('\n=== Debugging Telegram WebApp Authentication ===\n');
  
  // Test with testuser
  console.log('[DEBUG] Testing with testuser (should be rejected in production)...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/login`, {
      id: 123456789,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User'
    });
    
    console.log(`[DEBUG] Test user response:`, response);
    
    if (response.statusCode === 403) {
      console.log('✅ SUCCESS: Test user correctly rejected in production');
    } else if (response.statusCode === 200 && response.data.success) {
      console.log('❌ ISSUE: Test user still accepted in production');
      console.log('   This means the deployment has not updated yet or the fix is not working');
    } else {
      console.log('⚠️  UNEXPECTED: Unexpected response for test user');
    }
    
  } catch (error) {
    console.error('[DEBUG] Error testing test user:', error);
  }
  
  console.log('\n=== Debug Complete ===');
}

// Run the debug
debugTelegramAuth().catch((error) => {
  console.error('Debug failed:', error);
  process.exit(1);
});
