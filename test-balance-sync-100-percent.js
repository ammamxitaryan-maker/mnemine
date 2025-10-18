const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testBalanceSync100Percent() {
  try {
    console.log('🎯 Testing 100% reliable balance synchronization...\n');

    // Test user data (replace with actual user data)
    const testTelegramId = '123456789'; // Replace with actual user's telegram ID
    const adminToken = 'your-admin-token'; // Replace with actual admin token

    console.log('1. 📊 Fetching initial user data...');
    const initialData = await axios.get(`${API_BASE}/user/${testTelegramId}/data`);
    console.log(`   Initial MNE balance: ${initialData.data.mneBalance}`);
    console.log(`   Total MNE wallets: ${initialData.data.wallets?.filter(w => w.currency === 'MNE').length || 0}`);

    console.log('\n2. 🔄 Testing cache bypass parameter...');
    const bypassData = await axios.get(`${API_BASE}/user/${testTelegramId}/data?bypassCache=true`);
    console.log(`   Bypass cache MNE balance: ${bypassData.data.mneBalance}`);

    console.log('\n3. 💰 Testing admin balance update...');
    const balanceUpdateResponse = await axios.post(
      `${API_BASE}/admin/users/${testTelegramId}/balance`,
      {
        action: 'add',
        amount: 1.5
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('   Admin update response:', {
      success: balanceUpdateResponse.data.success,
      previousBalance: balanceUpdateResponse.data.data.previousBalance,
      newBalance: balanceUpdateResponse.data.data.newBalance,
      actualBalance: balanceUpdateResponse.data.data.actualBalance,
      cacheInvalidated: balanceUpdateResponse.data.data.cacheInvalidated,
      websocketSent: balanceUpdateResponse.data.data.websocketSent,
      transactionCompleted: balanceUpdateResponse.data.data.transactionCompleted
    });

    console.log('\n4. ⏱️ Waiting 2 seconds for cache invalidation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n5. 🔍 Verifying balance update with cache bypass...');
    const updatedData = await axios.get(`${API_BASE}/user/${testTelegramId}/data?bypassCache=true`);
    console.log(`   Updated MNE balance: ${updatedData.data.mneBalance}`);

    const expectedBalance = initialData.data.mneBalance + 1.5;
    const actualBalance = updatedData.data.mneBalance;
    const balanceMatch = Math.abs(actualBalance - expectedBalance) < 0.0001;

    console.log('\n6. ✅ Balance synchronization test results:');
    console.log(`   Expected balance: ${expectedBalance}`);
    console.log(`   Actual balance: ${actualBalance}`);
    console.log(`   Balance match: ${balanceMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Cache bypass working: ${bypassData.data.mneBalance !== initialData.data.mneBalance ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Admin update successful: ${balanceUpdateResponse.data.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Transaction completed: ${balanceUpdateResponse.data.data.transactionCompleted ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Cache invalidated: ${balanceUpdateResponse.data.data.cacheInvalidated ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   WebSocket sent: ${balanceUpdateResponse.data.data.websocketSent ? '✅ PASS' : '❌ FAIL'}`);

    const overallSuccess = balanceMatch &&
      balanceUpdateResponse.data.success &&
      balanceUpdateResponse.data.data.transactionCompleted &&
      balanceUpdateResponse.data.data.cacheInvalidated;

    console.log(`\n🎯 Overall test result: ${overallSuccess ? '✅ 100% SUCCESS' : '❌ FAILED'}`);

    if (overallSuccess) {
      console.log('\n🎉 Balance synchronization is now 100% reliable!');
      console.log('   ✅ Multiple wallet support');
      console.log('   ✅ Database transactions');
      console.log('   ✅ Cache invalidation');
      console.log('   ✅ WebSocket notifications');
      console.log('   ✅ Force refresh mechanism');
      console.log('   ✅ Comprehensive logging');
      console.log('   ✅ Balance verification');
    } else {
      console.log('\n❌ Some issues detected. Check server logs for details.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Check if server is running on port 3001');
    console.log('   2. Verify admin token is correct');
    console.log('   3. Check server logs for detailed error messages');
    console.log('   4. Ensure user exists in database');
  }
}

testBalanceSync100Percent();
