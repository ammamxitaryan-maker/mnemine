#!/usr/bin/env node

/**
 * Comprehensive NOWPayments Deposit Function Test
 * Tests the complete USDT payment flow through NOWPayments
 */

const crypto = require('crypto');

// Configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:10112',
  telegramId: '6760298907', // Admin test user
  testAmount: 10, // $10 USD test
  mneAmount: 100, // 100 MNE test
  nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY,
  nowpaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
  sandboxMode: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true'
};

console.log('🚀 NOWPayments Deposit Function Test');
console.log('=====================================');
console.log(`Backend URL: ${config.backendUrl}`);
console.log(`Telegram ID: ${config.telegramId}`);
console.log(`Sandbox Mode: ${config.sandboxMode}`);
console.log(`API Key: ${config.nowpaymentsApiKey ? 'Set' : 'Not Set'}`);
console.log('');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${details}`);
  }
}

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = { raw: data };
    }

    return {
      ok: response.ok,
      status: response.status,
      data: jsonData,
      headers: response.headers
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { error: error.message },
      headers: {}
    };
  }
}

// Test 1: Check server health
async function testServerHealth() {
  console.log('\n📡 Testing Server Health...');

  const response = await makeRequest(`${config.backendUrl}/api/health`);
  const passed = response.ok && response.data.status === 'ok';
  logTest('Server Health Check', passed, passed ? 'Server is running' : `Status: ${response.status}`);

  return passed;
}

// Test 2: Check NOWPayments configuration
async function testNowPaymentsConfig() {
  console.log('\n⚙️ Testing NOWPayments Configuration...');

  const response = await makeRequest(`${config.backendUrl}/api/payments/usdt/config`);
  const passed = response.ok && response.data.apiKey === 'Set';

  logTest('NOWPayments Config Check', passed,
    passed ? 'Configuration is valid' : `API Key: ${response.data?.apiKey || 'Unknown'}`);

  if (response.ok) {
    console.log(`   Sandbox Mode: ${response.data.sandboxMode}`);
    console.log(`   Base URL: ${response.data.baseUrl}`);
  }

  return passed;
}

// Test 3: Create USDT Payment
async function testCreateUSDTPayment() {
  console.log('\n💰 Testing USDT Payment Creation...');

  const paymentData = {
    telegramId: config.telegramId,
    mneAmount: config.mneAmount,
    description: `Test payment: ${config.mneAmount} MNE`
  };

  const response = await makeRequest(`${config.backendUrl}/api/payments/usdt/create`, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });

  const passed = response.ok && response.data.success;
  logTest('USDT Payment Creation', passed,
    passed ? `Payment ID: ${response.data.paymentId}` : response.data.error || 'Unknown error');

  if (response.ok) {
    console.log(`   Order ID: ${response.data.orderId}`);
    console.log(`   USDT Amount: ${response.data.usdtAmount}`);
    console.log(`   Exchange Rate: ${response.data.exchangeRate}`);
    console.log(`   Payment URL: ${response.data.paymentUrl}`);

    // Store payment info for later tests
    global.testPaymentData = response.data;
  }

  return passed;
}

// Test 4: Check Payment Status
async function testPaymentStatus() {
  console.log('\n📊 Testing Payment Status Check...');

  if (!global.testPaymentData?.paymentId) {
    logTest('Payment Status Check', false, 'No payment ID available from previous test');
    return false;
  }

  const response = await makeRequest(`${config.backendUrl}/api/payments/usdt/status/${global.testPaymentData.paymentId}`);
  const passed = response.ok && response.data.paymentId;

  logTest('Payment Status Check', passed,
    passed ? `Status: ${response.data.status}` : response.data.error || 'Unknown error');

  if (response.ok) {
    console.log(`   Payment Status: ${response.data.status}`);
    console.log(`   Service Status: ${response.data.serviceStatus?.status || 'Unknown'}`);
  }

  return passed;
}

// Test 5: Simulate Webhook (Payment Completion)
async function testWebhookSimulation() {
  console.log('\n🔄 Testing Webhook Simulation...');

  if (!global.testPaymentData?.orderId) {
    logTest('Webhook Simulation', false, 'No order ID available from previous test');
    return false;
  }

  // Create mock webhook data for a completed payment
  const webhookData = {
    payment_id: global.testPaymentData.paymentId,
    order_id: global.testPaymentData.orderId,
    payment_status: 'finished',
    pay_address: 'TTestAddress123456789',
    price_amount: global.testPaymentData.usdtAmount,
    price_currency: 'usd',
    pay_amount: global.testPaymentData.usdtAmount,
    pay_currency: 'usdttrc20',
    order_description: `MNE Purchase: ${config.mneAmount} MNE`,
    purchase_id: 'test_purchase_123',
    outcome_amount: global.testPaymentData.usdtAmount,
    outcome_currency: 'usd',
    payin_extra_id: 'test_tx_hash_123456789',
    smart_contract: 'test_contract_address',
    network: 'tron',
    network_precision: 6,
    time_limit: '30m',
    burning_percent: 0,
    expiration_estimate_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    is_fixed_rate: true,
    is_fee_paid_by_user: false,
    valid_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    type: 'invoice',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Create signature for webhook
  const payload = JSON.stringify(webhookData);
  const signature = crypto
    .createHmac('sha256', config.nowpaymentsIpnSecret || 'test_secret')
    .update(payload)
    .digest('hex');

  const response = await makeRequest(`${config.backendUrl}/api/payments/usdt/webhook`, {
    method: 'POST',
    headers: {
      'x-nowpayments-sig': signature
    },
    body: payload
  });

  const passed = response.ok && response.data.success;
  logTest('Webhook Simulation', passed,
    passed ? 'Webhook processed successfully' : response.data.error || 'Unknown error');

  if (response.ok) {
    console.log('   Webhook processed successfully');
  }

  return passed;
}

// Test 6: Check Payment History
async function testPaymentHistory() {
  console.log('\n📜 Testing Payment History...');

  const response = await makeRequest(`${config.backendUrl}/api/payments/usdt/history/${config.telegramId}`);
  const passed = response.ok && Array.isArray(response.data);

  logTest('Payment History Check', passed,
    passed ? `Found ${response.data.length} payments` : response.data.error || 'Unknown error');

  if (response.ok && response.data.length > 0) {
    const latestPayment = response.data[0];
    console.log(`   Latest Payment: ${latestPayment.orderId}`);
    console.log(`   Amount: ${latestPayment.amount} ${latestPayment.currency}`);
    console.log(`   Status: ${latestPayment.status}`);
  }

  return passed;
}

// Test 7: Test Direct Deposit Function (USD)
async function testDirectDeposit() {
  console.log('\n💵 Testing Direct Deposit Function (USD)...');

  const depositData = {
    amount: config.testAmount,
    currency: 'USD'
  };

  const response = await makeRequest(`${config.backendUrl}/api/user/${config.telegramId}/deposit`, {
    method: 'POST',
    body: JSON.stringify(depositData)
  });

  const passed = response.ok && response.data.message === 'Deposit successful';
  logTest('Direct USD Deposit', passed,
    passed ? 'Deposit processed successfully' : response.data.error || 'Unknown error');

  return passed;
}

// Test 8: Test Direct Deposit Function (MNE)
async function testDirectDepositMNE() {
  console.log('\n🪙 Testing Direct Deposit Function (MNE)...');

  const depositData = {
    amount: config.mneAmount,
    currency: 'MNE'
  };

  const response = await makeRequest(`${config.backendUrl}/api/user/${config.telegramId}/deposit`, {
    method: 'POST',
    body: JSON.stringify(depositData)
  });

  const passed = response.ok && response.data.message === 'Deposit successful';
  logTest('Direct MNE Deposit', passed,
    passed ? 'MNE deposit processed successfully' : response.data.error || 'Unknown error');

  return passed;
}

// Test 9: Test Error Scenarios
async function testErrorScenarios() {
  console.log('\n🚨 Testing Error Scenarios...');

  // Test invalid amount
  const invalidAmountResponse = await makeRequest(`${config.backendUrl}/api/payments/usdt/create`, {
    method: 'POST',
    body: JSON.stringify({
      telegramId: config.telegramId,
      mneAmount: -10
    })
  });

  const invalidAmountPassed = !invalidAmountResponse.ok;
  logTest('Invalid Amount Rejection', invalidAmountPassed,
    invalidAmountPassed ? 'Correctly rejected negative amount' : 'Should have rejected negative amount');

  // Test missing telegram ID
  const missingIdResponse = await makeRequest(`${config.backendUrl}/api/payments/usdt/create`, {
    method: 'POST',
    body: JSON.stringify({
      mneAmount: config.mneAmount
    })
  });

  const missingIdPassed = !missingIdResponse.ok;
  logTest('Missing Telegram ID Rejection', missingIdPassed,
    missingIdPassed ? 'Correctly rejected missing telegram ID' : 'Should have rejected missing telegram ID');

  return invalidAmountPassed && missingIdPassed;
}

// Main test runner
async function runAllTests() {
  console.log('Starting comprehensive NOWPayments deposit function tests...\n');

  try {
    // Run all tests
    await testServerHealth();
    await testNowPaymentsConfig();
    await testCreateUSDTPayment();
    await testPaymentStatus();
    await testWebhookSimulation();
    await testPaymentHistory();
    await testDirectDeposit();
    await testDirectDepositMNE();
    await testErrorScenarios();

    // Print summary
    console.log('\n📋 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);

    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! NOWPayments deposit function is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the configuration and try again.');
    }

    // Detailed results
    console.log('\n📝 Detailed Results:');
    testResults.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}${test.details ? ` - ${test.details}` : ''}`);
    });

  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.log('💡 Try running with: node --experimental-fetch test-nowpayments-deposit.js');
  process.exit(1);
}

// Run the tests
runAllTests().catch(console.error);
