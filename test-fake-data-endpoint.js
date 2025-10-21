// Test script to verify the fake data endpoint works correctly
const fetch = require('node-fetch');

async function testFakeDataEndpoint() {
  try {
    console.log('Testing fake data endpoint...');

    const backendUrl = 'http://localhost:10112';
    const endpoint = `${backendUrl}/api/stats/fake`;

    console.log(`Fetching from: ${endpoint}`);

    const response = await fetch(endpoint);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fake data endpoint working!');
      console.log('Response:', JSON.stringify(data, null, 2));

      // Verify the data structure
      if (data.success && data.data) {
        const stats = data.data;
        console.log('\n📊 Fake Stats:');
        console.log(`Total Users: ${stats.totalUsers}`);
        console.log(`Online Users: ${stats.onlineUsers}`);
        console.log(`New Users Today: ${stats.newUsersToday}`);
        console.log(`Active Users: ${stats.activeUsers}`);
        console.log(`Last Update: ${stats.lastUpdate}`);
        console.log(`Data Source: ${stats.dataSource}`);
        console.log(`Update Interval: ${stats.updateInterval}`);
        console.log(`Is Real Data: ${stats.isRealData}`);
      }
    } else {
      console.log('❌ Endpoint failed with status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error testing endpoint:', error.message);
  }
}

// Test multiple times to see the data changing
async function testMultipleRequests() {
  console.log('\n🔄 Testing multiple requests to see data changes...\n');

  for (let i = 1; i <= 3; i++) {
    console.log(`--- Request ${i} ---`);
    await testFakeDataEndpoint();

    if (i < 3) {
      console.log('\nWaiting 2 seconds before next request...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Run the tests
testMultipleRequests().catch(console.error);
