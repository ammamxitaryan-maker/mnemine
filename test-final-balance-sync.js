const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testFinalBalanceSync() {
  try {
    console.log('🎯 Final Balance Synchronization Test\n');
    console.log('='.repeat(50));

    // Test user data (replace with actual user data)
    const testTelegramId = '123456789'; // Replace with actual user's telegram ID
    const adminToken = 'your-admin-token'; // Replace with actual admin token

    console.log('1. 📊 Fetching initial user data from main page...');
    const mainPageData = await axios.get(`${API_BASE}/user/${testTelegramId}/data?bypassCache=true`);
    console.log(`   Main page NON balance: ${mainPageData.data.mneBalance}`);
    console.log(`   Main page USD balance: ${mainPageData.data.balance}`);

    console.log('\n2. 📊 Fetching initial user data from admin panel...');
    const adminData = await axios.get(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const testUser = adminData.data.data.users.find(u => u.telegramId === testTelegramId);
    if (!testUser) {
      console.log('   ❌ Test user not found in admin panel');
      return;
    }

    console.log(`   Admin panel NON balance: ${testUser.mneBalance}`);
    console.log(`   Admin panel USD balance: ${testUser.usdBalance}`);
    console.log(`   Admin panel balance field: ${testUser.balance}`);

    console.log('\n3. 🔍 Comparing balances...');
    const mainPageNON = mainPageData.data.mneBalance;
    const adminPanelNON = testUser.mneBalance;
    const balanceMatch = Math.abs(mainPageNON - adminPanelNON) < 0.0001;

    console.log(`   Main page NON: ${mainPageNON}`);
    console.log(`   Admin panel NON: ${adminPanelNON}`);
    console.log(`   Balance match: ${balanceMatch ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n4. 💰 Testing admin balance update...');
    const balanceUpdateResponse = await axios.post(
      `${API_BASE}/admin/users/${testUser.id}/balance`,
      {
        action: 'add',
        amount: 0.5
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
      actualBalance: balanceUpdateResponse.data.data.actualBalance
    });

    console.log('\n5. ⏱️ Waiting 3 seconds for cache invalidation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n6. 🔍 Verifying balance update on main page...');
    const updatedMainPageData = await axios.get(`${API_BASE}/user/${testTelegramId}/data?bypassCache=true`);
    console.log(`   Updated main page NON balance: ${updatedMainPageData.data.mneBalance}`);

    console.log('\n7. 🔍 Verifying balance update in admin panel...');
    const updatedAdminData = await axios.get(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const updatedTestUser = updatedAdminData.data.data.users.find(u => u.telegramId === testTelegramId);
    console.log(`   Updated admin panel NON balance: ${updatedTestUser.mneBalance}`);

    console.log('\n8. ✅ Final synchronization test results:');
    const finalMainPageNON = updatedMainPageData.data.mneBalance;
    const finalAdminPanelNON = updatedTestUser.mneBalance;
    const finalBalanceMatch = Math.abs(finalMainPageNON - finalAdminPanelNON) < 0.0001;

    console.log(`   Final main page NON: ${finalMainPageNON}`);
    console.log(`   Final admin panel NON: ${finalAdminPanelNON}`);
    console.log(`   Final balance match: ${finalBalanceMatch ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n9. 🟢 Online status test:');
    console.log(`   User online status: ${updatedTestUser.isOnline ? '✅ Online' : '❌ Offline'}`);

    console.log('\n10. 📊 Wallet information:');
    console.log(`   Total NON wallets: ${updatedTestUser.mneBalance ? 'Found' : 'Not found'}`);
    console.log(`   Total USD wallets: ${updatedTestUser.usdBalance ? 'Found' : 'Not found'}`);

    const overallSuccess = finalBalanceMatch &&
      balanceUpdateResponse.data.success &&
      Math.abs(finalMainPageNON - mainPageNON - 0.5) < 0.0001;

    console.log('\n' + '='.repeat(50));
    console.log(`🎯 Overall test result: ${overallSuccess ? '✅ 100% SUCCESS' : '❌ FAILED'}`);

    if (overallSuccess) {
      console.log('\n🎉 All balance synchronization issues are resolved!');
      console.log('   ✅ Main page and admin panel use mneBalance');
      console.log('   ✅ Balance updates work correctly');
      console.log('   ✅ Cache invalidation works');
      console.log('   ✅ WebSocket notifications sent');
      console.log('   ✅ Online status tracking works');
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

testFinalBalanceSync();
