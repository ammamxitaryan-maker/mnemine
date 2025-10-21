// Test script for API endpoint
// Run with: node test-api-endpoint.js

const http = require('http');

console.log('=== Testing API Endpoint ===\n');

// Test the enhanced stats endpoint
const options = {
  hostname: 'localhost',
  port: 10112,
  path: '/api/stats/enhanced',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing: http://localhost:10112/api/stats/enhanced');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\nResponse:');
      console.log(JSON.stringify(jsonData, null, 2));

      if (jsonData.success && jsonData.data) {
        console.log('\n✅ API endpoint working correctly!');
        console.log(`📊 Total Users: ${jsonData.data.totalUsers?.toLocaleString() || 'N/A'}`);
        console.log(`🟢 Online Users: ${jsonData.data.onlineUsers?.toLocaleString() || 'N/A'}`);
        console.log(`📈 New Users Today: ${jsonData.data.newUsersToday?.toLocaleString() || 'N/A'}`);
        console.log(`👥 Active Users: ${jsonData.data.activeUsers?.toLocaleString() || 'N/A'}`);
        console.log(`🕒 Last Update: ${jsonData.data.lastUpdate || 'N/A'}`);
        console.log(`📊 Data Source: ${jsonData.data.dataSource || 'N/A'}`);
        console.log(`🎭 Is Real Data: ${jsonData.data.isRealData || 'N/A'}`);
      } else {
        console.log('\n❌ API endpoint returned error or invalid data');
      }
    } catch (error) {
      console.log('\n❌ Failed to parse JSON response:');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log(`❌ Request failed: ${error.message}`);
  console.log('Make sure the server is running on port 10112');
});

req.setTimeout(5000, () => {
  console.log('❌ Request timeout');
  req.destroy();
});

req.end();
