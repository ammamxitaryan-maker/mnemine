#!/usr/bin/env node

/**
 * Simple NOWPayments Test
 */

const fetch = require('node-fetch');

async function testNOWPayments() {
  console.log('🧪 Testing NOWPayments Integration...\n');

  try {
    // Test 1: Check server health
    console.log('1️⃣ Checking server health...');
    const healthResponse = await fetch('http://localhost:10112/api/health');

    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Server is running:', health.status);
    } else {
      console.log('❌ Server health check failed:', healthResponse.status);
      return;
    }

    // Test 2: Check NOWPayments config
    console.log('\n2️⃣ Checking NOWPayments config...');
    const configResponse = await fetch('http://localhost:10112/api/payments/usdt/config');

    if (configResponse.ok) {
      const config = await configResponse.json();
      console.log('✅ Configuration loaded:');
      console.log(`   API Key: ${config.apiKey}`);
      console.log(`   IPN Secret: ${config.ipnSecret}`);
      console.log(`   Sandbox Mode: ${config.sandboxMode}`);
      console.log(`   Base URL: ${config.baseUrl}`);
    } else {
      console.log('❌ Config check failed:', configResponse.status);
    }

    // Test 3: Create test payment
    console.log('\n3️⃣ Creating test payment...');
    const paymentResponse = await fetch('http://localhost:10112/api/payments/usdt/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegramId: '6760298907',
        mneAmount: 10.0,
        description: 'Test NOWPayments Integration'
      })
    });

    if (paymentResponse.ok) {
      const payment = await paymentResponse.json();
      console.log('✅ Payment created successfully:');
      console.log(`   Payment ID: ${payment.paymentId}`);
      console.log(`   Order ID: ${payment.orderId}`);
      console.log(`   USDT Address: ${payment.usdtAddress}`);
      console.log(`   USDT Amount: ${payment.usdtAmount}`);
      console.log(`   Payment URL: ${payment.paymentUrl}`);
    } else {
      const error = await paymentResponse.text();
      console.log('❌ Payment creation failed:', paymentResponse.status);
      console.log('   Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNOWPayments();
