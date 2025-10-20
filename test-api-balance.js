const axios = require('axios');

async function testUserBalance(telegramId) {
  console.log(`\n=== Testing API balance for user ${telegramId} ===`);

  try {
    const response = await axios.get(`http://localhost:3001/api/user/${telegramId}/data`);

    console.log('✅ API Response:');
    console.log('  Available Balance:', response.data.availableBalance);
    console.log('  Balance:', response.data.balance);
    console.log('  USD Equivalent:', response.data.usdEquivalent);

    if (response.data.availableBalance === 3.0) {
      console.log('🎉 Balance is correct: 3.0 NON');
    } else {
      console.log('❌ Balance is incorrect:', response.data.availableBalance);
    }

  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

// Test with first user
testUserBalance('5698575806');
