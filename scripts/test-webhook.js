#!/usr/bin/env node

const https = require('https');

const WEBHOOK_URL = 'https://mnemine-backend-7b4y.onrender.com/api/webhook/8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE';

async function testWebhookEndpoint() {
  try {
    console.log('🔍 Testing webhook endpoint...');
    console.log(`URL: ${WEBHOOK_URL}\n`);
    
    // Test with a simple GET request first
    console.log('1. Testing GET request...');
    const getResponse = await fetch(WEBHOOK_URL, { method: 'GET' });
    console.log(`   Status: ${getResponse.status} ${getResponse.statusText}`);
    
    if (getResponse.status === 405) {
      console.log('   ✅ GET method not allowed (expected for webhook)');
    } else if (getResponse.status === 404) {
      console.log('   ❌ Endpoint not found');
    } else {
      console.log('   ⚠️  Unexpected response');
    }
    
    // Test with POST request
    console.log('\n2. Testing POST request...');
    const testPayload = {
      update_id: 1,
      message: {
        message_id: 1,
        from: {
          id: 6760298907,
          is_bot: false,
          first_name: "Test",
          username: "test"
        },
        chat: {
          id: 6760298907,
          first_name: "Test",
          username: "test",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/start"
      }
    };
    
    const postResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`   Status: ${postResponse.status} ${postResponse.statusText}`);
    
    if (postResponse.status === 200) {
      console.log('   ✅ Webhook endpoint is working!');
    } else if (postResponse.status === 404) {
      console.log('   ❌ Webhook endpoint not found');
    } else {
      console.log('   ⚠️  Unexpected response');
      const responseText = await postResponse.text();
      console.log(`   Response: ${responseText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

async function testServerHealth() {
  try {
    console.log('🏥 Testing server health...');
    const response = await fetch('https://mnemine-backend-7b4y.onrender.com/health');
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Health: ${data.status}`);
    console.log(`   Database: ${data.database}`);
    console.log(`   Uptime: ${Math.round(data.uptime)}s`);
    
  } catch (error) {
    console.error('❌ Error testing server health:', error.message);
  }
}

async function main() {
  console.log('🚀 Webhook Endpoint Tester\n');
  
  await testServerHealth();
  console.log('');
  await testWebhookEndpoint();
  
  console.log('\n💡 If webhook returns 404, the server may need to be redeployed or restarted.');
}

main().catch(console.error);
