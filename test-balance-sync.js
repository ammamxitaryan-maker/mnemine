const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testBalanceSync() {
  try {
    console.log('🧪 Testing balance synchronization between admin panel and user interface...\n');

    // Test user data (replace with actual user data)
    const testTelegramId = '123456789'; // Replace with actual user's telegram ID

    console.log('1. Fetching initial user data...');
    const initialData = await axios.get(`${API_BASE}/user/${testTelegramId}/data`);
    console.log(`   Initial MNE balance: ${initialData.data.mneBalance}`);

    console.log('\n2. Testing cache bypass parameter...');
    const bypassData = await axios.get(`${API_BASE}/user/${testTelegramId}/data?bypassCache=true`);
    console.log(`   Bypass cache MNE balance: ${bypassData.data.mneBalance}`);

    console.log('\n3. Checking wallet information...');
    console.log(`   Total wallets: ${initialData.data.wallets?.length || 0}`);
    if (initialData.data.wallets) {
      const mneWallets = initialData.data.wallets.filter(w => w.currency === 'MNE');
      console.log(`   MNE wallets: ${mneWallets.length}`);
      mneWallets.forEach((wallet, index) => {
        console.log(`     Wallet ${index + 1}: ${wallet.balance} MNE`);
      });
    }

    console.log('\n✅ Balance sync test completed!');
    console.log('\n📝 To test admin balance updates:');
    console.log('   1. Go to admin panel');
    console.log('   2. Add MNE to user balance');
    console.log('   3. Check if balance updates in user interface');
    console.log('   4. Check server logs for cache invalidation messages');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBalanceSync();
