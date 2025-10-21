const axios = require('axios');

const API_BASE = 'http://localhost:10112/api';

async function testInvestment() {
  try {
    console.log('🧪 Testing Investment Balance Update...\n');

    // Test user data (you can replace with a real telegramId)
    const testTelegramId = '123456789'; // Replace with your actual telegramId

    console.log('1. Getting initial user data...');
    const initialData = await axios.get(`${API_BASE}/user/${testTelegramId}/data?bypassCache=true`);
    console.log('Initial balance:', initialData.data.availableBalance);

    if (initialData.data.availableBalance < 3) {
      console.log('❌ User does not have enough balance for testing (need at least 3 NON)');
      console.log('Current balance:', initialData.data.availableBalance);
      return;
    }

    console.log('\n2. Creating investment slot...');
    const investmentResponse = await axios.post(`${API_BASE}/user/${testTelegramId}/invest`, {
      amount: 3
    });
    console.log('Investment response:', investmentResponse.data);

    console.log('\n3. Getting updated user data...');
    const updatedData = await axios.get(`${API_BASE}/user/${testTelegramId}/data?bypassCache=true`);
    console.log('Updated balance:', updatedData.data.availableBalance);

    const expectedBalance = initialData.data.availableBalance - 3;
    const actualBalance = updatedData.data.availableBalance;

    console.log('\n4. Verifying balance update...');
    console.log('Expected balance:', expectedBalance);
    console.log('Actual balance:', actualBalance);

    if (Math.abs(actualBalance - expectedBalance) < 0.001) {
      console.log('✅ Balance update successful!');
    } else {
      console.log('❌ Balance update failed!');
    }

    console.log('\n5. Getting investment slots...');
    const slotsResponse = await axios.get(`${API_BASE}/user/${testTelegramId}/myslots`);
    console.log('Active slots:', slotsResponse.data.slots.filter(s => s.status === 'active').length);
    console.log('Total invested:', slotsResponse.data.slots.reduce((sum, slot) => sum + slot.principal, 0));

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testInvestment();
